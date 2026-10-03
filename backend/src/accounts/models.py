from typing import Literal
from pydantic import BaseModel, Field, ConfigDict, field_validator
from datetime import datetime


class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid')


class Education(StrictModel):
    qualification: Literal['','below_matric','matric','secondary','diploma','undergraduate','graduate','postgraduate','doctorate','other','prefer_not'] = ''
    degree: str = Field(default='',max_length=120)
    field: str = Field(default='',max_length=120)
    year: int | None = None
    origin: Literal['SELF_REPORTED','RESUME_DERIVED'] = 'SELF_REPORTED'
    resume_id: str | None = None

    @field_validator('year')
    @classmethod
    def year_valid(cls, value):
        if value is not None and not 1900 <= value <= datetime.now().year + 10: raise ValueError('Invalid year')
        return value


class Skill(StrictModel):
    name: str = Field(min_length=1,max_length=100)
    canonical_id: str | None = None
    taxonomy: str | None = None
    proficiency: Literal['','beginner','intermediate','advanced'] = ''
    origin: Literal['SELF_REPORTED','RESUME_DERIVED'] = 'SELF_REPORTED'
    resume_id: str | None = None


class Experience(StrictModel):
    name: str = Field(min_length=1,max_length=120)
    origin: Literal['SELF_REPORTED','RESUME_DERIVED'] = 'SELF_REPORTED'
    resume_id: str | None = None


class Career(StrictModel):
    goals: list[Literal['job','switch','upskill','choose','training','business','labour','government','explore']] = Field(default_factory=list,max_length=9)
    note: str = Field(default='',max_length=500)


class Geography(StrictModel):
    current: str | None = None
    preferred: list[str] = Field(default_factory=list,max_length=37)
    relocation: bool = False
    remote: bool = False


class Onboarding(StrictModel):
    step: int = Field(default=0,ge=0,le=6)
    status: Literal['not_started','in_progress','skipped','complete'] = 'not_started'


class Alerts(StrictModel):
    email: bool = False
    skills: bool = False
    occupations: bool = False
    regions: bool = False
    datasets: bool = False
    reports: bool = False


class Name(StrictModel):
    name: str = Field(min_length=1,max_length=80)


class PasswordChange(StrictModel):
    current_password: str = Field(min_length=1,max_length=200)
    new_password: str = Field(min_length=1,max_length=200)


class TargetChange(StrictModel):
    target: str = Field(min_length=3,max_length=254)
    current_password: str = Field(min_length=1,max_length=200)


class Watch(StrictModel):
    kind: Literal['regions','industries','skills','occupations']
    entity_id: str = Field(min_length=1,max_length=120)


class Analysis(StrictModel):
    title: str = Field(min_length=1,max_length=120)
    route: Literal['/intelligence','/regions','/industries','/forecast']
    query: dict[str,str] = Field(default_factory=dict,max_length=10)


class ResumeConfirmation(StrictModel):
    resume_id: str
    skills: list[str] = Field(default_factory=list,max_length=50)
    degree: str = Field(default='',max_length=120)
    experience: list[str] = Field(default_factory=list,max_length=20)
