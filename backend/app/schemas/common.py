from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Page(APIModel):
    items: list[Any]
    total: int
    limit: int
    offset: int


class LoginInput(BaseModel):
    email: str
    password: str = Field(min_length=1)


class MfaVerifyInput(BaseModel):
    challenge_id: str
    code: str = Field(min_length=6, max_length=6)


class RefreshInput(BaseModel):
    refresh_token: str


class LogoutInput(BaseModel):
    refresh_token: str


class CaseCreate(BaseModel):
    case_number: str
    title: str
    police_station: str
    area: str | None = None
    year: int | None = None
    registration_date: date
    incident_date: date | None = None
    incident_location: str | None = None
    investigating_officer_id: str
    assigned_judge_id: str


class CasePatch(BaseModel):
    title: str | None = None
    police_station: str | None = None
    area: str | None = None
    incident_date: date | None = None
    incident_location: str | None = None
    status: str | None = None


class AssignmentCreate(BaseModel):
    user_id: str
    assignment_role: str


class FirCreate(BaseModel):
    fir_number: str
    complainant: str
    accused: str | None = None
    legal_sections: str | None = None
    registered_at: datetime


class FirPatch(BaseModel):
    complainant: str | None = None
    accused: str | None = None
    legal_sections: str | None = None


class EvidenceCreate(BaseModel):
    evidence_number: str
    evidence_type: str
    description: str
    collected_at: datetime
    collected_by_id: str
    initial_custodian_id: str
    integrity_sha256: str | None = None


class EvidenceTransfer(BaseModel):
    new_custodian_id: str
    location: str | None = None
    reason: str | None = None
    expected_version: int
