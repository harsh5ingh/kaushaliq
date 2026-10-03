"""Canonical aggregate contracts. Rates are not counts, vacancies, or skill demand."""
from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator

DataStatus = Literal["OBSERVED", "DERIVED", "FORECAST", "SCENARIO", "UNAVAILABLE"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Evidence(StrictModel):
    source_id: str = Field(min_length=1)
    locator: str = Field(min_length=1)
    raw_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    transformations: list[str]


class Region(StrictModel):
    region_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    source_name: str = Field(min_length=1)
    parent_region_id: str | None
    region_type: Literal["country", "state", "ut"]
    official_code: str | None = None
    geometry_reference: str | None = None
    evidence: Evidence


class LabourObservation(StrictModel):
    observation_id: str
    indicator: Literal["LFPR", "WPR", "UR"]
    region_id: str
    period: str
    period_start: date
    period_end: date
    sex: Literal["male", "female", "persons"]
    sector: Literal["rural", "urban", "combined"]
    activity_status: Literal["US", "CWS"]
    age_group: Literal["15+"] = "15+"
    value: float = Field(ge=0, le=100)
    unit: Literal["percent"] = "percent"
    status: Literal["OBSERVED"] = "OBSERVED"
    denominator: Literal["population aged 15+", "labour force aged 15+"]
    methodology_version: Literal["PLFS pre-January-2025"] = "PLFS pre-January-2025"
    evidence: Evidence

    @model_validator(mode="after")
    def coherent(self):
        if self.period_end < self.period_start:
            raise ValueError("Invalid observation period")
        expected = "labour force aged 15+" if self.indicator == "UR" else "population aged 15+"
        if self.denominator != expected:
            raise ValueError("Incompatible denominator")
        return self


class Industry(StrictModel):
    industry_id: str
    nic_code: str
    name: str
    level: Literal["section", "division", "group"]
    parent_id: str | None
    source_version: Literal["NIC-2008"] = "NIC-2008"
    class_code: str | None = None
    subclass_code: str | None = None
    evidence: Evidence


class TrainingObservation(StrictModel):
    observation_id: str
    region_id: str
    period: str
    period_start: date
    period_end: date
    as_of: date
    partial: bool
    indicator: Literal["trained", "certified"]
    value: int = Field(ge=0)
    unit: Literal["reported persons"] = "reported persons"
    status: Literal["OBSERVED"] = "OBSERVED"
    programme: Literal["PMKVY"] = "PMKVY"
    evidence: Evidence


class OccupationReference(StrictModel):
    occupation_id: str
    nco_code: str
    occupation_name: str
    major_group: str | None = None
    sub_major_group: str | None = None
    minor_group: str | None = None
    unit_group: str | None = None
    skill_level: str | None = None
    description: str | None = None
    source_version: str
    evidence: Evidence


class SkillReference(StrictModel):
    skill_id: str
    skill_name: str
    skill_category: str | None = None
    skill_type: str | None = None
    occupation_links: list[str] = []
    industry_links: list[str] = []
    source_version: str
    evidence: Evidence


class Snapshot(StrictModel):
    schema_version: Literal["1.0"] = "1.0"
    sources: list[dict]
    regions: list[Region]
    industries: list[Industry]
    labour: list[LabourObservation]
    training: list[TrainingObservation]
    occupations: list[OccupationReference] = []
    skills: list[SkillReference] = []
    coverage: list[dict]
    quality: dict
