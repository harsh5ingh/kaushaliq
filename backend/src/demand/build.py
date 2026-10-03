"""Offline NCS publication adapter. No portal scraping, imputation or inferred codes."""
import json
from pathlib import Path
from src.data_pipeline.acquire import DATA
from src.data_pipeline.build import digest, evidence, html_tables, read_sources, write_json
from src.data_pipeline.repository import read_snapshot
from src.demand.models import DemandSnapshot
from src.demand.normalize import VERSION, mapping, normalize_count, normalize_geography, normalize_period, stable_id

REGISTRY = DATA / 'metadata/demand_source_registry.json'
HEADER = ['Sl. no.', 'State/ UT', 'Active Employers', 'Active Vacancies']


def extract(source):
    content = (DATA / source['raw_path']).read_text(encoding='utf-8-sig')
    # Observation date is in the release narrative, separate from its publication date.
    if '14.07.2025' not in content or '24 JUL 2025' not in content or '2147927' not in content:
        raise ValueError('Unreviewed publication/date change')
    candidates = [t for t in html_tables(source) if t and t[0] == HEADER]
    if not candidates or any(t != candidates[0] for t in candidates):
        raise ValueError('Missing or conflicting responsive Annexure tables')
    rows = candidates[0]
    if len(rows) != 41 or any(len(r) != 4 or r[0] != f'{i}.' for i, r in enumerate(rows[1:-1], 1)) or len(rows[-1]) != 3 or rows[-1][0] != 'TOTAL':
        raise ValueError('Unexpected NCS Annexure schema')
    extracted = [{'source_record_id': f'Annexure row {r[0]}', 'label': r[1], 'original_value': r[3], 'original_unit': 'vacancies'} for r in rows[1:-1]]
    extracted.append({'source_record_id': 'Annexure TOTAL', 'label': 'Total', 'original_value': rows[-1][2], 'original_unit': 'vacancies'})
    if len({r['label'].casefold() for r in extracted}) != len(extracted):
        raise ValueError('Duplicate source geography labels')
    return extracted, len(candidates)


def normalize_rows(rows, source, regions):
    signals, mappings, quarantine, seen = [], [], [], set()
    for row in rows:
        ev = evidence(source, row['source_record_id'], 'Extract Active Vacancies column; employer column is not demand', 'Parse Indian digit grouping; preserve original value/unit', 'Point-in-time stock: 2025-07-14; publication: 2025-07-24', 'Exact geography label/explicit Total→India alias only; no downscaling', VERSION)
        identifier = row['source_record_id']
        if identifier in seen:
            quarantine.append({'source_record_id': identifier, 'label': row['label'], 'status': 'QUARANTINED', 'reason': 'DUPLICATE_SOURCE_RECORD', 'evidence': ev})
            continue
        seen.add(identifier)
        try:
            count = normalize_count(row['original_value'], row['original_unit'])
        except ValueError:
            quarantine.append({'source_record_id': identifier, 'label': row['label'], 'status': 'UNAVAILABLE' if row['original_value'] == '-' else 'QUARANTINED', 'reason': 'SOURCE_DASH_NOT_ZERO' if row['original_value'] == '-' else 'INVALID_VALUE_OR_UNIT', 'evidence': ev})
            continue
        region, geo = normalize_geography(row['label'], regions, ev)
        relations = [geo] + [mapping(d, None, ev, target_system=s) for d, s in [('occupation', 'NCO-2015'), ('skill', 'NSQF/NOS'), ('sector', 'NIC-2008')]]
        mappings.extend(relations)
        level = region['region_type'] if region else 'multi_state' if row['label'] == 'Multiple States' else 'unknown'
        signals.append({'signal_id': stable_id(source['source_id'], identifier, 'active_vacancies'), 'source_id': source['source_id'], 'source_record_id': identifier, 'provenance_id': stable_id(source['sha256'], identifier),
            **normalize_period(source['observation_period'], 'POINT'), 'publication_date': source['publication_date'],
            'geography_id': region['region_id'] if region else None, 'geography_level': level, 'source_geography_label': row['label'], 'geography_mapping_status': geo['status'],
            'metric': 'active_vacancies', 'value': count, 'normalized_value': count, 'unit': 'vacancies', 'original_value': row['original_value'], 'original_unit': row['original_unit'],
            'status': 'OBSERVED', 'methodology_version': VERSION, 'quality_status': 'VALID' if region else 'WARNING', 'mapping_status': 'UNAVAILABLE', 'mapping_ids': [r['mapping_id'] for r in relations], 'evidence': ev})
    return signals, mappings, quarantine


