"""Public gap assessments; no client-supplied methods, approval or account identifiers."""
from typing import Annotated, Literal
from fastapi import APIRouter, Query, HTTPException
from src.gaps.repository import context, public_context, assessments, select
from src.gaps.models import GapPage, GapEvidenceResponse

router = APIRouter(prefix='/api/v1/intelligence/gaps', tags=['Demand × supply gap readiness'])
Filter = Annotated[str | None, Query(max_length=120)]


def published():
    try: return context()
    except (OSError, ValueError, KeyError, TypeError):
        raise HTTPException(503, detail={'code': 'GAP_PUBLICATION_UNAVAILABLE',
                            'reason': 'Verified demand/supply evidence could not be loaded. No fallback.'}) from None


def rows_for(ctx, dimension):
    try: return assessments(ctx['demand_version'], ctx['supply_version'], ctx['base_version'], dimension)
    except (OSError, ValueError, KeyError, TypeError):
        raise HTTPException(503, detail={'code': 'GAP_PUBLICATION_UNAVAILABLE', 'reason': 'Verified publications changed or failed validation; retry.'}) from None


@router.get('', response_model=GapPage)
def gaps(dimension: Literal['geography','skill','occupation','industry']='skill', geography_id: Filter=None,
         geography_level: Filter=None, reference_period: Filter=None, skill_code: Filter=None,
         occupation_code: Filter=None, sector_code: Filter=None,
         readiness: Literal['READY','PARTIAL','NOT_READY'] | None=None,
         quality_status: Literal['VALID','WARNING','UNAVAILABLE'] | None=None,
         gap_direction: Literal['SHORTFALL','SURPLUS','BALANCED'] | None=None,
         limit: int=Query(50,ge=1,le=500), offset: int=Query(0,ge=0)):
    ctx = published()
    filters = {k: v for k, v in locals().copy().items() if k not in ('ctx','dimension','limit','offset') and v is not None}
    rows = select(rows_for(ctx, dimension), filters)
    ready = [r for r in rows if r['readiness']=='READY']
    status = 'READY' if ready and len(ready)==len(rows) else 'PARTIAL' if ready or any(r['readiness']=='PARTIAL' for r in rows) else 'NOT_READY' if rows else 'EMPTY'
    return {**public_context(ctx), 'status': status, 'gap_status': 'DERIVED' if ready else 'UNAVAILABLE',
            'readiness': 'READY' if status=='READY' else 'PARTIAL' if status=='PARTIAL' else 'NOT_READY',
            'reason_code': None if ready else 'NO_COMPATIBLE_OBSERVATIONS' if rows else 'NO_MATCHING_OBSERVATIONS',
            'dimension': dimension, 'filters': filters, 'total': len(rows), 'calculated_total': len(ready),
            'items': rows[offset:offset+limit], 'limitations': ['Assessment pairs are source context, not comparable measurements. Only READY records contain arithmetic.']}


@router.get('/coverage')
def coverage():
    ctx = published(); rows = rows_for(ctx, 'geography')
    geo_ids = {r['demand']['geography_id'] for r in rows}
    common_periods = sorted({r['demand']['reference_period'] for r in rows if r['demand']['reference_period']==r['supply']['reference_period']})
    capability_rows = []
    for dimension, level in [('national','country'),('state_ut',None),('district','district'),('industry',None),('occupation',None),('skill',None)]:
        candidate_rows = rows if dimension in ('national','state_ut','district') else rows_for(ctx, dimension)
        if level: candidate_rows = [r for r in candidate_rows if r['demand']['geography_level']==level]
        if dimension=='state_ut': candidate_rows = [r for r in candidate_rows if r['demand']['geography_level'] in ('state','ut')]
        count = sum(r['readiness']=='READY' for r in candidate_rows)
        readiness = 'READY' if count and count==len(candidate_rows) else 'PARTIAL' if count or any(r['readiness']=='PARTIAL' for r in candidate_rows) else 'NOT_READY'
        capability_rows.append({'dimension': dimension, 'gap_status': 'DERIVED' if count else 'UNAVAILABLE', 'readiness': readiness,
                                'reason_code': None if count else 'NO_APPROVED_COMPARABLE_MEASURES', 'calculated_records':count})
    return {**public_context(ctx), 'status': 'READY' if any(r['calculated_records'] for r in capability_rows) else 'NOT_READY',
            'gap_status': 'DERIVED' if any(r['calculated_records'] for r in capability_rows) else 'UNAVAILABLE',
            'options': {'geographies': [{'geography_id': r['region_id'], 'name': r['name'], 'geography_level': r['region_type']} for r in ctx['regions'] if r['region_id'] in geo_ids],
                        'reference_period': common_periods, 'skill_code': [], 'occupation_code': [], 'sector_code': [],
                        'readiness': sorted({r['readiness'] for r in rows}), 'quality_status': sorted({r['quality_status'] for r in rows}), 'gap_direction': []},
            'items': capability_rows,
            'required_data': ['Reviewed comparable demand/available-supply metric and population', 'Matched observation interval and geography',
                              'Versioned approved occupation/skill/sector mappings where required', 'Evidence-backed compatible population coverage'],
            'quarantined_count_discrepancy': ctx['supply_quality']['quarantined']}


@router.get('/quality')
def quality():
    ctx = published(); rows = rows_for(ctx, 'skill')
    return {**public_context(ctx), 'status': 'NOT_READY', 'assessment_count': len(rows),
            'calculated_count': sum(r['readiness']=='READY' for r in rows),
            'reason_counts': {code: sum(code in r['reason_codes'] for r in rows) for code in sorted({c for r in rows for c in r['reason_codes']})},
            'supply_quality': ctx['supply_quality'], 'quarantined_records_used': False}


@router.get('/evidence', response_model=GapEvidenceResponse)
def evidence(result_id: Annotated[str, Query(min_length=1,max_length=120)], dimension: Literal['geography','skill','occupation','industry']='skill'):
    ctx = published(); row = next((r for r in rows_for(ctx, dimension) if r['result_id']==result_id), None)
    if row is None: raise HTTPException(404, detail={'code': 'ASSESSMENT_NOT_FOUND'})
    return {**public_context(ctx), 'item': row}
