"""Read-only scenario baselines use the single Phase 4 publication adapter."""
from functools import lru_cache
from src.trends.repository import read_trends, select
from src.scenarios.engine import baseline_for, execute
from src.supply.repository import read_supply


@lru_cache(maxsize=4)
def _options(version):
    bundle=read_trends()
    if bundle[2]!=version:
        raise ValueError('Publication changed during scenario baseline selection')
    result=[]
    for series in bundle[0]:
        point=baseline_for(series,bundle[1])
        if point:
            result.append({'series_id':series.series_id,'family':series.family,'metric':series.metric,'unit':series.unit,
                'geography_id':series.geography_id,'geography_name':series.geography_name,'period':point.period,'value':point.value,
                'classification':series.classification,'baseline_observation_id':point.observation_id})
    return tuple(result)


def coverage(bundle,geography_id='in',family=None,metric=None,limit=100,offset=0):
    options=_options(bundle[2]);selected=[r for r in options if (geography_id is None or r['geography_id']==geography_id)
        and (family is None or r['family']==family) and (metric is None or r['metric']==metric)]
    geographies={r['geography_id']:r['geography_name'] for r in options}
    return {'version':bundle[2],'status':'AVAILABLE' if selected else 'EMPTY' if options else 'UNAVAILABLE','scenario_types':[
        {'scenario_type':'DIRECT_METRIC_SENSITIVITY','status':'READY' if selected else 'NOT_READY',
            'reason_codes':[] if selected else ['BASELINE_UNAVAILABLE'],
            'required_data':[] if selected else ['MAPPED_COMPLETE_VALID_OBSERVED_BASELINE']},
        {'scenario_type':'SKILL_SHOCK','status':'NOT_READY','reason_codes':['MISSING_REVIEWED_IMPACT_RULE','MISSING_EVIDENCED_RELATIONSHIPS'],
            'required_data':['REVIEWED_ADOPTION_IMPACT_MODEL','EVIDENCED_SKILL_OCCUPATION_INDUSTRY_RELATIONSHIPS','CALIBRATED_UNCERTAINTY']}],
        'geographies':[{'id':g,'name':n} for g,n in sorted(geographies.items(),key=lambda x:x[1])],
        'baseline_total':len(selected),'limit':limit,'offset':offset,'baseline_options':selected[offset:offset+limit],
        'relationships_status':'UNAVAILABLE','sources':bundle[1],
        'limitations':['Direct sensitivity does not unlock skill propagation, gap calculation or forecasting.']}


def evaluate(bundle,request):
    rows=select(bundle,series_id=request.series_id)
    return execute(request,rows[0] if rows else None,bundle[2],bundle[1])


def quality(bundle):
    points=[p for s in bundle[0] for p in s.observations]
    return {'version':bundle[2],'status':'VALIDATED_WITH_RESTRICTIONS','quality':{
        'partial_points_excluded':sum(p.partial for p in points),
        'nonvalid_points_excluded':sum(p.quality_status!='VALID' for p in points),
        'quarantined':read_supply()[0]['quality']['quarantined']},
        'no_canonical_writes':True,'relationships_status':'UNAVAILABLE','no_causal_coefficients':True}