def validate(snapshot, base):
    sources = {s['source_id']: s for s in snapshot['sources']}
    regions = {r['region_id'] for r in base['regions']}
    mappings = {m['mapping_id']: m for m in snapshot['mappings']}
    if len(mappings) != len(snapshot['mappings']): raise ValueError('Duplicate mapping identity')
    for relation in mappings.values():
        ev = relation['evidence']
        if ev['source_id'] not in sources or ev['raw_sha256'] != sources[ev['source_id']]['sha256']:
            raise ValueError('Invalid mapping provenance')
    signals = snapshot['signals']
    if len({s['signal_id'] for s in signals}) != len(signals) or len({(s['source_id'], s['source_record_id']) for s in signals}) != len(signals): raise ValueError('Duplicate canonical demand identity')
    for signal in signals:
        if signal['geography_id'] is not None and signal['geography_id'] not in regions: raise ValueError('Invalid canonical geography')
        if signal['evidence']['raw_sha256'] != sources[signal['source_id']]['sha256']: raise ValueError('Invalid demand provenance')
        if len(signal['mapping_ids']) != 4 or any(i not in mappings for i in signal['mapping_ids']): raise ValueError('Missing mapping evidence')
        geo = mappings[signal['mapping_ids'][0]]
        if geo['dimension'] != 'geography' or geo['target_code'] != signal['geography_id'] or geo['status'] != signal['geography_mapping_status']: raise ValueError('Conflicting geography mapping')
        if signal['value'] != normalize_count(signal['original_value'], signal['original_unit']): raise ValueError('Nonreproducible normalized value')
        for field, dimension in [('occupation','occupation'),('skill','skill'),('sector','sector')]:
            relation = mappings[signal['mapping_ids'][['geography','occupation','skill','sector'].index(dimension)]]
            if relation['dimension'] != dimension or relation['target_code'] != signal.get(field+'_code'):
                raise ValueError('Conflicting classification mapping')
    return DemandSnapshot.model_validate(snapshot).model_dump(mode='json')


