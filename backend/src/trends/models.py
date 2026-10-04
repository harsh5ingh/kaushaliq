"""Observed history and model outputs are separate, read-only contracts."""
from datetime import date, datetime
from math import isfinite
from typing import Literal
from pydantic import Field, model_validator
from src.data_pipeline.models import StrictModel, Evidence

Family = Literal['labour', 'demand', 'supply']
ReadinessStatus = Literal['READY', 'INSUFFICIENT_HISTORY', 'MISSING_PERIODS', 'INCOMPATIBLE_SERIES', 'INSUFFICIENT_COVERAGE', 'QUALITY_RESTRICTION', 'UNAVAILABLE']


class HistoricalPoint(StrictModel):
    observation_id: str
    period: str
    period_start: date
    period_end: date
    value: float = Field(ge=0, allow_inf_nan=False)
    original_value: str
    original_unit: str
    unit: str
    status: Literal['OBSERVED'] = 'OBSERVED'
    source_id: str
    source_version: str
    publication_version: str
    identity: dict[str, str | None]
    quality_status: Literal['VALID', 'WARNING', 'QUARANTINED']
    partial: bool = False
    as_of: date | None = None
    evidence: Evidence

    @model_validator(mode='after')
    def coherent(self):
        if self.period_end < self.period_start or self.source_id != self.evidence.source_id:
            raise ValueError('Invalid historical period or provenance')
        if self.unit == 'percent' and self.value > 100:
            raise ValueError('Invalid percentage')
        return self


class HistoricalSeries(StrictModel):
    series_id: str
    family: Family
    metric: str
    unit: str
    geography_id: str | None
    geography_level: str
    geography_name: str
    classification: dict[str, str | None]
    frequency: Literal['ANNUAL', 'FISCAL_YEAR', 'POINT']
    methodology_version: str
    applicability_end: date | None = None
    applicability_evidence_url: str | None = None
    observations: list[HistoricalPoint]
    source_ids: list[str]
    missing_periods: list[str]
    limitations: list[str]


class TrendChange(StrictModel):
    status: Literal['DERIVED', 'UNAVAILABLE']
    from_id: str
    to_id: str
    from_period: str
    to_period: str
    absolute_change: float | None = None
    change_unit: str
    growth_percent: float | None = None
    direction: Literal['INCREASE', 'DECREASE', 'UNCHANGED'] | None = None
    reason_codes: list[str]
    methodology_version: Literal['adjacent-observed-change-1.0'] = 'adjacent-observed-change-1.0'
    evidence: list[Evidence]

    @model_validator(mode='after')
    def coherent(self):
        if len(self.evidence)!=2:
            raise ValueError('Change requires both observation references')
        if self.status=='UNAVAILABLE' and any(x is not None for x in [self.absolute_change,self.growth_percent,self.direction]):
            raise ValueError('Unavailable comparisons cannot contain derived values')
        if self.status=='DERIVED' and (self.absolute_change is None or self.direction is None):
            raise ValueError('Derived comparison requires a defined change')
        return self


class ReadinessCheck(StrictModel):
    code: str
    passed: bool
    explanation: str


class Readiness(StrictModel):
    status: ReadinessStatus
    checks: list[ReadinessCheck]
    reason_codes: list[str]
    horizon: int
    complete_observations: int
    minimum_training: Literal[4] = 4
    minimum_backtest_origins: Literal[3] = 3
    policy_version: Literal['annual-baseline-gate-1.0'] = 'annual-baseline-gate-1.0'


class BacktestFold(StrictModel):
    training_ids: list[str]
    target_id: str
    target_period: str
    horizon: int
    observed: float
    predicted: float
    error: float


class Backtest(StrictModel):
    status: Literal['AVAILABLE', 'UNAVAILABLE']
    model_name: Literal['Last observation baseline'] = 'Last observation baseline'
    model_version: Literal['naive-1.0'] = 'naive-1.0'
    methodology: str
    folds: list[BacktestFold]
    mae: float | None = None
    rmse: float | None = None
    bias: float | None = None
    unit: str
    reason_codes: list[str]

    @model_validator(mode='after')
    def coherent(self):
        metrics=[self.mae,self.rmse,self.bias]
        if self.status=='AVAILABLE':
            if len(self.folds)<3 or any(x is None or not isfinite(x) for x in metrics) or self.mae<0 or self.rmse<0:
                raise ValueError('Available backtest requires finite measured errors and three holdouts')
            if any(len(f.training_ids)<4 or f.target_id in f.training_ids for f in self.folds):
                raise ValueError('Backtest must separate training from holdout')
        elif self.folds or any(x is not None for x in metrics):
            raise ValueError('Unavailable backtest cannot invent error metrics')
        return self


class ForecastPoint(StrictModel):
    status: Literal['FORECAST'] = 'FORECAST'
    period: str
    period_start: date
    period_end: date
    value: float = Field(ge=0, allow_inf_nan=False)
    lower: float = Field(ge=0, allow_inf_nan=False)
    upper: float = Field(ge=0, allow_inf_nan=False)
    interval_level: Literal[0.95] = 0.95

    @model_validator(mode='after')
    def coherent(self):
        if not self.lower <= self.value <= self.upper or self.period_end < self.period_start:
            raise ValueError('Invalid forecast interval')
        return self


class TrendResult(StrictModel):
    series: HistoricalSeries
    changes: list[TrendChange]
    trend_status: Literal['DERIVED', 'UNAVAILABLE']
    readiness: Readiness


class ForecastResult(StrictModel):
    series: HistoricalSeries
    status: Literal['FORECAST', 'UNAVAILABLE']
    readiness: Readiness
    historical_observation_ids: list[str]
    training_start: date | None
    training_end: date | None
    model_name: Literal['Last observation baseline'] = 'Last observation baseline'
    model_version: Literal['naive-1.0'] = 'naive-1.0'
    generated_at: datetime | None = None
    horizon: int
    forecasts: list[ForecastPoint]
    backtest: Backtest
    methodology: str
    uncertainty_methodology: str
    evidence: list[Evidence]
    quality_status: Literal['VALID', 'RESTRICTED']
    limitations: list[str]

    @model_validator(mode='after')
    def gated(self):
        if self.historical_observation_ids!=[p.observation_id for p in self.series.observations] or self.evidence!=[p.evidence for p in self.series.observations]:
            raise ValueError('Forecast input lineage must match actual history')
        if self.status == 'FORECAST':
            if self.readiness.status != 'READY' or not all(c.passed for c in self.readiness.checks) or self.backtest.status != 'AVAILABLE' or len(self.forecasts) != self.horizon or not self.generated_at or self.quality_status != 'VALID':
                raise ValueError('Forecast must pass readiness and backtesting')
            if any(not isfinite(x) for x in [self.backtest.mae, self.backtest.rmse, self.backtest.bias] if x is not None):
                raise ValueError('Invalid backtest metric')
        elif self.forecasts or self.generated_at is not None:
            raise ValueError('Unavailable forecasts cannot contain predictions')
        return self


class TrendsResponse(StrictModel):
    version: str
    status: Literal['OBSERVED', 'EMPTY']
    total: int
    items: list[TrendResult]
    sources: list[dict]


class ForecastResponse(StrictModel):
    version: str
    status: Literal['FORECAST', 'UNAVAILABLE', 'EMPTY']
    total: int
    items: list[ForecastResult]
    sources: list[dict]
