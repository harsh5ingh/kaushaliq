"""Version-bound projections over authenticated Phase 3/4 readers, without writes."""
from functools import lru_cache
from hashlib import sha256
import json
from src.trends.repository import read_trends, select
from src.demand.repository import read_demand
from src.supply.repository import read_supply
from src.early_warning.engine import VERSION, POLICY, RULES, UNSUPPORTED, inspect, unsupported, coverage_notice
from src.early_warning.models import SignalReadiness, SIGNAL_TYPES
from src.trends.models import ReadinessCheck

LIMITATIONS = [
    'Numerical warnings describe published historical intervals, not live demand, current urgency, causal effects or statistically significant change.',
    'Review thresholds are explicit project policy, not empirically calibrated critical-risk thresholds.',
    'PLFS labour rates, NCS vacancy stocks and PMKVY training output remain separate source-native measurements.',
    'Unavailable skill/occupation/district/industry dimensions and relationships are never inferred.',
]


def summarize(kind, entries, evidence=()):
    if kind in UNSUPPORTED:
        return unsupported(kind,evidence)
    eligible = [r for r in entries if r.status=='READY']
    minimum = RULES[kind]['minimum'] if kind in RULES else 0
    if eligible:
        return SignalReadiness(signal_type=kind,status='READY',
            reason=f'{len(eligible)} observed series pass the historical review gates. Thresholds apply only to their stated complete intervals; other series may remain restricted.',
            reason_codes=[],required_data=[],checks=[ReadinessCheck(code='ELIGIBLE_OBSERVED_SERIES',passed=True,
                explanation='At least one verified series satisfies all rule checks; readiness does not imply a threshold-triggered warning.')],
            eligible_series=len(eligible),minimum_history=minimum,evidence=eligible[0].evidence)
    if entries:
        codes=sorted({c for r in entries for c in r.reason_codes})
        return SignalReadiness(signal_type=kind,status=entries[0].status,
            reason='No selected observed series passes every rule gate. ' + entries[0].reason,
            reason_codes=codes,required_data=list(dict.fromkeys(x for r in entries for x in r.required_data)),
            checks=[ReadinessCheck(code=c,passed=False,explanation=next(check.explanation for r in entries for check in r.checks if check.code==c and not check.passed)) for c in codes],
            eligible_series=0,minimum_history=minimum,evidence=entries[0].evidence)
    return SignalReadiness(signal_type=kind,status='UNAVAILABLE',reason='No matching verified native observations are connected for this rule.',
        reason_codes=['OBSERVATIONS_REQUIRED'],required_data=['Matching verified source-native observations for this rule'],
        checks=[ReadinessCheck(code='OBSERVATIONS_REQUIRED',passed=False,explanation='No matching verified observations.')],
        eligible_series=0,minimum_history=minimum,evidence=[])


