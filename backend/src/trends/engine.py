"""Deterministic comparisons, rolling-origin diagnostics and gated naive forecasts.

No acquisition, interpolation, aggregation, synthetic inputs or canonical writes.
"""
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal
from math import sqrt
from src.trends.models import (HistoricalSeries, TrendChange, Readiness, ReadinessCheck,
    Backtest, BacktestFold, ForecastPoint, ForecastResult, TrendResult)

MODEL_METHOD = 'Last observed value repeated for each future annual period. No fitted trend, seasonality, causal claim or official prediction.'
BACKTEST_METHOD = 'Expanding-window rolling origin, minimum 4 training observations; predict the requested horizon using the last training observation. Error = observed - predicted. MAE/RMSE/bias in source units. No future values used in training.'
INTERVAL_METHOD = 'Conditional 95% normal random-walk interval: last value ± 1.959963984540054 × sqrt(h × mean(squared adjacent differences)). Assumes independent zero-mean normal increments and stable methodology. Not a survey confidence interval; calibration and structural-change uncertainty are not established.'


def next_year(d: date, years=1):
    try:
        return d.replace(year=d.year + years)
    except ValueError:
        return d.replace(year=d.year + years, day=28)


def adjacent(a, b, frequency):
    return frequency != 'POINT' and b.period_start == a.period_end + timedelta(days=1) and b.period_end == next_year(a.period_end)


def compatible(a, b):
    return (a.identity == b.identity and a.unit == b.unit and a.source_id == b.source_id
        and a.source_version == b.source_version and a.publication_version == b.publication_version)


def regular(points, frequency):
    return frequency != 'POINT' and all(p.period_end == next_year(p.period_start)-timedelta(days=1) for p in points)


def missing_periods(points, frequency):
    missing = []
    if frequency == 'POINT':
        return missing
    for a, b in zip(points, points[1:]):
        cursor = a.period_end + timedelta(days=1)
        while cursor < b.period_start:
            end = next_year(cursor) - timedelta(days=1)
            missing.append(f'{cursor.isoformat()}/{end.isoformat()}')
            cursor = end + timedelta(days=1)
    return missing


def changes(series: HistoricalSeries):
    result = []
    points = sorted(series.observations, key=lambda p: p.period_start)
    for a, b in zip(points, points[1:]):
        reasons = []
        if not compatible(a, b): reasons.append('INCOMPATIBLE_OBSERVATIONS')
        if not adjacent(a, b, series.frequency): reasons.append('NON_ADJACENT_PERIODS')
        if not regular([a,b],series.frequency): reasons.append('INCOMPATIBLE_PERIOD_LENGTH')
        if a.partial or b.partial: reasons.append('PARTIAL_PERIOD')
        if a.quality_status != 'VALID' or b.quality_status != 'VALID': reasons.append('QUALITY_RESTRICTION')
        delta = None if reasons else float(Decimal(str(b.value)) - Decimal(str(a.value)))
        growth = None if reasons or a.value == 0 else float((Decimal(str(b.value)) / Decimal(str(a.value)) - 1) * 100)
        result.append(TrendChange(status='UNAVAILABLE' if reasons else 'DERIVED', from_id=a.observation_id,
            to_id=b.observation_id, from_period=a.period, to_period=b.period, absolute_change=delta,
            change_unit='percentage points' if series.unit == 'percent' else series.unit,
            growth_percent=growth, direction=None if delta is None else 'INCREASE' if delta > 0 else 'DECREASE' if delta < 0 else 'UNCHANGED',
            reason_codes=reasons + (['ZERO_BASE_GROWTH_UNAVAILABLE'] if not reasons and a.value == 0 else []),
            evidence=[a.evidence, b.evidence]))
    return result


def readiness(series: HistoricalSeries, horizon: int):
    if not 1 <= horizon <= 3: raise ValueError('Annual horizon must be 1 to 3')
    p = sorted(series.observations, key=lambda x: x.period_start)
    complete = [x for x in p if not x.partial and x.quality_status == 'VALID']
    checks = []
    def check(code, passed, explanation):
        checks.append(ReadinessCheck(code=code, passed=passed, explanation=explanation))
    check('OBSERVATIONS_REQUIRED', bool(p), 'Verified observations must exist; missing data is never zero.')
    check('ANNUAL_FREQUENCY_REQUIRED', series.frequency in {'ANNUAL', 'FISCAL_YEAR'} and regular(p,series.frequency), 'This baseline supports complete regular annual intervals, not isolated point stocks.')
    check('INSUFFICIENT_HISTORY', len(complete) >= 4 + 3 + horizon - 1, 'At least four training observations and three out-of-sample origins at the requested horizon are required (project policy, not a universal statistical minimum).')
    check('INCOMPATIBLE_SERIES', len({x.observation_id for x in p})==len(p) and all(x.unit==series.unit for x in p) and all(compatible(a, b) for a, b in zip(p, p[1:])), 'Unit, population, classifications, geography, methodology and versioned sources must agree; observation identities must be unique.')
    check('MISSING_PERIODS', all(adjacent(a, b, series.frequency) for a, b in zip(p, p[1:])) if len(p) > 1 else True, 'Intervals must be contiguous annual periods; no filling or interpolation is permitted.')
    check('QUALITY_RESTRICTION', all(x.quality_status == 'VALID' and not x.partial for x in p), 'Warnings, quarantine and incomplete periods cannot enter model training.')
    check('GEOGRAPHY_UNMAPPED', series.geography_id is not None, 'A reviewed canonical geography is required; unmatched labels are not silently merged.')
    projected_end = next_year(p[-1].period_end, horizon) if p else None
    check('METHODOLOGY_BOUNDARY', series.applicability_end is None or bool(projected_end and projected_end <= series.applicability_end), 'The requested horizon must remain within the reviewed methodology applicability. PLFS pre-2025 cannot be projected across the January 2025 design change without a documented bridge.')
    failed = [c.code for c in checks if not c.passed]
    status = ('UNAVAILABLE' if not p else 'QUALITY_RESTRICTION' if 'QUALITY_RESTRICTION' in failed else
        'INCOMPATIBLE_SERIES' if any(x in failed for x in ['INCOMPATIBLE_SERIES','METHODOLOGY_BOUNDARY']) else
        'INSUFFICIENT_COVERAGE' if 'GEOGRAPHY_UNMAPPED' in failed else
        'MISSING_PERIODS' if 'MISSING_PERIODS' in failed else 'INSUFFICIENT_HISTORY' if failed else 'READY')
    return Readiness(status=status, checks=checks, reason_codes=failed, horizon=horizon, complete_observations=len(complete))


