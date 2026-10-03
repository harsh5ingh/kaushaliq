"""Canonical inputs and derived results retain source semantics and nullable missingness."""
from datetime import date
from decimal import Decimal
from typing import Literal
from pydantic import Field, model_validator
from src.data_pipeline.models import StrictModel, Evidence
from src.supply.models import MappingRelationship

Readiness = Literal['READY', 'PARTIAL', 'NOT_READY']
Dimension = Literal['geography', 'industry', 'occupation', 'skill']
CHECK_DIMENSIONS = {'metric','unit','time','geography','occupation','skill','sector','taxonomy','mapping','granularity','coverage','quality','source'}


class Classification(StrictModel):
    code: str
    system: str
    version: str | None = None
    mapping_status: str
    evidence: Evidence | None = None


class GapMeasure(StrictModel):
    signal_id: str = Field(min_length=1)
    source_id: str = Field(min_length=1)
    source_record_id: str = Field(min_length=1)
    provenance_id: str = Field(min_length=1)
    source_version: str | None
    publication_version: str
    reference_period: str
    period_start: date
    period_end: date
    period_type: Literal['POINT','MONTH','QUARTER','FISCAL_YEAR','CALENDAR_YEAR','CUMULATIVE']
    publication_date: date | None
    partial: bool = False
    geography_id: str | None
    geography_level: str
    source_geography_label: str
    source_geography_code: str | None = None
    observation_date: date | None = None
    as_of: date | None = None
    geography_mapping_status: str
    geography_version: str
    metric: str
    semantic_category: str
    population: str | None
    value: float = Field(ge=0, le=2**53-1, allow_inf_nan=False, strict=True)
    normalized_value: float = Field(ge=0, le=2**53-1, allow_inf_nan=False, strict=True)
    unit: str
    original_value: str
    original_unit: str
    status: Literal['OBSERVED', 'DERIVED', 'ESTIMATED', 'SCENARIO']
    quality_status: str
    quality_flags: list[str] = Field(default_factory=list)
    classifications: dict[str, Classification] = Field(default_factory=dict)
    coverage_fraction: float | None = Field(default=None, ge=0, le=1, allow_inf_nan=False, strict=True)
    coverage_population: str | None = None
    coverage_evidence: Evidence | None = None
    methodology_version: str
    evidence: Evidence

    @model_validator(mode='after')
    def coherent(self):
        if self.period_end < self.period_start or self.value != self.normalized_value:
            raise ValueError('Invalid interval or source-normalized value')
        if self.period_type == 'POINT' and self.period_start != self.period_end:
            raise ValueError('Point observation cannot become an interval')
        if self.source_id != self.evidence.source_id:
            raise ValueError('Observation source and evidence must agree')
        if set(self.classifications) - {'occupation', 'skill', 'sector'}:
            raise ValueError('Unsupported classification dimension')
        return self


class CalculationMethod(StrictModel):
    """A reviewed server-side method, never an API/client approval switch."""
    method_id: str
    version: str
    approved: bool
    demand_metric: str
    supply_metric: str
    demand_semantics: str
    supply_semantics: str
    demand_population: str
    supply_population: str
    unit: str
    dimensions: list[Dimension]
    required_classifications: list[Literal['occupation', 'skill', 'sector']]
    source_versions: dict[str, str]
    methodology: str
    limitations: list[str]
    evidence: Evidence


class CompatibilityCheck(StrictModel):
    dimension: str
    status: Literal['COMPATIBLE', 'INCOMPATIBLE', 'INSUFFICIENT_EVIDENCE']
    reason_code: str
    explanation: str


class GapResult(StrictModel):
    schema_version: Literal['gap-1.0'] = 'gap-1.0'
    result_id: str
    dimension_type: Dimension
    dimension_id: str | None
    readiness: Readiness
    compatibility_status: Literal['COMPATIBLE', 'PARTIAL', 'INCOMPATIBLE', 'INSUFFICIENT_EVIDENCE', 'UNAVAILABLE']
    gap_status: Literal['DERIVED', 'UNAVAILABLE']
    demand: GapMeasure | None
    supply: GapMeasure | None
    gap_value: float | None = Field(default=None, allow_inf_nan=False)
    uncovered_amount: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    coverage_ratio: float | None = Field(default=None, ge=0, allow_inf_nan=False)
    gap_direction: Literal['SHORTFALL', 'SURPLUS', 'BALANCED'] | None = None
    quality_status: Literal['VALID', 'WARNING', 'UNAVAILABLE']
    quality_flags: list[str]
    checks: list[CompatibilityCheck]
    reason_codes: list[str]
    method_id: str | None
    method_version: str | None
    engine_version: str
    methodology: str | None
    transformations: list[str]
    evidence: list[Evidence]
    mapping_references: list[MappingRelationship] = Field(default_factory=list)
    limitations: list[str]

    @model_validator(mode='after')
    def coherent(self):
        if self.readiness != 'READY':
            if self.gap_status != 'UNAVAILABLE' or any(v is not None for v in (self.gap_value, self.uncovered_amount, self.coverage_ratio, self.gap_direction)):
                raise ValueError('Non-ready assessments cannot contain gap arithmetic')
        else:
            if (self.gap_status != 'DERIVED' or not self.demand or not self.supply or not self.method_id
                    or not self.method_version or not self.methodology or self.quality_status != 'VALID'
                    or self.compatibility_status != 'COMPATIBLE'
                    or len(self.checks) != len(CHECK_DIMENSIONS) or {c.dimension for c in self.checks} != CHECK_DIMENSIONS
                    or any(c.status != 'COMPATIBLE' for c in self.checks)):
                raise ValueError('Derived gap requires every compatibility check and reviewed method')
            d, s = Decimal(str(self.demand.value)), Decimal(str(self.supply.value))
            delta = d - s
            if self.gap_value is None or Decimal(str(self.gap_value)) != delta or self.uncovered_amount != float(max(delta, 0)):
                raise ValueError('Derived arithmetic disagrees with preserved inputs')
            ratio = float(s / d) if d else None
            direction = 'SHORTFALL' if delta > 0 else 'SURPLUS' if delta < 0 else 'BALANCED'
            if self.coverage_ratio != ratio or self.gap_direction != direction:
                raise ValueError('Invalid coverage ratio or direction')
        return self


class GapEnvelope(StrictModel):
    version: str
    engine_version: str
    demand_version: str
    supply_version: str
    base_version: str
    data_mode: Literal['verified']
    sources: list[dict]


class GapPage(GapEnvelope):
    status: Literal['READY','PARTIAL','NOT_READY','EMPTY','UNAVAILABLE']
    gap_status: Literal['DERIVED','UNAVAILABLE']
    readiness: Readiness
    reason_code: str | None
    dimension: Dimension
    filters: dict[str, str]
    total: int = Field(ge=0)
    calculated_total: int = Field(ge=0)
    items: list[GapResult]
    limitations: list[str]


class GapEvidenceResponse(GapEnvelope):
    item: GapResult