def coverage_notices(series, source_quality=None):
    """Summarize actual published deficiencies with representative source references."""
    warnings=[]
    def notice(candidates,code,reason,points=None):
        if not candidates:
            return
        ordered=sorted(candidates,key=lambda s:(s.geography_id!='in',s.geography_id is None,s.series_id))
        s=ordered[0]
        warnings.append(coverage_notice(s,code,reason,points(s) if points else None))
    demand=[s for s in series if s.family=='demand']
    training=[s for s in series if s.family=='supply' and s.metric in {'TRAINED','CERTIFIED'}]
    notice([s for s in demand if s.frequency=='POINT' and len(s.observations)==1],
        'COVERAGE_SINGLE_DEMAND_SNAPSHOT','Connected NCS vacancy-stock series contain one observed date. Repeated compatible demand observations are required for historical demand acceleration.')
    notice([s for s in series if s.family=='labour' and s.geography_level in {'state','ut'} and len(s.observations)==1],
        'COVERAGE_SINGLE_REGIONAL_LABOUR_PERIOD','State/UT PLFS history has one connected annual observation for these population strata. A national time series does not create regional history.')
    notice([s for s in series if s.family=='supply' and s.metric=='TRAINING_CENTRES' and len(s.observations)==1],
        'COVERAGE_SINGLE_INFRASTRUCTURE_SNAPSHOT','Connected training-centre records are a single stock observation. Centres are neither seats nor throughput capacity and cannot establish training pressure.')
    notice([s for s in training if any(p.partial for p in s.observations)],
        'COVERAGE_PARTIAL_PERIOD','A connected PMKVY fiscal-year output interval is explicitly partial as of its published cut-off. Its actual period and as-of date are retained below; it cannot be compared with complete fiscal years or annualized.',
        lambda s:[p for p in s.observations if p.partial][-1:])
    quarantine=(source_quality or {}).get('supply',{}).get('quarantined',[])
    quarantine_series=set()
    for q in quarantine:
        label=str(q.get('period',''))
        year=int(label[:4]) if len(label)==7 and label[:4].isdigit() and label[4]=='-' and label[5:].isdigit() else None
        interval=f'{year}-04-01/{year+1}-03-31' if year is not None else None
        affected=[s for s in training if s.metric==str(q.get('indicator','')).upper()
            and s.geography_id==q.get('region_id') and s.frequency=='FISCAL_YEAR' and interval in s.missing_periods
            and not any(p.period==q.get('period') for p in s.observations)]
        if affected:
            quarantine_series.update(s.series_id for s in affected)
            notice(affected,'COVERAGE_QUARANTINED_PERIOD',
                f"The source quality report quarantines {str(q.get('indicator','')).upper()} FY{q.get('period')} for {affected[0].geography_name}; the reported discrepancy is {q.get('difference')} persons. The observation remains absent; no source value or state sum is substituted.",
                lambda s:[p for p in s.observations if not p.partial])
    notice([s for s in training if s.missing_periods and s.series_id not in quarantine_series],
        'COVERAGE_MISSING_PERIOD','Compatible annual observations are absent within this training-output history. Missing intervals are not filled; no quarantine reason or discrepancy is inferred without a matching quality report.',
        lambda s:[p for p in s.observations if not p.partial])
    notice([s for s in demand if s.geography_id is None],
        'COVERAGE_UNMAPPED_GEOGRAPHY','Unmapped source geography buckets remain separate and do not enter mapped regional numerical warning rules.')
    notice([s for s in demand if not s.classification.get('skill_code') and not s.classification.get('occupation_code') and not s.classification.get('sector_code')],
        'COVERAGE_CLASSIFICATIONS_UNAVAILABLE','Connected demand records do not provide reviewed skill, occupation or industry classifications. Emerging/declining skill signals and skill-shock relationships remain not ready.')
    notice([s for s in series if s.family=='supply' and s.metric=='TRAINING_CENTRES'],
        'COVERAGE_CAPACITY_UNAVAILABLE','The connected supply publication has centre stocks and activity counts but no verified seat or throughput-capacity observations. Centre counts are not converted into capacity.')
    return warnings


@lru_cache(maxsize=4)
def _bundle(base_version,demand_version,supply_version):
    history=read_trends()
    if history[3] != {'base':base_version,'demand':demand_version,'supply':supply_version}:
        raise ValueError('Observed publications changed while building early-warning projection')
    demand,dv,_=read_demand(); supply,sv,_=read_supply()
    if (dv,sv)!=(demand_version,supply_version):
        raise ValueError('Quality publications changed while building early-warning projection')
    sources={s['source_id']:s for s in history[1]}
    warnings=[]; inspections={}
    for s in history[0]:
        for kind,spec in RULES.items():
            if s.family==spec['family'] and s.metric in spec['metrics']:
                r,w=inspect(s,kind,sources)
                inspections.setdefault(kind,{})[s.series_id]=r
                if w:
                    warnings.append(w)
    warnings.extend(coverage_notices(history[0],{'demand':demand['quality'],'supply':supply['quality']}))
    warnings.sort(key=lambda w:(w.severity!='REVIEW',w.signal_type,w.geography.geography_name,w.entity_id,w.signal_id))
    version=sha256(json.dumps({'publications':history[3],'engine':VERSION,'policy':POLICY.model_dump(mode='json')},sort_keys=True).encode()).hexdigest()
    return {'version':version,'engine_version':VERSION,'data_mode':'verified','warnings':warnings,
        'history':history,'inspections':inspections,'sources':history[1],
        'source_quality':{'demand':demand['quality'],'supply':supply['quality']}}


