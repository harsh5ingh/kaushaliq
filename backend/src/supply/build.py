"""Reproducible supply publication derived from the existing validated base and raw cells."""
import json
from pathlib import Path
from src.data_pipeline.acquire import DATA
from src.data_pipeline.build import read_sources, html_tables, training, evidence, digest, write_json, region_key
from src.data_pipeline.repository import read_snapshot
from src.demand.normalize import normalize_count, normalize_period, normalize_geography, stable_id
from src.supply.models import SupplySnapshot

REGISTRY=DATA/'metadata/supply_source_registry.json'
TAXONOMY_REGISTRY=DATA/'metadata/taxonomy_source_registry.json'
VERSION='pmkvy-output-infrastructure-1.0'


def output_cells(source):
    candidates=[]
    for table in html_tables(source):
        if len(table)>2 and table[0]==['State','FY-23-24','FY-24-25','FY-25-26','FY-26-27'] and table[1]==['Trained','Certified']*4:
            if table not in candidates:candidates.append(table)
    if len(candidates)!=1:raise ValueError('PMKVY output schema changed')
    return {(region_key(r[0]),f'{2023+i//2}-{str(2024+i//2)[-2:]}','trained' if i%2==0 else 'certified'):(r[0],c) for r in candidates[0][2:] if len(r)==9 for i,c in enumerate(r[1:])}


def signal(source, regions, label, raw, metric, temporal, partial, transforms=()):
    ev=evidence(source,f'Annexure {"II" if metric=="TRAINING_CENTRES" else "I"}; {label}; {temporal["reference_period"]}; {metric}',*transforms)
    region,geo=normalize_geography(label,regions,ev)
    if region is None:raise ValueError('Unmapped supply geography must be quarantined')
    original_unit='centres' if metric=='TRAINING_CENTRES' else 'reported persons'
    # Reuse the strict integral parser only; this does not change the metric to vacancies.
    parsed=normalize_count(raw[:-1] if raw.endswith('$') else raw,'vacancies')
    locator=ev['locator']
    return {'supply_signal_id':stable_id(source['source_id'],locator),'source_id':source['source_id'],'source_record_id':locator,'provenance_id':stable_id(source['sha256'],locator),
        **{k:v for k,v in temporal.items() if k!='observed_at'},'observation_date':temporal['observed_at'],'publication_date':source['publication_date'],'as_of':'2026-06-30','partial':partial,
        'geography_id':region['region_id'],'geography_level':region['region_type'],'source_geography_label':label,'geography_mapping_status':geo['status'],
        'metric':metric,'semantic_category':'TRAINING_INFRASTRUCTURE' if metric=='TRAINING_CENTRES' else 'TRAINING_OUTPUT','programme':'PMKVY','population':'Published PMKVY training centres' if metric=='TRAINING_CENTRES' else 'PMKVY reported trained/certified persons; availability and employment unknown',
        'value':parsed,'normalized_value':parsed,'original_value':raw,'original_unit':original_unit,'unit':'centres' if metric=='TRAINING_CENTRES' else 'persons','status':'OBSERVED','quality_status':'VALID','mapping_status':'UNAVAILABLE','methodology_version':VERSION,'evidence':ev}


def infrastructure(source, regions):
    tables=[]
    header=['S.No.','State/UT Name','PMKVY (Training Centres)','NAPS (Establishments)']
    for table in html_tables(source):
        if table and table[0]==header and table not in tables:tables.append(table)
    if len(tables)!=1 or len(tables[0])!=37:raise ValueError('PMKVY infrastructure schema/duplicate copies changed')
    path=DATA/source['raw_path'];text=path.read_text(encoding='utf-8-sig')
    if '2289890' not in text or '27 JUL 2026' not in text or '30.06.2026' not in text or 'Including 6 in Konaseema District' not in text:
        raise ValueError('Infrastructure release/date/footnote changed')
    result=[];seen=set()
    for row in tables[0][1:]:
        if len(row)!=4 or row[0] or not row[1] or row[1] in seen:raise ValueError('Invalid/duplicate infrastructure source record')
        seen.add(row[1]);label=row[1];raw=row[2]
        if '$' in raw and (label!='Andhra Pradesh' or raw!='527$'):raise ValueError('Unreviewed numeric footnote')
        # Explicit published alias only, no city/district distribution or double-counted footnote.
        normalized_label=label.removeprefix('The ') if label=='The Dadra & Nagar Haveli and Daman & Diu' else label
        row_signal=signal(source,regions,normalized_label,raw,'TRAINING_CENTRES',normalize_period('2026-06-30','POINT'),False,('Integer parsing; published State/UT reference match; no seats or throughput inferred',)+(('Strip $ marker only; published527 includes6 Konaseema centres; do not add or split6',) if raw.endswith('$') else ()))
        row_signal['source_geography_label']=label
        if label!=normalized_label:row_signal['evidence']['transformations'].append('Published The-prefix removed only for merged UT reference match; original label retained')
        result.append(row_signal)
    if len({r['geography_id'] for r in result})!=36:raise ValueError('Infrastructure geography mismatch')
    return result


