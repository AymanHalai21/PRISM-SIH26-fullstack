import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.session import Base


def uuid_pk():
    return mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))


def utc_now():
    return datetime.utcnow()


class RoleCode(str, enum.Enum):
    POLICE = "POLICE"
    JUDGE = "JUDGE"
    LAWYER = "LAWYER"
    FORENSIC = "FORENSIC"


class CaseStatus(str, enum.Enum):
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    FORENSIC_PENDING = "FORENSIC_PENDING"
    COURT_PROCEEDING = "COURT_PROCEEDING"
    CLOSED = "CLOSED"


class IntegrityStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    MISMATCH = "MISMATCH"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class AssignmentRole(str, enum.Enum):
    INVESTIGATING_OFFICER = "INVESTIGATING_OFFICER"
    FORENSIC_EXPERT = "FORENSIC_EXPERT"
    JUDGE = "JUDGE"


class DocumentType(str, enum.Enum):
    FIR = "FIR"
    INVESTIGATION_REPORT = "INVESTIGATION_REPORT"
    FORENSIC_REPORT = "FORENSIC_REPORT"
    LEGAL_DOCUMENT = "LEGAL_DOCUMENT"
    OTHER = "OTHER"


class AccessScope(str, enum.Enum):
    CASE_TEAM = "CASE_TEAM"
    JUDGE_AND_AUTHORIZED_LAWYER = "JUDGE_AND_AUTHORIZED_LAWYER"
    RESTRICTED = "RESTRICTED"


class SignatureStatus(str, enum.Enum):
    UNSIGNED = "UNSIGNED"
    SIGNED = "SIGNED"


class OcrStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"


class CustodyEventType(str, enum.Enum):
    REGISTERED = "REGISTERED"
    TRANSFERRED = "TRANSFERRED"
    RECEIVED = "RECEIVED"
    EXAMINATION_STARTED = "EXAMINATION_STARTED"
    EXAMINATION_COMPLETED = "EXAMINATION_COMPLETED"


class AuditResult(str, enum.Enum):
    SUCCESS = "SUCCESS"
    DENIED = "DENIED"
    FAILURE = "FAILURE"


class Role(Base):
    __tablename__ = "roles"
    id: Mapped[str] = uuid_pk()
    code: Mapped[RoleCode] = mapped_column(unique=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = uuid_pk()
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    department: Mapped[str | None] = mapped_column(String(200))
    mfa_secret_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    roles: Mapped[list[Role]] = relationship(secondary="user_roles")


class UserRole(Base):
    __tablename__ = "user_roles"
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id"), primary_key=True)


class Case(Base):
    __tablename__ = "cases"
    id: Mapped[str] = uuid_pk()
    case_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    police_station: Mapped[str] = mapped_column(String(200), nullable=False)
    area: Mapped[str | None] = mapped_column(String(200))
    year: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[CaseStatus] = mapped_column(default=CaseStatus.UNDER_INVESTIGATION, nullable=False)
    registration_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    incident_date: Mapped[datetime | None] = mapped_column(Date)
    incident_location: Mapped[str | None] = mapped_column(Text)
    investigating_officer_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    assigned_judge_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class CaseAssignment(Base):
    __tablename__ = "case_assignments"
    __table_args__ = (Index("uq_case_assignments_active", "case_id", "user_id", "assignment_role", unique=True, postgresql_where=text("active = true"), sqlite_where=text("active = 1")),)
    id: Mapped[str] = uuid_pk()
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    assignment_role: Mapped[AssignmentRole] = mapped_column(nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    assigned_by_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    unassigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[str] = uuid_pk()
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=False)
    document_type: Mapped[DocumentType] = mapped_column(nullable=False)
    display_name: Mapped[str] = mapped_column(String(512), nullable=False)
    access_scope: Mapped[AccessScope] = mapped_column(nullable=False)
    signature_status: Mapped[SignatureStatus] = mapped_column(default=SignatureStatus.UNSIGNED, nullable=False)
    created_by_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    current_version_id: Mapped[str | None] = mapped_column(ForeignKey("document_versions.id"), unique=True)
    is_final: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class DocumentVersion(Base):
    __tablename__ = "document_versions"
    __table_args__ = (UniqueConstraint("document_id", "version_number"),)
    id: Mapped[str] = uuid_pk()
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    object_key: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    content_type: Mapped[str] = mapped_column(String(64), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    uploaded_by_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    supersedes_version_id: Mapped[str | None] = mapped_column(ForeignKey("document_versions.id"))
    ocr_status: Mapped[OcrStatus] = mapped_column(default=OcrStatus.PENDING, nullable=False)


class FirRecord(Base):
    __tablename__ = "fir_records"
    id: Mapped[str] = uuid_pk()
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), unique=True, nullable=False)
    fir_number: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    complainant: Mapped[str] = mapped_column(Text, nullable=False)
    accused: Mapped[str | None] = mapped_column(Text)
    legal_sections: Mapped[str | None] = mapped_column(Text)
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    document_id: Mapped[str | None] = mapped_column(ForeignKey("documents.id"))