def read_early_warning():
    h=read_trends()
    return _bundle(h[3]['base'],h[3]['demand'],h[3]['supply'])


def selected(bundle,signal_type=None,geography_id=None,series_id=None,severity=None):
    return [w for w in bundle['warnings'] if (signal_type is None or w.signal_type==signal_type)
        and (geography_id is None or w.geography.geography_id==geography_id)
        and (series_id is None or w.entity_id==series_id) and (severity is None or w.severity==severity)]


def readiness(bundle,signal_type=None,geography_id=None,series_id=None):
    matching=select(bundle['history'],geography_id=geography_id,series_id=series_id)
    ids={s.series_id for s in matching}
    context=[s.observations[-1].evidence for s in matching if s.observations][:3]
    rows=[]
    for kind in [signal_type] if signal_type else SIGNAL_TYPES:
        if kind=='DATA_COVERAGE_WARNING':
            notices=selected(bundle,kind,geography_id,series_id)
            rows.append(SignalReadiness(signal_type=kind,status='READY' if notices else 'UNAVAILABLE',
                reason='Verified source coverage limitations are documented as informational readiness notices.' if notices else 'No evidenced coverage notice matches the selected source context.',
                reason_codes=[] if notices else ['OBSERVATIONS_REQUIRED'],required_data=[] if notices else ['Matching verified source context'],
                checks=[ReadinessCheck(code='SOURCE_COVERAGE_EVIDENCE',passed=bool(notices),explanation='Coverage notices require preserved source observations and metadata.')],
                eligible_series=len(notices),minimum_history=0,evidence=notices[0].evidence if notices else []))
        else:
            rows.append(summarize(kind,[r for sid,r in bundle['inspections'].get(kind,{}).items() if sid in ids],context))
    return rows


def coverage(bundle):
    geographies={}
    for s in bundle['history'][0]:
        if s.geography_id:
            geographies[s.geography_id]={'geography_id':s.geography_id,'geography_name':s.geography_name,'geography_level':s.geography_level}
    rows=readiness(bundle)
    return {k:bundle[k] for k in ['version','engine_version','data_mode','sources']} | {
        'status':'READY' if any(r.status=='READY' for r in rows) else 'NOT_READY','items':rows,
        'options':{'geographies':sorted(geographies.values(),key=lambda g:g['geography_name']),'signal_types':SIGNAL_TYPES},
        'total_signals':len(bundle['warnings']),'active_signal_types':sorted({w.signal_type for w in bundle['warnings']}),
        'limitations':LIMITATIONS}


def quality(bundle,signal_type=None,geography_id=None,series_id=None,limit=25,offset=0):
    series=bundle['history'][0]
    ids={s.series_id for s in select(bundle['history'],geography_id=geography_id,series_id=series_id)}
    rows=[{'series_id':sid,'signal_type':kind,'readiness':r.status,'reason_codes':r.reason_codes,
        'checks':r.checks} for kind,by_series in bundle['inspections'].items() for sid,r in by_series.items()
        if r.status!='READY' and sid in ids and (signal_type is None or kind==signal_type)]
    return {k:bundle[k] for k in ['version','engine_version','data_mode']} | {
        'status':'VALIDATED_WITH_RESTRICTIONS',
        'excluded_partial_observations':sum(p.partial for s in series for p in s.observations),
        'quarantined_records_used':False,'source_quality':bundle['source_quality'],
        'total':len(rows),'items':rows[offset:offset+limit],
        'reason_counts':{code:sum(code in r['reason_codes'] for r in rows) for code in sorted({code for r in rows for code in r['reason_codes']})},
        'limitations':LIMITATIONS}
