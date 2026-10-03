"""Public source-native training reads and deterministic compatibility, never a gap score."""
from typing import Annotated, Literal
from fastapi import APIRouter, Query, HTTPException
from src.data_pipeline.repository import read_snapshot
from src.demand.repository import public_source, query
from src.routes.demand import published as published_demand
from src.supply.repository import read_supply
from src.supply.compatibility import assess

router=APIRouter(prefix='/api/v1/intelligence',tags=['Training supply and compatibility'])
Filter=Annotated[str | None, Query(max_length=120)]


def published():
    try:return read_supply()
    except (OSError,ValueError,KeyError,TypeError):
        raise HTTPException(503,detail={'code':'SUPPLY_PUBLICATION_UNAVAILABLE','reason':'Verified training publication could not be loaded; no simulation fallback'}) from None


def envelope(snapshot,version,**values):
    return {'version':version,'methodology_version':snapshot['methodology_version'],'data_mode':'verified','capacity':snapshot['capacity'],'sources':[public_source(s) for s in snapshot['sources']],**values}


@router.get('/supply')
def supply(geography_id:Filter=None,geography_level:Filter=None,reference_period:Filter=None,metric:Filter=None,source_id:Filter=None,semantic_category:Filter=None,quality_status:Filter=None,occupation_code:Filter=None,skill_code:Filter=None,qualification_code:Filter=None,sector_code:Filter=None,limit:int=Query(100,ge=1,le=1000),offset:int=Query(0,ge=0)):
    snapshot,version,indexes=published()
    filters={k:v for k,v in locals().copy().items() if k in indexes};rows=query(snapshot,indexes,filters)
    return envelope(snapshot,version,status='OBSERVED' if rows else 'UNAVAILABLE',reason=None if rows else 'No verified supply observations for these dimensions; unavailable is not zero',total=len(rows),items=rows[offset:offset+limit],filters={k:v for k,v in filters.items() if v is not None})


@router.get('/supply/coverage')
def coverage():
    snapshot,version,indexes=published();base,_=read_snapshot();regions={r['region_id']:r for r in base['regions']}
    return envelope(snapshot,version,items=snapshot['coverage'],quality=snapshot['quality'],options={
        'metric_dimensions':{metric:{'geographies':sorted({r['geography_id'] for r in snapshot['signals'] if r['metric']==metric}),'periods':sorted({r['reference_period'] for r in snapshot['signals'] if r['metric']==metric})} for metric in indexes['metric']},
        'geographies':[{'geography_id':key,'name':regions[key]['name'],'geography_level':regions[key]['region_type']} for key in indexes['geography_id']],
        **{k:sorted(v for v in indexes[k] if v is not None) for k in ['reference_period','metric','geography_level','source_id','semantic_category','occupation_code','skill_code','qualification_code','sector_code']}})


@router.get('/supply/sources')
def sources():
    snapshot,version,_=published();return envelope(snapshot,version,items=[public_source(s) for s in snapshot['sources']])


@router.get('/supply/quality')
def quality():
    snapshot,version,_=published();return envelope(snapshot,version,quality=snapshot['quality'])


@router.get('/supply/taxonomies')
def taxonomies(kind:Literal['occupation','skill','qualification','industry']='occupation',search:str=Query('',max_length=120),limit:int=Query(50,ge=1,le=1000),offset:int=Query(0,ge=0)):
    snapshot,version,_=published()
    if kind=='industry':
        base,_=read_snapshot()
        rows=[{'reference_id':r['industry_id'],'entity_type':'industry','taxonomy_system':'NIC','taxonomy_version':'2008','code':r['nic_code'],'title':r['name'],'parent_code':r['parent_id'].removeprefix('nic2008-') if r['parent_id'] else None,'status':'PARTIALLY_VERIFIED','source_id':r['evidence']['source_id'],'evidence':r['evidence']} for r in base['industries']]
    else:rows=snapshot[{'occupation':'occupations','skill':'skills','qualification':'qualifications'}[kind]]
    rows=[r for r in rows if search.casefold() in (r['code']+' '+r['title']).casefold()]
    # Research metadata is not represented as ingested taxonomy rows or observed intelligence.
    fields=('taxonomy_source_id','publisher','name','version','source_url','accessed_at','coverage','classification_purpose','license_access_notes','status','snapshot_sha256')
    return envelope(snapshot,version,status='REFERENCE_ONLY' if rows else 'UNAVAILABLE',reference_only=True,total=len(rows),items=rows[offset:offset+limit],kind=kind,mappings=snapshot['mappings'],taxonomy_sources=[{k:r[k] for k in fields} for r in snapshot['taxonomy_sources']])


@router.get('/compatibility')
def compatibility(demand_signal_id:Filter=None,supply_signal_id:Filter=None):
    snapshot,version,_=published();demands,demand_version,_=published_demand()
    demand=next((r for r in demands['signals'] if r['signal_id']==demand_signal_id),None) if demand_signal_id else next((r for r in demands['signals'] if r['geography_id']=='in'),None)
    supply=next((r for r in snapshot['signals'] if r['supply_signal_id']==supply_signal_id),None) if supply_signal_id else next((r for r in snapshot['signals'] if r['geography_id']=='in' and r['metric']=='CERTIFIED' and r['reference_period']=='2025-26'),None)
    combined={s['source_id']:s for s in snapshot['sources']+demands['sources']}
    result=assess(demand,supply,combined,snapshot['mappings'],demand_version=demand_version,supply_version=version,geography_version=snapshot['base_version'])
    return envelope(snapshot,version,**result,demand_version=demand_version,demand=demand,supply=supply,sources=[public_source(s) for s in combined.values() if s.get('connected')])


@router.get('/gap/status')
def gap_status(demand_signal_id:Filter=None,supply_signal_id:Filter=None):
    result=compatibility(demand_signal_id,supply_signal_id)
    return {k:v for k,v in result.items() if k not in {'demand','supply'}}
