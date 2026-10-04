"""Controlled, non-executable scenario input and explicitly simulated output."""
from typing import Literal
from math import isfinite, isclose
from pydantic import Field, model_validator
from src.data_pipeline.models import StrictModel, Evidence
from src.trends.models import HistoricalPoint, HistoricalSeries

ScenarioType = Literal['SKILL_SHOCK', 'DIRECT_METRIC_SENSITIVITY']
AssumptionKind = Literal['AI_ADOPTION', 'AUTOMATION', 'SECTOR_EXPANSION', 'DIRECT_METRIC_CHANGE']


def native_identity_matches(series: HistoricalSeries, point: HistoricalPoint):
    expected={'family':series.family,'metric':series.metric,'geography_id':series.geography_id,
        'frequency':series.frequency,'unit':series.unit,'methodology_version':series.methodology_version,**series.classification}
    return all(point.identity.get(k)==v for k,v in expected.items())


class Assumption(StrictModel):
    kind: AssumptionKind
    change_percent: float = Field(ge=-100, le=1000, allow_inf_nan=False)


class ScenarioRequest(StrictModel):
    scenario_type: ScenarioType
    series_id: str = Field(min_length=1, max_length=120)
    assumption: Assumption

    @model_validator(mode='after')
    def controlled(self):
        if (self.scenario_type == 'DIRECT_METRIC_SENSITIVITY') != (self.assumption.kind == 'DIRECT_METRIC_CHANGE'):
            raise ValueError('Direct sensitivity requires a direct metric assumption; adoption requires a reviewed impact rule')
        return self


class RelationshipEntity(StrictModel):
    entity_type: Literal['skill', 'occupation', 'industry', 'region', 'metric']
    entity_id: str = Field(min_length=1)
    label: str


class Relationship(StrictModel):
    relationship_id: str
    relationship_type: str
    source_entity: RelationshipEntity
    target_entity: RelationshipEntity
    source_id: str | None
    evidence: list[Evidence]
    confidence: float | None = Field(default=None, ge=0, le=1, allow_inf_nan=False)
    status: Literal['VERIFIED', 'REQUIRES_REVIEW', 'UNAVAILABLE', 'SIMULATED']
    relationship_origin: Literal['OBSERVED', 'EVIDENCED', 'INFERRED', 'SIMULATED']

    @model_validator(mode='after')
    def qualified(self):
        if self.status == 'VERIFIED' and (not self.evidence or not self.source_id or self.relationship_origin not in {'OBSERVED', 'EVIDENCED'}):
            raise ValueError('Verified relationships require source evidence; inference is not verification')
        if self.status == 'VERIFIED' and any(e.source_id != self.source_id for e in self.evidence):
            raise ValueError('Relationship evidence must authenticate the declared source')
        if self.relationship_origin == 'SIMULATED' and self.status != 'SIMULATED':
            raise ValueError('Simulation cannot masquerade as an observed relationship')
        return self


class ImpactRule(StrictModel):
    rule_id: Literal['direct-metric-sensitivity-1.0'] = 'direct-metric-sensitivity-1.0'
    rule_kind: Literal['DIRECT_ASSUMPTION'] = 'DIRECT_ASSUMPTION'
    expression_id: Literal['BASELINE_PERCENT_MULTIPLIER'] = 'BASELINE_PERCENT_MULTIPLIER'
    coefficient_origin: Literal['USER_ASSUMPTION'] = 'USER_ASSUMPTION'


class SensitivityResult(StrictModel):
    status: Literal['SCENARIO'] = 'SCENARIO'
    simulation: Literal[True] = True
    baseline_observation_id: str
    baseline_value: float = Field(ge=0, allow_inf_nan=False)
    value: float = Field(ge=0, allow_inf_nan=False)
    absolute_change: float = Field(allow_inf_nan=False)
    change_percent: float = Field(ge=-100, le=1000, allow_inf_nan=False)
    unit: str
    period: str
    geography_id: str
    rule_id: Literal['direct-metric-sensitivity-1.0'] = 'direct-metric-sensitivity-1.0'

    @model_validator(mode='after')
    def arithmetic(self):
        if self.unit == 'percent' and self.value > 100:
            raise ValueError('No clipping beyond the metric domain')
        if not isclose(self.value, self.baseline_value * (1+self.change_percent/100), abs_tol=1e-8, rel_tol=1e-10) or not isclose(self.absolute_change, self.value-self.baseline_value, abs_tol=1e-8, rel_tol=1e-10):
            raise ValueError('Direct sensitivity must preserve the declared arithmetic')
        return self


class ScenarioUncertainty(StrictModel):
    status: Literal['UNAVAILABLE'] = 'UNAVAILABLE'
    reason: str


class ScenarioResult(StrictModel):
    version: str
    scenario_id: str
    scenario_type: ScenarioType
    status: Literal['SCENARIO', 'NOT_READY', 'UNAVAILABLE']
    is_simulation: Literal[True] = True
    disclosure: Literal['SIMULATION — NOT OBSERVED DATA'] = 'SIMULATION — NOT OBSERVED DATA'
    assumptions: list[Assumption] = Field(min_length=1, max_length=1)
    baseline: HistoricalPoint | None
    series: HistoricalSeries | None
    results: list[SensitivityResult]
    affected_entities: list[RelationshipEntity]
    impact_rules: list[ImpactRule]
    relationships: list[Relationship]
    reason_codes: list[str]
    required_data: list[str]
    evidence: list[Evidence]
    sources: list[dict]
    methodology_version: Literal['scenario-gate-1.0'] = 'scenario-gate-1.0'
    methodology: str
    limitations: list[str]
    uncertainty: ScenarioUncertainty

    @model_validator(mode='after')
    def gated(self):
        if self.baseline:
            if not self.series or self.baseline not in self.series.observations or self.baseline.evidence not in self.evidence:
                raise ValueError('Baseline lineage must match the original observed series')
            if not native_identity_matches(self.series,self.baseline):
                raise ValueError('Baseline native identity must match the declared dimensions')
            source=next((s for s in self.sources if s.get('source_id')==self.baseline.source_id),{})
            if source.get('connected') is not True or source.get('sha256') != self.baseline.evidence.raw_sha256 or (source.get('version') or 'unspecified') != self.baseline.source_version:
                raise ValueError('Scenario baseline requires connected checksum/version source evidence')
        if self.status != 'SCENARIO':
            if self.results or self.affected_entities or self.impact_rules or self.relationships:
                raise ValueError('Not-ready scenarios cannot invent numerical or relationship outputs')
        else:
            if self.scenario_type != 'DIRECT_METRIC_SENSITIVITY' or not self.baseline or not self.series or len(self.results) != 1 or len(self.impact_rules) != 1:
                raise ValueError('Only a direct observed-metric assumption has an executable rule')
            b, r = self.baseline, self.results[0]
            if b.status != 'OBSERVED' or b.partial or b.quality_status != 'VALID' or (b.as_of is not None and b.period_end > b.as_of) or self.series.geography_id is None:
                raise ValueError('Only mapped valid complete observations may be a sensitivity baseline')
            if r.baseline_observation_id != b.observation_id or r.baseline_value != b.value or r.unit != b.unit or r.period != b.period or r.geography_id != self.series.geography_id or r.change_percent != self.assumptions[0].change_percent:
                raise ValueError('Scenario must preserve native baseline dimensions and exact assumption')
            if self.relationships or self.reason_codes or any(not isfinite(x) for x in [r.value,r.absolute_change]):
                raise ValueError('Direct sensitivity provides no propagated relationship effects')
        return self
