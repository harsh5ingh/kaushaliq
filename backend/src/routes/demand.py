"""Public canonical demand reads. References, supply context and demand stay distinct."""
from typing import Annotated
from fastapi import APIRouter, HTTPException, Query
from src.data_pipeline.repository import read_snapshot
from src.demand.repository import public_source, query, read_demand

router = APIRouter(prefix='/api/v1/intelligence/demand',tags=['Demand intelligence'])
Filter = Annotated[str | None, Query(max_length=120)]


def published():
    try: return read_demand()
    except (OSError,ValueError,KeyError,TypeError):
        raise HTTPException(503,detail={'code':'DEMAND_PUBLICATION_UNAVAILABLE','reason':'Verified demand publication could not be loaded; no simulation fallback'}) from None


def envelope(snapshot,version,**values):
    return {'version':version,'methodology_version':snapshot['methodology_version'],'data_mode':'verified','forecast':snapshot['forecast'],'supply_gap':snapshot['supply_gap'],**values}


@router.get('')
def demand(geography_id:Filter=None,geography_level:Filter=None,occupation_code:Filter=None,occupation_system:Filter=None,skill_code:Filter=None,sector_code:Filter=None,reference_period:Filter=None,metric:Filter=None,source_id:Filter=None,quality_status:Filter=None,status:Filter=None,mapping_status:Filter=None,limit:int=Query(100,ge=1,le=1000),offset:int=Query(0,ge=0)):
    snapshot,version,indexes=published()
    filters={key:value for key,value in locals().copy().items() if key in indexes}
    rows=query(snapshot,indexes,filters)
    statuses={row['status'] for row in rows}
    response_status=next(iter(statuses)) if len(statuses)==1 else 'MIXED' if rows else 'UNAVAILABLE'
    return envelope(snapshot,version,status=response_status,reason=None if rows else 'No verified demand observations for the requested dimensions; unavailable is not zero',total=len(rows),items=rows[offset:offset+limit],filters={k:v for k,v in filters.items() if v is not None},sources=[public_source(s) for s in snapshot['sources'] if s['source_kind']=='demand_publication'])


@router.get('/coverage')
def coverage():
    snapshot,version,indexes=published()
    base,_=read_snapshot()
    regions={r['region_id']:r for r in base['regions']}
    return envelope(snapshot,version,items=snapshot['coverage'],quality=snapshot['quality'],sources=[public_source(s) for s in snapshot['sources'] if s['source_kind']=='demand_publication'],options={
        'geographies':[{'geography_id':identifier,'name':regions[identifier]['name'],'geography_level':regions[identifier]['region_type']} for identifier in indexes['geography_id'] if identifier is not None],
        **{key:sorted(v for v in indexes[key] if v is not None) for key in ['reference_period','metric','source_id','quality_status','geography_level','occupation_code','skill_code','sector_code']}})


@router.get('/sources')
def sources():
    snapshot,version,_=published()
    return envelope(snapshot,version,items=[public_source(s) for s in snapshot['sources']])


@router.get('/occupations')
def occupations():
    snapshot,version,_=published()
    return envelope(snapshot,version,status='UNAVAILABLE',reason='Connected NCS publication has no occupational breakdown; no verified demand crosswalk is ingested',items=[],mappings=[m for m in snapshot['mappings'] if m['dimension']=='occupation'])


@router.get('/geographies')
def geographies():
    snapshot,version,_=published()
    return envelope(snapshot,version,items=[m for m in snapshot['mappings'] if m['dimension']=='geography'],unavailable=snapshot['quality']['quarantined'])


@router.get('/quality')
def quality():
    snapshot,version,_=published()
    return envelope(snapshot,version,quality=snapshot['quality'],mappings=snapshot['mappings'])
