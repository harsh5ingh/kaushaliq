"""No learned/invented adoption coefficients. Only explicit direct sensitivity arithmetic."""
from decimal import Decimal
from hashlib import sha256
import json
from src.trends.models import HistoricalSeries
from src.trends.engine import regular
from src.scenarios.models import ScenarioRequest, ScenarioResult, ScenarioUncertainty, SensitivityResult, ImpactRule, RelationshipEntity, native_identity_matches

DIRECT_METHOD = 'Counterfactual sensitivity in the baseline observation period: value = observed baseline × (1 + user-assumed change / 100). No future period, calibrated impact coefficient, skill propagation, workforce conversion or demand/supply calculation. Count outputs can be continuous sensitivity values, not observed persons.'
SHOCK_METHOD = 'Technology or sector adoption is an input assumption only. No numerical labour effect is calculated without a reviewed impact rule and compatible evidenced relationships. Similar-looking names do not establish causal connections.'
LIMITS = ['SIMULATION — NOT OBSERVED DATA. The assumption is user supplied, not an observation or forecast.',
    'No official prediction, causal interpretation, skill mapping or demand/supply gap.',
    'The original baseline remains unchanged. Partial, quarantined and unmapped baselines are excluded.',
    'No uncertainty interval is available for an uncalibrated user assumption.']


def baseline_for(series: HistoricalSeries, sources: list[dict] | None = None):
    if series.geography_id is None or series.unit not in {'percent', 'reported persons', 'persons', 'vacancies', 'centres', 'count'}:
        return None
    registry={s['source_id']:s for s in sources} if sources is not None else None
    def authenticated(point):
        if registry is None:
            return True
        metadata=registry.get(point.source_id,{})
        return metadata.get('connected') is True and metadata.get('sha256')==point.evidence.raw_sha256 and (metadata.get('version') or 'unspecified')==point.source_version
    points = [p for p in series.observations if p.status == 'OBSERVED' and p.quality_status == 'VALID' and not p.partial and (p.as_of is None or p.period_end <= p.as_of) and p.unit == series.unit
        and native_identity_matches(series,p) and p.source_id in series.source_ids and authenticated(p)
        and (series.frequency == 'POINT' or regular([p],series.frequency))
        and (series.applicability_end is None or p.period_end <= series.applicability_end)]
    if len({p.observation_id for p in series.observations}) != len(series.observations):
        return None
    return max(points,key=lambda p:(p.period_end,p.observation_id)) if points else None


def execute(request: ScenarioRequest, series: HistoricalSeries | None, version: str, sources: list[dict]):
    baseline = baseline_for(series,sources) if series else None
    key = json.dumps({'version':version,'request':request.model_dump(mode='json'),'baseline':baseline.observation_id if baseline else None,'method':'scenario-gate-1.0'},sort_keys=True,allow_nan=False)
    result = ScenarioResult(version=version,scenario_id=sha256(key.encode()).hexdigest()[:32],scenario_type=request.scenario_type,
        status='NOT_READY',assumptions=[request.assumption],baseline=baseline,series=series,results=[],affected_entities=[],impact_rules=[],relationships=[],
        reason_codes=[],required_data=[],evidence=[baseline.evidence] if baseline else [],sources=sources,
        methodology=DIRECT_METHOD if request.scenario_type=='DIRECT_METRIC_SENSITIVITY' else SHOCK_METHOD,
        limitations=LIMITS + (series.limitations if series else []),uncertainty=ScenarioUncertainty(reason='No empirical impact model or calibrated uncertainty distribution is connected.'))
    if baseline is None:
        result.status='UNAVAILABLE';result.reason_codes=['BASELINE_UNAVAILABLE']
        result.required_data=['MAPPED_COMPLETE_VALID_OBSERVED_BASELINE']
    elif request.scenario_type=='SKILL_SHOCK':
        result.reason_codes=['MISSING_REVIEWED_IMPACT_RULE','MISSING_EVIDENCED_RELATIONSHIPS']
        result.required_data=['REVIEWED_ADOPTION_IMPACT_MODEL','EVIDENCED_SKILL_OCCUPATION_INDUSTRY_RELATIONSHIPS','COMPATIBLE_MEASUREMENT_POPULATION_PERIOD_GEOGRAPHY','CALIBRATED_UNCERTAINTY']
    else:
        value = Decimal(str(baseline.value)) * (Decimal(1)+Decimal(str(request.assumption.change_percent))/100)
        if value < 0 or (baseline.unit=='percent' and value>100):
            result.reason_codes=['METRIC_DOMAIN_CONSTRAINT'];result.required_data=['ASSUMPTION_WITHIN_NATIVE_METRIC_DOMAIN']
        else:
            result.status='SCENARIO'
            result.results=[SensitivityResult(baseline_observation_id=baseline.observation_id,baseline_value=baseline.value,value=float(value),
                absolute_change=float(value-Decimal(str(baseline.value))),change_percent=request.assumption.change_percent,unit=baseline.unit,
                period=baseline.period,geography_id=series.geography_id)]
            result.impact_rules=[ImpactRule()]
            result.affected_entities=[RelationshipEntity(entity_type='metric',entity_id=series.series_id,label=series.metric)]
    # Revalidate after constructing the complete result; no state mutation bypass of output constraints.
    return ScenarioResult.model_validate(result.model_dump())