def compile_signals(base, sources):
    by_id={s['source_id']:s for s in sources};output=by_id['pmkvy-pib-2026'];cells=output_cells(output)
    # Existing adapter independently validates all columns and the sole known reconciliation exception.
    parsed=training(output,base['regions'])
    if {(r['observation_id'],r['value']) for r in parsed}!={(r['observation_id'],r['value']) for r in base['training']}:
        raise ValueError('Base training publication no longer matches raw source')
    result=[]
    for row in base['training']:
        label,raw=cells[(row['region_id'],row['period'],row['indicator'])]
        result.append(signal(output,base['regions'],label,raw,row['indicator'].upper(),normalize_period(row['period'],'FISCAL_YEAR'),row['partial'],('Published fiscal-year activity counts; original cell retained','Certified cohorts may differ from trained cohorts; no conversion, availability or capacity inferred')))
    result.extend(infrastructure(by_id['pmkvy-centres-pib-2026'],base['regions']))
    return result


def coverage_for(records):
    """Record coverage, never summed trainees or inferred national infrastructure."""
    result=[]
    for metric in ['TRAINED','CERTIFIED','TRAINING_CENTRES','SEATS','CAPACITY','OCCUPATION_MAPPING','SKILL_MAPPING']:
        rows=[r for r in records if r['metric']==metric]
        result.append({'dimension':metric,'status':'PARTIAL' if metric=='TRAINED' else 'VERIFIED' if rows else 'UNAVAILABLE','national':sum(r['geography_level']=='country' for r in rows),'state_ut':sum(r['geography_level'] in {'state','ut'} for r in rows),'district':0,'source_ids':sorted({r['source_id'] for r in rows}),'periods':sorted({r['reference_period'] for r in rows})})
    return result


