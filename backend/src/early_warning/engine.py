"""Inspectable rules over verified historical inputs; no causes, forecasts or writes."""
from decimal import Decimal
from hashlib import sha256
import json
from src.data_pipeline.models import Evidence
from src.trends.engine import adjacent, regular, compatible, changes
from src.trends.models import ReadinessCheck
from src.early_warning.models import (RulePolicy, Warning, Geography, DerivedMetrics,
    TriggerRule, Provenance, SignalReadiness)

VERSION = 'early-warning-1.0'
POLICY = RulePolicy()
RULES = {
    'LABOUR_INDICATOR_CHANGE': {'family':'labour', 'metrics':{'LFPR','WPR','UR'}, 'unit':'percent', 'frequency':'ANNUAL', 'minimum':2},
    'TRAINING_OUTPUT_ACCELERATION': {'family':'supply', 'metrics':{'TRAINED','CERTIFIED'}, 'unit':'persons', 'frequency':'FISCAL_YEAR', 'minimum':3},
}
QUALIFICATION = 'Project review threshold, not a calibrated severity, statistical significance test, causal explanation or current-market alert. The rule describes its explicitly stated historical interval.'
UNSUPPORTED = {
    'DEMAND_ACCELERATION': ('NO_REPEATED_DEMAND_OBSERVATIONS', 'Connected NCS demand is a single historical vacancy-stock snapshot; no compatible repeated demand history is connected.',
        ['Repeated verified demand observations with matched metric, unit, geography, population and classification', 'A reviewed historical-change threshold and sufficient comparable periods']),
    'SUPPLY_ACCELERATION': ('NO_AVAILABLE_WORKFORCE_SUPPLY', 'No repeated observations of available qualified workers are connected. PMKVY training activity and PLFS rates do not measure available workforce supply.',
        ['Repeated verified available-workforce observations and a defined population', 'Reviewed compatible occupation/skill classifications and source coverage']),
    'DEMAND_SUPPLY_DIVERGENCE': ('NO_COMPARABLE_DEMAND_SUPPLY', 'Vacancy stocks and reported training counts have incompatible semantics and intervals; no approved demand/available-supply comparison exists.',
        ['Compatible repeated demand and available-supply observations', 'An approved metric/population/period comparison and evidence-backed coverage']),
    'REGIONAL_DEMAND_ANOMALY': ('NO_REGIONAL_DEMAND_HISTORY', 'Regional NCS records have a single observation date and incomplete geography mapping; no reviewed regional temporal baseline exists.',
        ['Repeated mapped regional demand observations', 'A reviewed comparable regional baseline and anomaly policy']),
    'EMERGING_SKILL_SIGNAL': ('NO_SKILL_HISTORY', 'Verified skill-coded demand observations and an authoritative reviewed skill crosswalk are not connected.',
        ['Repeated verified skill-level observations', 'Versioned skill taxonomy and approved source-to-skill crosswalk']),
    'DECLINING_SKILL_SIGNAL': ('NO_SKILL_HISTORY', 'Verified skill-coded demand observations and an authoritative reviewed skill crosswalk are not connected.',
        ['Repeated verified skill-level observations', 'Versioned skill taxonomy and approved source-to-skill crosswalk']),
    'TRAINING_PRESSURE': ('NO_TRAINING_CAPACITY_RELATIONSHIP', 'Training output and centre stock do not measure seats, throughput capacity or training demand. No evidenced pressure relationship is connected.',
        ['Verified training demand and compatible seat/throughput capacity', 'A reviewed evidenced relationship and compatible intervals']),
}


def lineage(points):
    groups = {}
    for p in points:
        groups.setdefault((p.source_id, p.source_version, p.publication_version), []).append(p.observation_id)
    return [Provenance(source_id=k[0], source_version=k[1], publication_version=k[2], observation_ids=v) for k,v in groups.items()]


def identity(kind, entity, points, rule):
    value = {'engine':VERSION,'type':kind,'entity':entity,'points':[p.observation_id for p in points],
        'publications':[p.publication_version for p in points], 'rule':rule.model_dump(mode='json')}
    return sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()[:40]


