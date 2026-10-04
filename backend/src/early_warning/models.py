"""Explainable review signals are derived, never new observations."""
from typing import Literal
from pydantic import Field, model_validator
from src.data_pipeline.models import StrictModel, Evidence
from src.trends.models import HistoricalPoint, ReadinessCheck

SignalType = Literal['DEMAND_ACCELERATION', 'SUPPLY_ACCELERATION', 'DEMAND_SUPPLY_DIVERGENCE',
    'REGIONAL_DEMAND_ANOMALY', 'EMERGING_SKILL_SIGNAL', 'DECLINING_SKILL_SIGNAL',
    'TRAINING_PRESSURE', 'DATA_COVERAGE_WARNING', 'LABOUR_INDICATOR_CHANGE', 'TRAINING_OUTPUT_ACCELERATION']
SIGNAL_TYPES = list(SignalType.__args__)
ReadinessStatus = Literal['READY', 'NOT_READY', 'UNAVAILABLE', 'INSUFFICIENT_HISTORY',
    'MISSING_PERIODS', 'INCOMPATIBLE_SERIES', 'INSUFFICIENT_COVERAGE', 'QUALITY_RESTRICTION']


class RulePolicy(StrictModel):
    version: Literal['historical-review-rules-1.0'] = 'historical-review-rules-1.0'
    labour_change_pp: float = Field(default=2, gt=0, le=100, allow_inf_nan=False)
    training_acceleration_pp: float = Field(default=10, gt=0, le=10000, allow_inf_nan=False)


class Geography(StrictModel):
    geography_id: str | None
    geography_name: str
    geography_level: str


class DerivedMetrics(StrictModel):
    absolute_change: float | None = Field(default=None, allow_inf_nan=False)
    change_unit: str | None = None
    growth_percent: float | None = Field(default=None, allow_inf_nan=False)
    previous_growth_percent: float | None = Field(default=None, allow_inf_nan=False)
    acceleration_pp: float | None = Field(default=None, allow_inf_nan=False)
    observed_period_count: int = Field(ge=0)


class TriggerRule(StrictModel):
    rule_id: str
    version: str
    threshold: float | None = Field(default=None, gt=0, allow_inf_nan=False)
    threshold_unit: str | None = None
    operator: Literal['>=', 'REQUIRED']
    minimum_history: int = Field(ge=0)
    methodology: str


class Provenance(StrictModel):
    source_id: str
    source_version: str
    publication_version: str
    observation_ids: list[str]


class SignalReadiness(StrictModel):
    signal_type: SignalType
    status: ReadinessStatus
    reason: str
    reason_codes: list[str]
    required_data: list[str]
    checks: list[ReadinessCheck]
    eligible_series: int = Field(ge=0)
    minimum_history: int = Field(ge=0)
    evidence: list[Evidence]

    @model_validator(mode='after')
    def coherent(self):
        if self.status == 'READY' and (self.eligible_series < 1 or any(not c.passed for c in self.checks)):
            raise ValueError('Ready signals require eligible verified inputs and passed checks')
        if self.status != 'READY' and self.eligible_series:
            raise ValueError('Restricted readiness cannot claim eligible series')
        return self