def validate(value, base):
    snapshot=SupplySnapshot.model_validate(value).model_dump(mode='json')
    sources={s['source_id']:s for s in snapshot['sources']};regions={r['region_id']:r for r in base['regions']}
    approved={s['source_id']:s for s in base['sources'] if s['source_id'] in {'pmkvy-pib-2026','nic-2008'}}
    approved.update({s['source_id']:s for s in read_sources(REGISTRY)})
    if len(sources)!=len(snapshot['sources']) or sources.keys()!=approved.keys():raise ValueError('Unexpected/duplicate supply source')
    for key,source in sources.items():
        if source['sha256']!=approved[key]['sha256'] or source['url']!=approved[key]['url']:raise ValueError('Supply source registry mismatch')
    ids=set();source_records=set()
    for row in snapshot['signals']:
        identity=(row['source_id'],row['source_record_id'])
        if row['supply_signal_id'] in ids or identity in source_records:raise ValueError('Duplicate supply/source record')
        ids.add(row['supply_signal_id']);source_records.add(identity)
        if row['geography_id'] not in regions or regions[row['geography_id']]['region_type']!=row['geography_level']:raise ValueError('Invalid geography; no district allocation')
        if row['source_id']!=row['evidence']['source_id'] or row['source_id'] not in sources or sources[row['source_id']].get('sha256')!=row['evidence']['raw_sha256'] or not sources[row['source_id']].get('connected'):raise ValueError('Unbound source evidence')
        if row['methodology_version']!=VERSION or row['status']!='OBSERVED' or any(row[k] is not None for k in ['occupation_code','skill_code','qualification_code','sector_code']):raise ValueError('Unsupported adapter classification/status')
    expected=SupplySnapshot.model_validate({**snapshot,'signals':compile_signals(base,snapshot['sources'])}).model_dump(mode='json')['signals']
    if snapshot['signals']!=expected:raise ValueError('Supply values/metadata differ from reviewed raw observations')
    if snapshot['coverage']!=coverage_for(snapshot['signals']):raise ValueError('Coverage differs from verified record dimensions')
    # Reference contracts exist, but no occupation/skill/qualification acquisition adapter
    # has been approved. A training-source checksum is not evidence for invented codes.
    if any(snapshot[key] for key in ['occupations','skills','qualifications','mappings']):
        raise ValueError('Reference publication requires a reviewed taxonomy acquisition adapter')
    if len(snapshot['signals'])!=323 or snapshot['quality']['published_records']!=323:raise ValueError('Supply coverage changed without adapter review')
    if snapshot['quality']['quarantined']!=base['quality']['quarantined'] or snapshot['quality']['output_records']!=287 or snapshot['quality']['infrastructure_records']!=36 or snapshot['capacity']['status']!='UNAVAILABLE':raise ValueError('Quarantine/coverage/capacity state changed without review')
    if len({r['taxonomy_source_id'] for r in snapshot['taxonomy_sources']})!=len(snapshot['taxonomy_sources']):raise ValueError('Duplicate taxonomy source')
    for r in snapshot['taxonomy_sources']:
        if r['status'] in {'VERIFIED','PARTIALLY_VERIFIED'}:
            source=sources.get(r['taxonomy_source_id'],{})
            if source.get('sha256')!=r['snapshot_sha256']:raise ValueError('Taxonomy source checksum unbound')
    return snapshot


def build():
    base,base_version=read_snapshot();new=read_sources(REGISTRY)
    for s in new:s['connected']=True
    sources=[dict(s) for s in base['sources'] if s['source_id'] in {'pmkvy-pib-2026','nic-2008'}]+new
    for s in sources:
        if s['source_id']=='pmkvy-pib-2026':s['publication_date']='2026-08-10'
    taxonomy=json.loads(TAXONOMY_REGISTRY.read_text(encoding='utf-8'))
    for r in taxonomy:
        if r['taxonomy_source_id']=='nic-2008':
            s=next(s for s in sources if s['source_id']=='nic-2008');r.update(snapshot_sha256=s['sha256'],raw_artifact_reference=s['source_id'],accessed_at=s['retrieved_at'])
    records=compile_signals(base,sources)
    coverage=coverage_for(records)
    quality={'status':'VALIDATED_WITH_QUARANTINE','published_records':len(records),'output_records':287,'infrastructure_records':36,'quarantined':base['quality']['quarantined'],'missing':[{'metric':'TRAINED/CERTIFIED','geography_id':'in-lakshadweep','status':'UNAVAILABLE','reason':'Absent from activity source; infrastructure source is separate'}],'mapping_status':'UNAVAILABLE','capacity_status':'UNAVAILABLE','errors':[]}
    snapshot={'methodology_version':VERSION,'base_version':base_version,'sources':sources,'signals':records,'occupations':[],'skills':[],'qualifications':[],'mappings':[],'taxonomy_sources':taxonomy,'coverage':coverage,'quality':quality,'capacity':{'status':'UNAVAILABLE','reason':'No verified seat/throughput capacity dataset ingested; centres are infrastructure, not capacity'}}
    snapshot=validate(snapshot,base)
    write_json(DATA/'staging/supply/extracted.json',snapshot)
    write_json(DATA/'processed/supply/validated.json',snapshot)
    path=DATA/'canonical/supply/snapshot.json';write_json(path,snapshot)
    write_json(path.with_name('manifest.json'),{'schema_version':'supply-1.0','sha256':digest(path),'base_version':base_version,'raw_sha256':{s['source_id']:s['sha256'] for s in sources}})
    write_json(DATA/'metadata/supply_quality.json',quality);write_json(DATA/'metadata/supply_coverage.json',coverage)
    print(json.dumps({'status':quality['status'],'records':len(records),'capacity_status':'UNAVAILABLE'}))


if __name__=='__main__':build()