def make_warning(series, kind, points, rule, metrics, entity_name=None, extra_limits=()):
    return Warning(signal_id=identity(kind,series.series_id,points,rule), signal_type=kind,
        entity_type='labour_indicator' if kind=='LABOUR_INDICATOR_CHANGE' else 'training_output' if kind=='TRAINING_OUTPUT_ACCELERATION' else 'data_coverage',
        entity_id=series.series_id, entity_name=entity_name or series.metric,
        geography=Geography(geography_id=series.geography_id,geography_name=series.geography_name,geography_level=series.geography_level),
        period=points[-1].period, comparison_period=None if kind=='DATA_COVERAGE_WARNING' else points[-2].period,
        severity='INFO' if kind=='DATA_COVERAGE_WARNING' else 'REVIEW', observed_values=points,
        derived_metrics=metrics, trigger_rule=rule, evidence=[p.evidence for p in points], provenance=lineage(points),
        limitations=series.limitations + list(extra_limits), confidence_or_qualification=QUALIFICATION)


def unsupported(kind, evidence=()):
    code,reason,required = UNSUPPORTED[kind]
    return SignalReadiness(signal_type=kind,status='NOT_READY',reason=reason,reason_codes=[code],
        required_data=required, checks=[ReadinessCheck(code=code,passed=False,explanation=reason)],
        eligible_series=0,minimum_history=0,evidence=list(evidence))