def compile_snapshot():
    base, base_version = read_snapshot()
    sources = read_sources(REGISTRY)
    source = next(s for s in sources if s['source_id'] == 'ncs-active-pib-2025')
    rows, copies = extract(source)
    signals, mappings, quarantine = normalize_rows(rows, source, base['regions'])
    total = next(s for s in signals if s['geography_id'] == 'in')
    components = [s for s in signals if s['geography_id'] != 'in']
    if len(rows) != 40 or len(signals) != 37 or sum(s['value'] for s in components) != total['value']:
        raise ValueError('Source reconciliation failed; no silent repairs permitted')
    source['connected'] = True
    coverage = [
        {'source_id': source['source_id'], 'dimension': 'active_vacancies', 'role': 'demand', 'national': 'OBSERVED', 'national_records': 1, 'state': 'OBSERVED', 'state_records': sum(s['geography_level'] in {'state','ut'} for s in signals), 'district': 'UNAVAILABLE', 'district_records': 0, 'reason': 'NCS portal snapshot only; no occupation, skill, sector or district breakdown'},
        {'source_id': 'PLFS', 'dimension': 'labour_indicators', 'role': 'supply_context', 'national': 'OBSERVED', 'state': 'OBSERVED', 'district': 'UNAVAILABLE', 'records': len(base['labour']), 'reason': 'LFPR/WPR/UR are supply context, not vacancies'},
        {'source_id': 'PMKVY', 'dimension': 'training_counts', 'role': 'administrative_training', 'national': 'OBSERVED', 'state': 'OBSERVED', 'district': 'UNAVAILABLE', 'records': len(base['training']), 'reason': 'Reported training counts are not current supply or seat capacity'},
        {'source_id': 'NIC-2008', 'dimension': 'industry_reference', 'role': 'reference', 'national': 'REFERENCE_ONLY', 'state': 'REFERENCE_ONLY', 'district': 'UNAVAILABLE', 'records': len(base['industries']), 'reason': 'Partial taxonomy; no demand linkage'},
        *[{'source_id': s, 'dimension': d, 'role': 'reference' if s in {'NCO-2015','NSQF/NOS'} else 'unavailable', 'national': 'UNAVAILABLE', 'state': 'UNAVAILABLE', 'district': 'UNAVAILABLE', 'records': 0, 'reason': r} for s,d,r in [('NCO-2015','occupation','Permission-reviewed bulk reference/crosswalk not ingested'), ('NSQF/NOS','skills','Versioned authoritative taxonomy and demand crosswalk not ingested'), ('e-Shram','worker_registry','Worker registrations are not demand; source not ingested'), ('NCS-feed','current_vacancies','No approved documented current vacancy API or record-level feed ingested')]]]
    quality = {'status': 'WARNING', 'source_records': len(rows), 'published_records': len(signals), 'valid_records': sum(s['quality_status']=='VALID' for s in signals), 'warning_records': sum(s['quality_status']=='WARNING' for s in signals), 'quarantined': quarantine, 'identical_responsive_copies': copies, 'reconciliation': 'Published numeric buckets sum to published TOTAL; source dashes remain unavailable, not zeros', 'historical_snapshot': True, 'snapshot_observation_date': source['observation_period'], 'retrieved_at': source['retrieved_at'], 'mapping_counts': {d: {status: sum(m['dimension']==d and m['status']==status for m in mappings) for status in ['EXACT','DOCUMENTED','UNMAPPED','AMBIGUOUS','REQUIRES_REVIEW','UNAVAILABLE']} for d in ['geography','occupation','skill','sector']}}
    snapshot = validate({'schema_version':'demand-1.0','methodology_version':VERSION,'base_version':base_version,'sources':sources,'signals':signals,'mappings':mappings,'coverage':coverage,'quality':quality,
        'forecast': {'status':'UNAVAILABLE','reason':'Insufficient verified historical demand observations'},
        'supply_gap': {'status':'UNAVAILABLE','reason':'NCS vacancy stock, PLFS rates and PMKVY counts have incompatible populations, units and periods', 'required_dimensions':['geography','occupation_or_skill','sector','period','unit','population','methodology']}}, base)
    return snapshot, rows


def build(output=DATA):
    snapshot, rows = compile_snapshot()
    write_json(output / 'staging/demand/extracted.json', rows)
    write_json(output / 'processed/demand/validated.json', snapshot['signals'])
    path = output / 'canonical/demand/snapshot.json'
    write_json(path, snapshot)
    write_json(path.with_name('manifest.json'), {'schema_version':'demand-1.0','sha256':digest(path),'base_version':snapshot['base_version'],'raw_sha256':{s['source_id']:s['sha256'] for s in snapshot['sources']},'methodology_version':VERSION})
    write_json(output / 'metadata/demand_quality.json', snapshot['quality'])
    write_json(output / 'metadata/demand_coverage.json', snapshot['coverage'])
    return {'signals':len(snapshot['signals']),'sha256':digest(path),'base_version':snapshot['base_version']}


if __name__ == '__main__': print(json.dumps(build()))
