"""Public stateless what-if calculations; no account mutation or formula execution."""
from typing import Annotated, Literal
from fastapi import APIRouter, HTTPException, Query
from src.trends.repository import read_trends
from src.scenarios.models import ScenarioRequest, ScenarioResult
from src.scenarios.repository import coverage, evaluate, quality

router=APIRouter(prefix='/api/v1/intelligence/scenarios',tags=['Explicit scenario assumptions'])
Filter=Annotated[str|None,Query(max_length=120)]


def published():
    try:
        return read_trends()
    except (OSError,ValueError,KeyError,TypeError):
        raise HTTPException(503,detail={'code':'SCENARIO_BASELINE_UNAVAILABLE','reason':'Verified baselines could not be loaded. No sample fallback.'}) from None


@router.post('/skill-shock',response_model=ScenarioResult)
def skill_shock(request:ScenarioRequest):
    try:
        return evaluate(published(),request)
    except (OSError,ValueError,KeyError,TypeError):
        raise HTTPException(503,detail={'code':'SCENARIO_BASELINE_UNAVAILABLE','reason':'Verified scenario evidence could not be evaluated. No numerical substitute was produced.'}) from None


@router.get('/coverage')
def scenario_coverage(geography_id:Filter='in',family:Literal['labour','demand','supply']|None=None,metric:Filter=None,
    limit:int=Query(100,ge=1,le=100),offset:int=Query(0,ge=0)):
    bundle=published()
    try:
        return coverage(bundle,geography_id,family,metric,limit,offset)
    except (OSError,ValueError,KeyError,TypeError):
        raise HTTPException(503,detail={'code':'SCENARIO_BASELINE_UNAVAILABLE','reason':'Verified baselines could not be loaded. No sample fallback.'}) from None


@router.get('/quality')
def scenario_quality():
    try:
        return quality(published())
    except (OSError,ValueError,KeyError,TypeError):
        raise HTTPException(503,detail={'code':'SCENARIO_BASELINE_UNAVAILABLE','reason':'Verified baseline quality could not be loaded.'}) from None
