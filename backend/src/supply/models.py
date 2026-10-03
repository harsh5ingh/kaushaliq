"""Explicit training and reference semantics; unknown classifications remain null."""
from datetime import date
from typing import Literal
from pydantic import Field, model_validator
from src.data_pipeline.models import StrictModel, Evidence

ReferenceStatus = Literal['VERIFIED','PARTIALLY_VERIFIED','REFERENCE_ONLY','UNAVAILABLE','REQUIRES_PERMISSION']
MappingStatus = Literal['EXACT','DOCUMENTED','PARTIAL','AMBIGUOUS','UNMAPPED','REQUIRES_REVIEW']


class TaxonomySource(StrictModel):
    taxonomy_source_id: str
    publisher: str
    name: str
    version: str | None
    source_url: str
    accessed_at: str
    coverage: str
    classification_purpose: str
    license_access_notes: str
    status: ReferenceStatus
    snapshot_sha256: str | None
    raw_artifact_reference: str | None

    @model_validator(mode='after')
    def coherent(self):
        if not self.source_url.startswith('https://'):raise ValueError('Taxonomy source must use HTTPS')
        if self.status in {'VERIFIED','PARTIALLY_VERIFIED'} and (not self.version or not self.snapshot_sha256 or not self.raw_artifact_reference):raise ValueError('Verified taxonomy requires version and snapshot evidence')
        return self


class Reference(StrictModel):
    taxonomy_system: str = Field(min_length=1)
    taxonomy_version: str = Field(min_length=1)
    code: str = Field(min_length=1)
    title: str = Field(min_length=1)
    description: str | None = None
    parent_code: str | None = None
    status: ReferenceStatus
    source_id: str
    provenance_id: str
    evidence: Evidence


class OccupationReference(Reference):
    occupation_id: str


class SkillReference(Reference):
    skill_id: str
    entity_type: Literal['skill','NOS']


class QualificationReference(Reference):
    qualification_id: str
    entity_type: Literal['qualification','QP','job_role']
    nsqf_level: str | None = None


class MappingRelationship(StrictModel):
    mapping_id: str
    source_system: str
    source_version: str
    source_code: str | None
    source_label: str | None
    target_system: str
    target_version: str
    target_code: str | None
    target_label: str | None
    mapping_type: Literal['EXACT_EQUIVALENCE','DOCUMENTED_CROSSWALK','PARENT_CHILD','RELATED','MANUAL_REVIEW']
    mapping_status: MappingStatus
    confidence: Literal['confirmed','partial','not_assessed']
    review_status: Literal['APPROVED','REQUIRES_REVIEW']
    methodology_version: str
    provenance_id: str
    evidence: Evidence

    @model_validator(mode='after')
    def coherent(self):
        if self.mapping_status in {'EXACT','DOCUMENTED','PARTIAL'}:
            if not self.source_code or not self.target_code or self.review_status!='APPROVED':
                raise ValueError('Resolved relationship requires codes and approved evidence')
        elif self.target_code is not None:
            raise ValueError('Ambiguous/unreviewed relationship cannot assign a target')
        if self.mapping_status=='EXACT' and (self.mapping_type!='EXACT_EQUIVALENCE' or self.confidence!='confirmed'):
            raise ValueError('Exact means confirmed equivalence, never related or partial')
        if self.mapping_status=='DOCUMENTED' and self.confidence!='confirmed':
            raise ValueError('Documented relationship requires confirmed evidence')
        if self.mapping_status=='PARTIAL' and self.confidence!='partial':
            raise ValueError('Partial relationship must retain partial confidence')
        return self


class SupplySignal(StrictModel):
    supply_signal_id: str
    source_id: str
    source_record_id: str
    provenance_id: str
    reference_period: str
    period_start: date
    period_end: date
    period_type: Literal['FISCAL_YEAR','CALENDAR_YEAR','POINT','CUMULATIVE']
    observation_date: date | None
    publication_date: date
    as_of: date
    partial: bool
    geography_id: str
    geography_level: Literal['country','state','ut','district']
    source_geography_label: str
    geography_mapping_status: Literal['EXACT','DOCUMENTED']
    occupation_code: str | None = None
    occupation_system: str | None = None
    skill_code: str | None = None
    skill_system: str | None = None
    qualification_code: str | None = None
    qualification_system: str | None = None
    sector_code: str | None = None
    sector_system: str | None = None
    metric: Literal['TRAINED','CERTIFIED','ENROLLED','COMPLETED','SEATS','TRAINING_CENTRES','CAPACITY','PLACEMENTS']
    semantic_category: Literal['TRAINING_OUTPUT','TRAINING_INFRASTRUCTURE','TRAINING_CAPACITY']
    programme: str
    population: str
    value: int = Field(ge=0,le=2**53-1,strict=True)
    unit: Literal['persons','seats','centres']
    original_value: str
    original_unit: str
    normalized_value: int = Field(ge=0,le=2**53-1,strict=True)
    status: Literal['OBSERVED','DERIVED','ESTIMATED','SCENARIO']
    quality_status: Literal['VALID','WARNING']
    mapping_status: Literal['EXACT','DOCUMENTED','PARTIAL','AMBIGUOUS','UNMAPPED','REQUIRES_REVIEW','UNAVAILABLE']
    methodology_version: str
    evidence: Evidence

    @model_validator(mode='after')
    def coherent(self):
        if self.period_end<self.period_start or self.value!=self.normalized_value:
            raise ValueError('Invalid interval or normalized value')
        if self.as_of>self.publication_date or self.period_start>self.as_of:
            raise ValueError('Invalid observation/publication chronology')
        if self.period_type=='POINT' and (self.period_start!=self.period_end or self.observation_date!=self.period_end or self.partial):
            raise ValueError('Infrastructure stock requires exact point semantics')
        if self.period_end>self.as_of and not self.partial:
            raise ValueError('Incomplete interval must be marked partial')
        if self.period_type=='FISCAL_YEAR' and (self.period_start.month,self.period_start.day,self.period_end.month,self.period_end.day)!=(4,1,3,31):
            raise ValueError('Fiscal year must preserve April-March semantics')
        expected=('TRAINING_INFRASTRUCTURE','centres') if self.metric=='TRAINING_CENTRES' else ('TRAINING_CAPACITY','seats') if self.metric in {'SEATS','CAPACITY'} else ('TRAINING_OUTPUT','persons')
        if (self.semantic_category,self.unit)!=expected:
            raise ValueError('Training output/infrastructure/capacity and units must remain distinct')
        for code,system in [(self.occupation_code,self.occupation_system),(self.skill_code,self.skill_system),(self.qualification_code,self.qualification_system),(self.sector_code,self.sector_system)]:
            if (code is None)!=(system is None): raise ValueError('Code/system pair required')
        return self


class SupplySnapshot(StrictModel):
    schema_version: Literal['supply-1.0']='supply-1.0'
    methodology_version: str
    base_version: str
    sources: list[dict]
    signals: list[SupplySignal]
    occupations: list[OccupationReference]
    skills: list[SkillReference]
    qualifications: list[QualificationReference]
    mappings: list[MappingRelationship]
    taxonomy_sources: list[TaxonomySource]
    coverage: list[dict]
    quality: dict
    capacity: dict