class Evidence(Base):
    __tablename__ = "evidence"
    id: Mapped[str] = uuid_pk()
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=False)
    evidence_number: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    evidence_type: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    collected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    collected_by_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    current_custodian_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    integrity_sha256: Mapped[str | None] = mapped_column(String(64))
    integrity_status: Mapped[IntegrityStatus] = mapped_column(default=IntegrityStatus.NOT_APPLICABLE, nullable=False)
    version_lock: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ChainOfCustodyEvent(Base):
    __tablename__ = "chain_of_custody_events"
    id: Mapped[str] = uuid_pk()
    evidence_id: Mapped[str] = mapped_column(ForeignKey("evidence.id"), nullable=False)
    event_type: Mapped[CustodyEventType] = mapped_column(nullable=False)
    previous_custodian_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    new_custodian_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    actor_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    location: Mapped[str | None] = mapped_column(Text)
    reason: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    evidence_version: Mapped[int] = mapped_column(Integer, nullable=False)


class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[str] = uuid_pk()
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    action: Mapped[str] = mapped_column(String(160), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String(36))
    resource_label: Mapped[str | None] = mapped_column(Text)
    result: Mapped[AuditResult] = mapped_column(nullable=False)
    details: Mapped[dict] = mapped_column(JSON().with_variant(JSONB, "postgresql"), default=dict, nullable=False)
    previous_event_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    event_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id: Mapped[str] = uuid_pk()
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    replaced_by_id: Mapped[str | None] = mapped_column(ForeignKey("refresh_tokens.id"))
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(Text)


# Phase 3+ tables are present now to keep the Phase 1 migration complete.
class ForensicExamination(Base):
    __tablename__ = "forensic_examinations"
    id: Mapped[str] = uuid_pk()
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=False)
    evidence_id: Mapped[str] = mapped_column(ForeignKey("evidence.id"), nullable=False)
    expert_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    examination_type: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    methods: Mapped[str | None] = mapped_column(Text)
    equipment: Mapped[str | None] = mapped_column(Text)
    findings: Mapped[str | None] = mapped_column(Text)
    observations: Mapped[str | None] = mapped_column(Text)
    results: Mapped[str | None] = mapped_column(Text)
    conclusion: Mapped[str | None] = mapped_column(Text)


class ForensicReport(Base):
    __tablename__ = "forensic_reports"
    id: Mapped[str] = uuid_pk()
    examination_id: Mapped[str] = mapped_column(ForeignKey("forensic_examinations.id"), unique=True, nullable=False)
    document_version_id: Mapped[str] = mapped_column(ForeignKey("document_versions.id"), unique=True, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    finalized_by_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    finalized_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    is_immutable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class AccessRequest(Base):
    __tablename__ = "access_requests"
    id: Mapped[str] = uuid_pk()
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=False)
    lawyer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    assigned_judge_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    requested_permissions: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="PENDING", nullable=False)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    decision_reason: Mapped[str | None] = mapped_column(Text)
    decided_by_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))


class CaseAuthorization(Base):
    __tablename__ = "case_authorizations"
    id: Mapped[str] = uuid_pk()
    case_id: Mapped[str] = mapped_column(ForeignKey("cases.id"), nullable=False)
    lawyer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    approved_by_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    access_request_id: Mapped[str | None] = mapped_column(ForeignKey("access_requests.id"), unique=True)
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE", nullable=False)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_by_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))


class AuthorizationPermission(Base):
    __tablename__ = "authorization_permissions"
    __table_args__ = (UniqueConstraint("authorization_id", "permission"),)
    id: Mapped[str] = uuid_pk()
    authorization_id: Mapped[str] = mapped_column(ForeignKey("case_authorizations.id"), nullable=False)
    permission: Mapped[str] = mapped_column(String(64), nullable=False)
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[str] = uuid_pk()
    recipient_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    resource_type: Mapped[str | None] = mapped_column(String(64))
    resource_id: Mapped[str | None] = mapped_column(String(36))
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