def backtest(series: HistoricalSeries, horizon=1):
    p = sorted(series.observations, key=lambda x: x.period_start)
    reasons = []
    if not regular(p,series.frequency): reasons.append('ANNUAL_FREQUENCY_REQUIRED')
    if len(p) < 4 + 3 + horizon - 1: reasons.append('INSUFFICIENT_HISTORY')
    if any(x.partial or x.quality_status != 'VALID' for x in p): reasons.append('QUALITY_RESTRICTION')
    if not all(compatible(a,b) and adjacent(a,b,series.frequency) for a,b in zip(p,p[1:])): reasons.append('INCOMPATIBLE_OR_MISSING_PERIODS')
    if len({x.observation_id for x in p})!=len(p): reasons.append('DUPLICATE_OBSERVATION')
    folds = []
    if not reasons:
        for end in range(4, len(p) - horizon + 1):
            target = p[end + horizon - 1]
            prediction = p[end - 1].value
            error = float(Decimal(str(target.value)) - Decimal(str(prediction)))
            folds.append(BacktestFold(training_ids=[x.observation_id for x in p[:end]], target_id=target.observation_id,
                target_period=target.period, horizon=horizon, observed=target.value, predicted=prediction, error=error))
    return Backtest(status='UNAVAILABLE' if reasons else 'AVAILABLE', methodology=BACKTEST_METHOD,
        folds=folds, unit=series.unit, reason_codes=reasons,
        mae=sum(abs(f.error) for f in folds)/len(folds) if folds else None,
        rmse=sqrt(sum(f.error**2 for f in folds)/len(folds)) if folds else None,
        bias=sum(f.error for f in folds)/len(folds) if folds else None)


def forecast(series: HistoricalSeries, horizon=1):
    gate = readiness(series, horizon); test = backtest(series, horizon)
    p = sorted(series.observations, key=lambda x: x.period_start)
    points = []
    if gate.status == 'READY' and test.status == 'AVAILABLE':
        sigma = sqrt(sum((b.value-a.value)**2 for a,b in zip(p,p[1:])) / (len(p)-1))
        for h in range(1,horizon+1):
            start, end = next_year(p[-1].period_start,h), next_year(p[-1].period_end,h)
            width = 1.959963984540054 * sigma * sqrt(h)
            lower, upper = p[-1].value-width, p[-1].value+width
            # Do not clip unsupported intervals to plausible bounds or claim zero variance certainty.
            if lower < 0 or (series.unit == 'percent' and upper > 100) or sigma == 0:
                gate.checks.append(ReadinessCheck(code='UNCERTAINTY_UNSUPPORTED',passed=False,explanation='The baseline interval is outside the metric domain or cannot support nonzero uncertainty. No clipping or invented interval.'))
                gate.status='QUALITY_RESTRICTION';gate.reason_codes.append('UNCERTAINTY_UNSUPPORTED');points=[];break
            points.append(ForecastPoint(period=f'{start.year}-{str(end.year)[-2:]}',period_start=start,period_end=end,value=p[-1].value,lower=lower,upper=upper))
    available = gate.status == 'READY' and bool(points)
    return ForecastResult(series=series,status='FORECAST' if available else 'UNAVAILABLE', readiness=gate,
        historical_observation_ids=[x.observation_id for x in p],training_start=p[0].period_start if p else None,
        training_end=p[-1].period_end if p else None,generated_at=datetime.now(timezone.utc) if available else None,
        horizon=horizon,forecasts=points,backtest=test,methodology=MODEL_METHOD,uncertainty_methodology=INTERVAL_METHOD,
        evidence=[x.evidence for x in p],quality_status='VALID' if available else 'RESTRICTED',
        limitations=series.limitations + ['Historical backtest errors do not establish prospective accuracy.', 'No causal inference; no official prediction or demand/supply gap.'])


def trend(series, horizon=1):
    c = changes(series)
    return TrendResult(series=series,changes=c,trend_status='DERIVED' if any(x.status=='DERIVED' for x in c) else 'UNAVAILABLE',readiness=readiness(series,horizon))
