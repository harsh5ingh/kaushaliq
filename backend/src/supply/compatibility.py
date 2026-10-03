"""Legacy ten-check response projected from the reusable Phase 3 engine."""
from src.gaps.adapters import measure
from src.gaps.engine import calculate
VERSION = 'demand-training-compatibility-1.0'


def assess(demand, supply, sources, mappings=(), *, demand_version='', supply_version='', geography_version=''):
    result = calculate(measure(demand, 'demand', sources, demand_version, geography_version),
                       measure(supply, 'supply', sources, supply_version, geography_version), sources, mappings=mappings)
    dimensions = ('geography', 'time', 'occupation', 'skill', 'sector', 'unit', 'metric', 'quality', 'source', 'mapping')
    checks = [{k: getattr(c, k) for k in ('dimension', 'status', 'reason_code')}
              for dim in dimensions for c in result.checks if c.dimension == dim]
    status = ('UNAVAILABLE' if demand is None or supply is None else 'COMPATIBLE' if result.readiness == 'READY'
              else 'INCOMPATIBLE' if any(c['status'] == 'INCOMPATIBLE' for c in checks) else 'INSUFFICIENT_EVIDENCE')
    return {'status': status, 'reason_codes': [c['reason_code'] for c in checks if c['status'] != 'COMPATIBLE'] if checks else result.reason_codes,
            'checks': checks, 'evidence': [r['evidence'] for r in (demand, supply) if r],
            'demand_signal_id': demand['signal_id'] if demand else None,
            'supply_signal_id': supply['supply_signal_id'] if supply else None,
            'gap_status': result.gap_status, 'gap_value': result.gap_value, 'readiness': result.readiness,
            'supply_status': 'SUPPLY_AVAILABLE_BUT_INCOMPATIBLE' if status == 'INCOMPATIBLE' else 'GAP_UNAVAILABLE',
            'methodology_version': VERSION}