def inspect(series, kind, sources, policy=POLICY):
    """Return readiness plus an optional rule-triggered warning; no input mutation."""
    if kind not in RULES:
        return unsupported(kind), None
    spec = RULES[kind]
    all_points = sorted(series.observations,key=lambda p:p.period_start)
    # Explicitly partial training rows are retained canonically but cannot form a full-year comparison.
    available = [p for p in all_points if not p.partial] if kind=='TRAINING_OUTPUT_ACCELERATION' else all_points
    p = available[-spec['minimum']:]
    checks = []
    def check(code,passed,reason):
        checks.append(ReadinessCheck(code=code,passed=passed,explanation=reason))
    check('OBSERVATIONS_REQUIRED',bool(p),'Verified observed records must exist; absent values are never treated as zero.')
    check('UNSUPPORTED_METRIC',series.family==spec['family'] and series.metric in spec['metrics'] and series.frequency==spec['frequency'],
        'Only explicitly approved native metrics/frequencies may enter this rule.')
    check('INSUFFICIENT_HISTORY',len(p)>=spec['minimum'],f"This rule requires {spec['minimum']} complete observed periods.")
    check('INCOMPATIBLE_UNITS',series.unit==spec['unit'] and all(x.unit==series.unit for x in p),'Original normalized units must agree with the native metric.')
    expected_identity={**series.classification,'family':series.family,'metric':series.metric,'geography_id':series.geography_id,
        'frequency':series.frequency,'unit':series.unit,'methodology_version':series.methodology_version}
    check('INCOMPATIBLE_SERIES',len({x.observation_id for x in p})==len(p) and all(compatible(a,b) for a,b in zip(p,p[1:]))
        and all(all(x.identity.get(key)==value for key,value in expected_identity.items()) for x in p),
        'Population, geography, classification, source/version/publication and methodology must match; input identities must be unique.')
    check('INCOMPATIBLE_PERIOD_LENGTH',series.frequency==spec['frequency'] and regular(p,series.frequency),'Comparison inputs must retain complete regular annual source intervals.')
    check('MISSING_PERIODS',all(adjacent(a,b,series.frequency) for a,b in zip(p,p[1:])),'Intervals must be adjacent; no missing observations are filled.')
    check('QUALITY_RESTRICTION',all(x.status=='OBSERVED' and x.quality_status=='VALID' and not x.partial and (x.as_of is None or x.period_end<=x.as_of) for x in p),
        'Partial, warned or quarantined input cannot trigger a numerical review signal.')
    check('GEOGRAPHY_UNMAPPED',series.geography_id is not None,'Canonical reviewed geography is required; unmatched source buckets are not merged.')
    check('METHODOLOGY_BOUNDARY',series.applicability_end is None or all(x.period_end<=series.applicability_end for x in p),
        'Observed review intervals must stay inside the reviewed methodology applicability; no post-boundary observation is bridged.')
    check('SOURCE_EVIDENCE_REQUIRED',all(x.source_id in series.source_ids and sources.get(x.source_id,{}).get('connected') is True
        and sources[x.source_id].get('sha256')==x.evidence.raw_sha256
        and (sources[x.source_id].get('version') or 'unspecified')==x.source_version for x in p),
        'Connected source metadata, raw checksum and source versions must authenticate every preserved observation.')
    if kind=='TRAINING_OUTPUT_ACCELERATION':
        check('ZERO_BASE_GROWTH_UNAVAILABLE',len(p)<3 or (p[0].value>0 and p[1].value>0),'Both relative growth comparisons require nonzero observed baselines; zero is not replaced.')
    failed = [c.code for c in checks if not c.passed]
    if failed:
        status = 'UNAVAILABLE' if 'OBSERVATIONS_REQUIRED' in failed or 'UNSUPPORTED_METRIC' in failed else (
            'QUALITY_RESTRICTION' if any(x in failed for x in ['QUALITY_RESTRICTION','SOURCE_EVIDENCE_REQUIRED','ZERO_BASE_GROWTH_UNAVAILABLE']) else
            'INCOMPATIBLE_SERIES' if any(x in failed for x in ['INCOMPATIBLE_SERIES','INCOMPATIBLE_UNITS','INCOMPATIBLE_PERIOD_LENGTH','METHODOLOGY_BOUNDARY']) else
            'INSUFFICIENT_COVERAGE' if 'GEOGRAPHY_UNMAPPED' in failed else
            'MISSING_PERIODS' if 'MISSING_PERIODS' in failed else 'INSUFFICIENT_HISTORY')
        return SignalReadiness(signal_type=kind,status=status,reason=' '.join(c.explanation for c in checks if not c.passed),
            reason_codes=failed,required_data=[c.explanation for c in checks if not c.passed],checks=checks,eligible_series=0,
            minimum_history=spec['minimum'],evidence=[x.evidence for x in p]),None
    ready = SignalReadiness(signal_type=kind,status='READY',reason='Compatible observed history passes this historical review policy; a warning requires the configured threshold to be met.',
        reason_codes=[],required_data=[],checks=checks,eligible_series=1,minimum_history=spec['minimum'],evidence=[x.evidence for x in p])
    comparisons = changes(series.model_copy(update={'observations':p}))
    c = comparisons[-1]
    if c.status!='DERIVED':
        raise ValueError('Passed review inputs unexpectedly failed historical comparison')
    previous = comparisons[0].growth_percent if kind=='TRAINING_OUTPUT_ACCELERATION' else None
    acceleration = float(Decimal(str(c.growth_percent))-Decimal(str(previous))) if previous is not None and c.growth_percent is not None else None
    threshold = policy.labour_change_pp if kind=='LABOUR_INDICATOR_CHANGE' else policy.training_acceleration_pp
    triggered = abs(Decimal(str(c.absolute_change)))>=Decimal(str(threshold)) if kind=='LABOUR_INDICATOR_CHANGE' else (
        c.growth_percent is not None and c.growth_percent>0 and acceleration is not None and Decimal(str(acceleration))>=Decimal(str(threshold)))
    if not triggered:
        return ready,None
    methodology = ('Absolute change in the latest two complete comparable PLFS rate observations is at least the project threshold in percentage points. Increase/decrease describes the native rate only; an increase in UR has a different interpretation from LFPR/WPR.' if kind=='LABOUR_INDICATOR_CHANGE' else
        'For the latest three complete comparable PMKVY training-output observations, growth=(current/prior-1)*100; acceleration=latest growth-previous growth. Trigger requires positive latest growth and acceleration at least the project threshold in percentage points. Training output does not measure available worker supply or training pressure.')
    rule = TriggerRule(rule_id=kind.lower()+'-latest-complete',version=policy.version,threshold=threshold,
        threshold_unit='percentage points',operator='>=',minimum_history=spec['minimum'],methodology=methodology)
    limits = ['This is a historical review of the displayed interval, not a live warning. No causal explanation or statistical-significance claim is supported.']
    if kind=='TRAINING_OUTPUT_ACCELERATION' and any(x.partial for x in all_points):
        limits.append('Explicit partial fiscal-year observations remain in the source history and were excluded from the full-year rule; the latest complete interval is shown.')
    return ready,make_warning(series,kind,p,rule,DerivedMetrics(absolute_change=c.absolute_change,change_unit=c.change_unit,
        growth_percent=c.growth_percent,previous_growth_percent=previous,acceleration_pp=acceleration,observed_period_count=len(p)),extra_limits=limits)


def coverage_notice(series, code, reason, points=None):
    """An evidence-backed source coverage notice, never a labour-market risk score."""
    p = list(points if points is not None else series.observations[-1:])
    if not p:
        raise ValueError('Coverage notice requires actual source context')
    rule = TriggerRule(rule_id=code,version=POLICY.version,threshold=None,threshold_unit=None,
        operator='REQUIRED',minimum_history=0,methodology=reason)
    return make_warning(series,'DATA_COVERAGE_WARNING',p,rule,DerivedMetrics(observed_period_count=len(p)),
        entity_name=series.metric+' data coverage',extra_limits=[
            'Source context observations support a data-readiness notice; no numerical labour-market change or risk is inferred.',
            reason])
