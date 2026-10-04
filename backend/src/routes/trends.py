"""Bounded public trend/forecast reads. No model options or ownership accepted from clients."""
from typing import Annotated, Literal
from fastapi import APIRouter, HTTPException, Query
from src.trends.repository import read_trends, select, coverage
from src.trends.engine import forecast, trend
from src.trends.models import TrendsResponse, ForecastResponse

router=APIRouter(prefix='/api/v1/intelligence',tags=['Observed trends and forecast readiness'])
Filter=Annotated[str|None,Query(max_length=120)]


def published():
    try:return read_trends()
    except (OSError,ValueError,KeyError,TypeError):
        raise HTTPException(503,detail={'code':'TREND_PUBLICATION_UNAVAILABLE','reason':'Verified history could not be loaded. No sample fallback.'}) from None


@router.get('/trends',response_model=TrendsResponse)
def trends(family:Literal['labour','demand','supply']|None=None,metric:Filter=None,geography_id:Filter=None,
    sex:Literal['male','female','persons']|None=None,sector:Literal['rural','urban','combined']|None=None,
    activity_status:Literal['US','CWS']|None=None,series_id:Filter=None,
    limit:int=Query(25,ge=1,le=100),offset:int=Query(0,ge=0)):
    bundle=published();rows=select(bundle,family,metric,geography_id,sex,sector,activity_status,series_id)
    return {'version':bundle[2],'status':'OBSERVED' if rows else 'EMPTY','total':len(rows),
        'items':[bundle[4][r.series_id] for r in rows[offset:offset+limit]],'sources':bundle[1]}


@router.get('/forecast',response_model=ForecastResponse)
def forecasts(family:Literal['labour','demand','supply']|None=None,metric:Filter=None,geography_id:Filter=None,
    sex:Literal['male','female','persons']|None=None,sector:Literal['rural','urban','combined']|None=None,
    activity_status:Literal['US','CWS']|None=None,series_id:Filter=None,horizon:int=Query(1,ge=1,le=3),
    limit:int=Query(25,ge=1,le=100),offset:int=Query(0,ge=0)):
    bundle=published();rows=select(bundle,family,metric,geography_id,sex,sector,activity_status,series_id)
    items=[bundle[5][r.series_id] if horizon==1 else forecast(r,horizon) for r in rows[offset:offset+limit]]
    return {'version':bundle[2],'status':'FORECAST' if any(r.status=='FORECAST' for r in items) else 'UNAVAILABLE' if rows else 'EMPTY',
        'total':len(rows),'items':items,'sources':bundle[1]}


@router.get('/forecast/coverage')
def forecast_coverage():return coverage(published())


@router.get('/forecast/quality')
def forecast_quality():
    bundle=published()
    return {'version':bundle[2],'status':'VALIDATED_WITH_RESTRICTIONS','items':[
        {'series_id':s.series_id,'quality_status':bundle[5][s.series_id].quality_status,
         'missing_periods':s.missing_periods,'reason_codes':bundle[5][s.series_id].readiness.reason_codes,
         'partial_observation_ids':[p.observation_id for p in s.observations if p.partial]} for s in bundle[0]]}


@router.get('/forecast/evidence')
def forecast_evidence(series_id:Annotated[str,Query(min_length=1,max_length=120)],horizon:int=Query(1,ge=1,le=3)):
    bundle=published();rows=select(bundle,series_id=series_id)
    if not rows:return {'version':bundle[2],'status':'UNAVAILABLE','items':[],'sources':bundle[1]}
    result=bundle[5][series_id] if horizon==1 else forecast(rows[0],horizon)
    return {'version':bundle[2],'status':result.status,'items':[result], 'sources':bundle[1]}
