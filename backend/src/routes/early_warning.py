"""Bounded public review/evidence reads; unavailable publications fail closed."""
from typing import Annotated, Literal
from fastapi import APIRouter, Query, HTTPException
from src.early_warning.models import SignalType, EarlyWarningResponse, EvidenceResponse
from src.early_warning.repository import read_early_warning, selected, readiness, coverage, quality
from src.trends.repository import select

router=APIRouter(prefix='/api/v1/intelligence/early-warning',tags=['Historical early-warning review and readiness'])
Filter=Annotated[str|None,Query(max_length=120)]


def published():
    try:
        return read_early_warning()
    except (OSError,ValueError,KeyError,TypeError):
        raise HTTPException(503,detail={'code':'EARLY_WARNING_PUBLICATION_UNAVAILABLE',
            'reason':'Verified warning evidence could not be loaded. No sample, forecast or simulation fallback.'}) from None


@router.get('',response_model=EarlyWarningResponse)
def early_warning(signal_type:SignalType|None=None,geography_id:Filter=None,series_id:Filter=None,
    severity:Literal['INFO','REVIEW']|None=None,limit:int=Query(25,ge=1,le=100),offset:int=Query(0,ge=0)):
    bundle=published()
    rows=selected(bundle,signal_type,geography_id,series_id,severity)
    matching=select(bundle['history'],geography_id=geography_id,series_id=series_id)
    assessments=readiness(bundle,signal_type,geography_id,series_id)
    # Eligible comparisons below the threshold are an honest empty result, not a missing capability.
    eligible=any(r.status=='READY' for r in assessments)
    return {k:bundle[k] for k in ['version','engine_version','data_mode','sources']} | {
        'status':'AVAILABLE' if rows else 'EMPTY' if eligible or not matching else 'UNAVAILABLE','total':len(rows),
        'items':rows[offset:offset+limit],'readiness':assessments}


@router.get('/coverage')
def early_warning_coverage():
    return coverage(published())


@router.get('/quality')
def early_warning_quality(signal_type:SignalType|None=None,geography_id:Filter=None,series_id:Filter=None,
    limit:int=Query(25,ge=1,le=100),offset:int=Query(0,ge=0)):
    return quality(published(),signal_type,geography_id,series_id,limit,offset)


@router.get('/evidence',response_model=EvidenceResponse)
def early_warning_evidence(signal_id:Annotated[str,Query(min_length=1,max_length=120)]):
    bundle=published()
    item=next((w for w in bundle['warnings'] if w.signal_id==signal_id),None)
    if item is None:
        raise HTTPException(404,detail={'code':'EARLY_WARNING_NOT_FOUND','reason':'No verified warning matches this identity.'})
    return {k:bundle[k] for k in ['version','engine_version','data_mode','sources']} | {'item':item}
