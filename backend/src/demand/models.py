"""Explicit source-native demand contracts; taxonomy absence is not a zero."""
from datetime import date
from typing import Literal
from pydantic import Field, model_validator
from src.data_pipeline.models import StrictModel, Evidence

MappingStatus = Literal['EXACT','DOCUMENTED','AMBIGUOUS','UNMAPPED','REQUIRES_REVIEW','UNAVAILABLE']
QualityStatus = Literal['VALID','WARNING','QUARANTINED','UNMAPPED','UNAVAILABLE']

class TaxonomyMapping(StrictModel):
    mapping_id: str
    dimension: Literal['geography','occupation','skill','sector']
    source_label: str | None
    source_code: str | None = None
    source_system: str | None = None
    target_system: str
    target_code: str | None = None
    mapping_method: Literal['exact_code','exact_label','documented_crosswalk','none']
    status: MappingStatus
    confidence: Literal['confirmed','not_assessed']
    review_status: Literal['APPROVED','REQUIRES_REVIEW','NOT_APPLICABLE']
    evidence: Evidence

    @model_validator(mode='after')
    def coherent(self):
        mapped=self.status in {'EXACT','DOCUMENTED'}
        if mapped != (self.target_code is not None): raise ValueError('Unresolved mapping cannot assign a target code')
        if mapped and (self.review_status!='APPROVED' or self.confidence!='confirmed' or self.mapping_method=='none'):
            raise ValueError('Confirmed mapping needs reviewed evidence')
        return self

class DemandSignal(StrictModel):
    signal_id: str = Field(min_length=1)
    source_id: str = Field(min_length=1)
    source_record_id: str = Field(min_length=1)
    provenance_id: str = Field(min_length=1)
    observed_at: date | None = None
    reference_period: str
    period_start: date
    period_end: date
    period_type: Literal['POINT','MONTH','QUARTER','FISCAL_YEAR','CALENDAR_YEAR','CUMULATIVE']
    publication_date: date | None = None
    geography_id: str | None = None
    geography_level: Literal['country','state','ut','district','multi_state','unknown']
    source_geography_label: str
    source_geography_code: str | None = None
    geography_mapping_status: MappingStatus
    source_occupation_label: str | None = None
    source_occupation_code: str | None = None
    source_occupation_system: str | None = None
    occupation_code: str | None = None
    occupation_system: str | None = None
    source_skill_label: str | None = None
    source_skill_code: str | None = None
    source_skill_system: str | None = None
    skill_code: str | None = None
    skill_system: str | None = None
    source_sector_label: str | None = None
    source_sector_code: str | None = None
    source_sector_system: str | None = None
    sector_code: str | None = None
    sector_system: str | None = None
    metric: str
    value: float = Field(ge=0,allow_inf_nan=False)
    unit: str
    original_value: str
    original_unit: str
    normalized_value: float = Field(ge=0,allow_inf_nan=False)
    direction: Literal['UP','DOWN','STABLE'] | None = None
    status: Literal['OBSERVED','DERIVED','ESTIMATED','SCENARIO']
    methodology_version: str
    quality_status: QualityStatus
    mapping_status: MappingStatus
    mapping_ids: list[str]
    evidence: Evidence

    @model_validator(mode='after')
    def coherent(self):
        if self.period_end<self.period_start: raise ValueError('Invalid temporal interval')
        if self.status=='OBSERVED' and self.publication_date and self.publication_date<self.period_end:
            raise ValueError('Observed interval cannot end after its publication date')
        if self.status=='OBSERVED' and self.publication_date and self.publication_date<self.period_end:
            raise ValueError('Observed interval cannot end after its publication date')
        if self.value!=self.normalized_value: raise ValueError('Value must be the separately preserved normalized value')
        if self.period_type=='POINT' and (self.period_start!=self.period_end or self.observed_at!=self.period_end):
            raise ValueError('Point stock must retain its actual observation date')
        if self.geography_id is None and self.geography_mapping_status in {'EXACT','DOCUMENTED'}:
            raise ValueError('Confirmed geography cannot be absent')
        for code,system in [(self.occupation_code,self.occupation_system),(self.skill_code,self.skill_system),(self.sector_code,self.sector_system)]:
            if (code is None)!=(system is None): raise ValueError('Classification code and system must be present together')
        if self.metric=='active_vacancies' and (self.unit!='vacancies' or not self.value.is_integer()):
            raise ValueError('Vacancy counts must be integral source-native quantities')
        return self

class DemandSnapshot(StrictModel):
    schema_version: Literal['demand-1.0']='demand-1.0'
    methodology_version: str
    base_version: str
    sources: list[dict]
    signals: list[DemandSignal]
    mappings: list[TaxonomyMapping]
    coverage: list[dict]
    quality: dict
    forecast: dict
    supply_gap: dict