class Warning(StrictModel):
    signal_id: str
    signal_type: SignalType
    entity_type: Literal['labour_indicator', 'training_output', 'data_coverage']
    entity_id: str
    entity_name: str
    geography: Geography
    period: str
    comparison_period: str | None
    severity: Literal['INFO', 'REVIEW']
    status: Literal['DERIVED'] = 'DERIVED'
    observed_values: list[HistoricalPoint]
    derived_metrics: DerivedMetrics
    trigger_rule: TriggerRule
    evidence: list[Evidence]
    provenance: list[Provenance]
    limitations: list[str]
    confidence_or_qualification: str

    @model_validator(mode='after')
    def coherent(self):
        from decimal import Decimal
        from src.trends.engine import compatible, adjacent, regular
        p = self.observed_values
        if not p or len({x.observation_id for x in p}) != len(p):
            raise ValueError('Review signal requires genuine unique context observations')
        if self.evidence != [x.evidence for x in p] or self.derived_metrics.observed_period_count != len(p):
            raise ValueError('Review evidence/count must match preserved context observations')
        expected = {}
        for x in p:
            expected.setdefault((x.source_id, x.source_version, x.publication_version), []).append(x.observation_id)
        actual = {(x.source_id, x.source_version, x.publication_version): x.observation_ids for x in self.provenance}
        if actual != expected or len(self.provenance) != len(expected):
            raise ValueError('Review provenance must match actual observation lineage')
        if any(x.identity.get('geography_id') != self.geography.geography_id or x.identity.get('unit') != x.unit for x in p):
            raise ValueError('Review geography and units must match source-native identity')
        m = self.derived_metrics
        numeric = [m.absolute_change, m.growth_percent, m.previous_growth_percent, m.acceleration_pp]
        if self.signal_type == 'DATA_COVERAGE_WARNING':
            if (self.entity_type != 'data_coverage' or self.severity != 'INFO' or any(x is not None for x in numeric)
                    or m.change_unit is not None or self.trigger_rule.operator != 'REQUIRED' or self.trigger_rule.threshold is not None
                    or self.trigger_rule.threshold_unit is not None or self.trigger_rule.minimum_history != 0
                    or self.comparison_period is not None or self.period != p[-1].period):
                raise ValueError('Coverage notices cannot invent labour change or calibrated risk')
            return self
        if self.signal_type not in {'LABOUR_INDICATOR_CHANGE', 'TRAINING_OUTPUT_ACCELERATION'}:
            raise ValueError('Unsupported warning type has no approved observed rule')
        if (self.severity != 'REVIEW' or self.trigger_rule.operator != '>=' or self.trigger_rule.threshold is None
                or self.trigger_rule.threshold_unit != 'percentage points'
                or self.trigger_rule.rule_id != self.signal_type.lower()+'-latest-complete'
                or self.trigger_rule.version != 'historical-review-rules-1.0'):
            raise ValueError('Historical signals require an explicit review threshold')
        count = 2 if self.signal_type == 'LABOUR_INDICATOR_CHANGE' else 3
        frequency = 'ANNUAL' if count == 2 else 'FISCAL_YEAR'
        family = 'labour' if count == 2 else 'supply'
        metrics = {'LFPR','WPR','UR'} if count == 2 else {'TRAINED','CERTIFIED'}
        if any(x.identity.get('family') != family or x.identity.get('metric') not in metrics or x.identity.get('frequency') != frequency for x in p):
            raise ValueError('Review contract cannot relabel source-native metric semantics')
        if len(p) != count or self.trigger_rule.minimum_history != count or any(x.quality_status != 'VALID' or x.partial or (x.as_of is not None and x.period_end>x.as_of) for x in p):
            raise ValueError('Historical rule requires complete valid observations')
        if not regular(p, frequency) or any(not compatible(a, b) or not adjacent(a, b, frequency) for a, b in zip(p, p[1:])):
            raise ValueError('Historical rule inputs must remain compatible and adjacent')
        if self.period != p[-1].period or self.comparison_period != p[-2].period:
            raise ValueError('Review periods must match input observations')
        delta = float(Decimal(str(p[-1].value)) - Decimal(str(p[-2].value)))
        growth = None if p[-2].value == 0 else float((Decimal(str(p[-1].value)) / Decimal(str(p[-2].value)) - 1) * 100)
        if m.absolute_change != delta or m.growth_percent != growth:
            raise ValueError('Derived review values must match source observations')
        if count == 2:
            if self.entity_type != 'labour_indicator' or any(x.unit != 'percent' for x in p) or m.change_unit != 'percentage points' or m.previous_growth_percent is not None or m.acceleration_pp is not None or abs(delta) < self.trigger_rule.threshold:
                raise ValueError('Labour review requires a thresholded native rate movement')
        else:
            previous = None if p[0].value == 0 else float((Decimal(str(p[1].value)) / Decimal(str(p[0].value)) - 1) * 100)
            acceleration = None if previous is None or growth is None else float(Decimal(str(growth)) - Decimal(str(previous)))
            if self.entity_type != 'training_output' or any(x.unit != 'persons' for x in p) or m.change_unit != 'persons' or growth is None or growth <= 0 or m.previous_growth_percent != previous or m.acceleration_pp != acceleration or acceleration is None or acceleration < self.trigger_rule.threshold:
                raise ValueError('Training review requires positive growth and growth acceleration')
        return self


class EarlyWarningResponse(StrictModel):
    version: str
    engine_version: str
    data_mode: Literal['verified'] = 'verified'
    status: Literal['AVAILABLE', 'UNAVAILABLE', 'EMPTY']
    total: int = Field(ge=0)
    items: list[Warning]
    readiness: list[SignalReadiness]
    sources: list[dict]

    @model_validator(mode='after')
    def coherent(self):
        if len(self.items) > self.total or len({x.signal_id for x in self.items}) != len(self.items):
            raise ValueError('Invalid warning page count or duplicate identity')
        if self.status != 'AVAILABLE' and (self.total or self.items):
            raise ValueError('Unavailable review pages cannot contain warnings')
        return self


class EvidenceResponse(StrictModel):
    version: str
    engine_version: str
    data_mode: Literal['verified'] = 'verified'
    item: Warning
    sources: list[dict]
