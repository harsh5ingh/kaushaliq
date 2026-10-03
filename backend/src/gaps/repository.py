"""Version-keyed read model over existing immutable publications; no new ingestion."""
from functools import lru_cache
import hashlib
from src.gaps.adapters import measure
from src.gaps.engine import calculate, VERSION
from src.demand.repository import public_source


@lru_cache(maxsize=8)
def assessments(demand_version, supply_version, base_version, dimension):
    # Repositories authenticate snapshots and raw-source reproduction before use.
    from src.demand.repository import read_demand
    from src.supply.repository import read_supply
    demand, dv, _ = read_demand()
    supply, sv, _ = read_supply()
    if (dv, sv, demand['base_version'], supply['base_version']) != (demand_version, supply_version, base_version, base_version):
        raise ValueError('Publication changed during query')
    sources = {s['source_id']: s for s in demand['sources'] + supply['sources']}
    by_geography = {}
    for row in supply['signals']:
        by_geography.setdefault(row['geography_id'], []).append(row)
    results = []
    for d in demand['signals']:
        # Exact geography matching only, without allocation or aggregation.
        candidates = by_geography.get(d['geography_id'], []) if d['geography_id'] else []
        for s in candidates:
            results.append(calculate(measure(d, 'demand', sources, dv, base_version),
                                     measure(s, 'supply', sources, sv, base_version), sources,
                                     dimension=dimension, mappings=supply['mappings']).model_dump(mode='json'))
    return results


def context():
    from src.demand.repository import read_demand
    from src.supply.repository import read_supply
    from src.data_pipeline.repository import read_snapshot
    demand, dv, _ = read_demand()
    supply, sv, _ = read_supply()
    base, bv = read_snapshot()
    if demand['base_version'] != bv or supply['base_version'] != bv:
        raise ValueError('Inconsistent base publication')
    identity = hashlib.sha256('|'.join((VERSION, dv, sv, bv)).encode()).hexdigest()
    sources = {s['source_id']: public_source(s) for s in demand['sources'] + supply['sources'] if s.get('connected')}
    return {'version': identity, 'engine_version': VERSION, 'demand_version': dv, 'supply_version': sv,
            'base_version': bv, 'data_mode': 'verified', 'sources': list(sources.values()),
            'regions': base['regions'], 'supply_quality': supply['quality']}


def select(rows, filters):
    def matches(row):
        d, s = row['demand'], row['supply']
        for key, value in filters.items():
            if value is None or value == '':
                continue
            if key in ('readiness', 'quality_status', 'gap_direction'):
                if row[key] != value: return False
            elif key in ('geography_id', 'geography_level'):
                if d[key] != value or s[key] != value: return False
            elif key == 'reference_period':
                if d[key] != value or s[key] != value: return False
            elif key in ('occupation_code', 'skill_code', 'sector_code'):
                dim = key.removesuffix('_code')
                if not d['classifications'].get(dim) or not s['classifications'].get(dim): return False
                if d['classifications'][dim]['code'] != value or s['classifications'][dim]['code'] != value: return False
        return True
    return [r for r in rows if matches(r)]


def public_context(ctx):
    return {k: v for k, v in ctx.items() if k not in ('regions', 'supply_quality')}
