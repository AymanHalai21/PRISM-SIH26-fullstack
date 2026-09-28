import hashlib
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import api_error
from app.db.session import get_db
from app.models.models import AccessScope, AssignmentRole, AuditResult, Case, CaseAssignment, CaseStatus, ChainOfCustodyEvent, CustodyEventType, Document, DocumentType, DocumentVersion, Evidence, FirRecord, IntegrityStatus, RoleCode, User
from app.schemas.common import AssignmentCreate, CaseCreate, CasePatch, EvidenceCreate, EvidenceTransfer, FirCreate, FirPatch
from app.security.dependencies import can_view_case, get_current_user, is_active_assignee, require_case_assignee, require_case_view, require_roles, user_role_codes
from app.services.audit import append_audit
from app.services.storage import storage

router = APIRouter(tags=["cases"])
ALLOWED_TYPES = {"application/pdf", "image/png", "image/jpeg", "image/tiff"}
MAX_UPLOAD_BYTES = 25 * 1024 * 1024


def names_for(db: Session, *ids: str | None) -> dict[str, str]:
    """Bulk-resolve user ids to full names. Frontend display needs names, not
    bare ids; this keeps that resolution server-side and consistent."""
    wanted = {i for i in ids if i}
    if not wanted:
        return {}
    rows = db.scalars(select(User).where(User.id.in_(wanted))).all()
    return {u.id: u.full_name for u in rows}


def page(db: Session, statement, offset: int, limit: int, user_ids=None) -> dict:
    limit = max(1, min(limit, 100))
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    items = db.scalars(statement.offset(offset).limit(limit)).all()
    ids = [uid for item in items for uid in (user_ids(item) if user_ids else [])]
    users = names_for(db, *ids)
    return {"items": [serialize(item, users) for item in items], "total": total, "limit": limit, "offset": offset}


def iso(value):
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z") if isinstance(value, datetime) and value.tzinfo else value.isoformat() if value else None


def serialize(obj, users: dict[str, str] | None = None):
    users = users or {}
    name = lambda uid: users.get(uid) if uid else None
    if isinstance(obj, Case):
        return {"id": obj.id, "case_number": obj.case_number, "title": obj.title, "police_station": obj.police_station, "area": obj.area, "year": obj.year, "status": obj.status.value, "registration_date": iso(obj.registration_date), "incident_date": iso(obj.incident_date), "incident_location": obj.incident_location, "investigating_officer_id": obj.investigating_officer_id, "investigating_officer_name": name(obj.investigating_officer_id), "assigned_judge_id": obj.assigned_judge_id, "assigned_judge_name": name(obj.assigned_judge_id)}
    if isinstance(obj, CaseAssignment):
        return {"id": obj.id, "case_id": obj.case_id, "user_id": obj.user_id, "user_name": name(obj.user_id), "assignment_role": obj.assignment_role.value, "active": obj.active, "assigned_at": iso(obj.assigned_at)}
    if isinstance(obj, FirRecord):
        return {"id": obj.id, "case_id": obj.case_id, "fir_number": obj.fir_number, "complainant": obj.complainant, "accused": obj.accused, "legal_sections": obj.legal_sections, "registered_at": iso(obj.registered_at), "document_id": obj.document_id}
    if isinstance(obj, Document):
        return {"id": obj.id, "case_id": obj.case_id, "document_type": obj.document_type.value, "display_name": obj.display_name, "access_scope": obj.access_scope.value, "signature_status": obj.signature_status.value, "current_version_id": obj.current_version_id, "is_final": obj.is_final, "created_by_id": obj.created_by_id, "created_by_name": name(obj.created_by_id), "created_at": iso(obj.created_at)}
    if isinstance(obj, DocumentVersion):
        return {"id": obj.id, "document_id": obj.document_id, "version_number": obj.version_number, "original_filename": obj.original_filename, "content_type": obj.content_type, "size_bytes": obj.size_bytes, "sha256": obj.sha256, "uploaded_by_id": obj.uploaded_by_id, "uploaded_by_name": name(obj.uploaded_by_id), "uploaded_at": iso(obj.uploaded_at), "ocr_status": obj.ocr_status.value}
    if isinstance(obj, Evidence):
        return {"id": obj.id, "case_id": obj.case_id, "evidence_number": obj.evidence_number, "evidence_type": obj.evidence_type, "description": obj.description, "collected_at": iso(obj.collected_at), "collected_by_id": obj.collected_by_id, "collected_by_name": name(obj.collected_by_id), "current_custodian_id": obj.current_custodian_id, "current_custodian_name": name(obj.current_custodian_id), "integrity_sha256": obj.integrity_sha256, "integrity_status": obj.integrity_status.value, "version_lock": obj.version_lock}
    if isinstance(obj, ChainOfCustodyEvent):
        return {"id": obj.id, "evidence_id": obj.evidence_id, "event_type": obj.event_type.value, "previous_custodian_id": obj.previous_custodian_id, "previous_custodian_name": name(obj.previous_custodian_id), "new_custodian_id": obj.new_custodian_id, "new_custodian_name": name(obj.new_custodian_id), "actor_id": obj.actor_id, "actor_name": name(obj.actor_id), "occurred_at": iso(obj.occurred_at), "location": obj.location, "reason": obj.reason, "notes": obj.notes, "evidence_version": obj.evidence_version}
    return obj


def ensure_case_role(db: Session, case_id: str, user: User, roles: set[RoleCode]) -> Case:
    case = db.get(Case, case_id)
    if not case or not is_active_assignee(db, case_id, user) or not (user_role_codes(user) & roles):
        raise api_error(404, "CASE_NOT_FOUND", "Case not found")
    return case


@router.get("/dashboard")
def dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    statement = select(Case).join(CaseAssignment).where(CaseAssignment.user_id == user.id, CaseAssignment.active.is_(True))
    cases = db.scalars(statement).all()
    users = names_for(db, *[c.investigating_officer_id for c in cases], *[c.assigned_judge_id for c in cases])
    return {"metrics": {"authorized_cases": len(cases)}, "cases": [serialize(c, users) for c in cases]}


@router.get("/cases")
def list_cases(q: str | None = None, status: str | None = None, offset: int = 0, limit: int = 20, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    statement = select(Case).join(CaseAssignment).where(CaseAssignment.user_id == user.id, CaseAssignment.active.is_(True))
    if q:
        statement = statement.where(Case.case_number.ilike(f"%{q}%") | Case.title.ilike(f"%{q}%"))
    if status:
        statement = statement.where(Case.status == status)
    return page(db, statement, offset, limit, user_ids=lambda c: [c.investigating_officer_id, c.assigned_judge_id])


@router.post("/cases", status_code=201)
def create_case(payload: CaseCreate, user: User = Depends(require_roles(RoleCode.POLICE)), db: Session = Depends(get_db)):
    case = Case(**payload.model_dump())
    db.add(case)
    db.flush()
    for user_id, role in ((payload.investigating_officer_id, AssignmentRole.INVESTIGATING_OFFICER), (payload.assigned_judge_id, AssignmentRole.JUDGE)):
        db.add(CaseAssignment(case_id=case.id, user_id=user_id, assignment_role=role, assigned_by_id=user.id))
    append_audit(db, actor_id=user.id, action="CASE_CREATED", resource_type="case", resource_id=case.id, resource_label=case.case_number, result=AuditResult.SUCCESS)
    db.commit()
    return serialize(case, names_for(db, case.investigating_officer_id, case.assigned_judge_id))


@router.get("/cases/{case_id}")
def get_case(case: Case = Depends(require_case_view), db: Session = Depends(get_db)):
    return serialize(case, names_for(db, case.investigating_officer_id, case.assigned_judge_id))


@router.patch("/cases/{case_id}")
def patch_case(payload: CasePatch, case: Case = Depends(require_case_assignee), user: User = Depends(require_roles(RoleCode.POLICE)), db: Session = Depends(get_db)):
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "status": value = CaseStatus(value)
        setattr(case, field, value)
    append_audit(db, actor_id=user.id, action="CASE_UPDATED", resource_type="case", resource_id=case.id, resource_label=case.case_number, result=AuditResult.SUCCESS, details=payload.model_dump(exclude_unset=True))
    db.commit()
    return serialize(case, names_for(db, case.investigating_officer_id, case.assigned_judge_id))


@router.get("/cases/{case_id}/assignments")
def list_assignments(case: Case = Depends(require_case_assignee), offset: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return page(db, select(CaseAssignment).where(CaseAssignment.case_id == case.id), offset, limit, user_ids=lambda a: [a.user_id])


@router.post("/cases/{case_id}/assignments", status_code=201)
def add_assignment(payload: AssignmentCreate, case: Case = Depends(require_case_assignee), user: User = Depends(require_roles(RoleCode.POLICE, RoleCode.JUDGE)), db: Session = Depends(get_db)):
    assignment = CaseAssignment(case_id=case.id, user_id=payload.user_id, assignment_role=AssignmentRole(payload.assignment_role), assigned_by_id=user.id)
    db.add(assignment)
    append_audit(db, actor_id=user.id, action="CASE_ASSIGNMENT_CREATED", resource_type="case", resource_id=case.id, resource_label=case.case_number, result=AuditResult.SUCCESS, details={"user_id": payload.user_id})
    db.commit()
    return serialize(assignment, names_for(db, assignment.user_id))


@router.get("/cases/{case_id}/fir")
def get_fir(case: Case = Depends(require_case_view), db: Session = Depends(get_db)):
    fir = db.scalar(select(FirRecord).where(FirRecord.case_id == case.id))
    if not fir:
        raise api_error(404, "FIR_NOT_FOUND", "FIR not found")
    return serialize(fir)


@router.post("/cases/{case_id}/fir", status_code=201)
def create_fir(payload: FirCreate, case: Case = Depends(require_case_assignee), user: User = Depends(require_roles(RoleCode.POLICE)), db: Session = Depends(get_db)):
    if db.scalar(select(FirRecord).where(FirRecord.case_id == case.id)):
        raise api_error(409, "FIR_EXISTS", "A FIR already exists for this case")
    fir = FirRecord(case_id=case.id, **payload.model_dump())
    db.add(fir)
    append_audit(db, actor_id=user.id, action="FIR_CREATED", resource_type="fir_record", resource_id=fir.id, resource_label=payload.fir_number, result=AuditResult.SUCCESS)
    db.commit()
    return serialize(fir)


@router.patch("/cases/{case_id}/fir")
def patch_fir(payload: FirPatch, case: Case = Depends(require_case_assignee), user: User = Depends(require_roles(RoleCode.POLICE)), db: Session = Depends(get_db)):
    if case.status in {CaseStatus.COURT_PROCEEDING, CaseStatus.CLOSED}:
        raise api_error(409, "FIR_LOCKED", "FIR cannot be changed after court proceedings begin")
    fir = db.scalar(select(FirRecord).where(FirRecord.case_id == case.id))
    if not fir:
        raise api_error(404, "FIR_NOT_FOUND", "FIR not found")
    for field, value in payload.model_dump(exclude_unset=True).items(): setattr(fir, field, value)
    append_audit(db, actor_id=user.id, action="FIR_UPDATED", resource_type="fir_record", resource_id=fir.id, resource_label=fir.fir_number, result=AuditResult.SUCCESS)
    db.commit()
    return serialize(fir)


async def read_upload(file: UploadFile) -> bytes:
    if file.content_type not in ALLOWED_TYPES:
        raise api_error(415, "UNSUPPORTED_MEDIA_TYPE", "Only PDF, PNG, JPG, JPEG, and TIFF uploads are allowed")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise api_error(415, "FILE_TOO_LARGE", "Uploads may not exceed 25MB")
    if not data:
        raise api_error(415, "EMPTY_FILE", "Uploaded file is empty")
    return data


def document_case_or_404(db: Session, document_id: str, user: User) -> Document:
    document = db.get(Document, document_id)
    if not document or not can_view_case(db, document.case_id, user):
        raise api_error(404, "DOCUMENT_NOT_FOUND", "Document not found")
    return document


@router.get("/cases/{case_id}/documents")
def list_documents(case: Case = Depends(require_case_view), document_type: str | None = None, offset: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    statement = select(Document).where(Document.case_id == case.id)
    if document_type:
        statement = statement.where(Document.document_type == document_type)
    return page(db, statement, offset, limit, user_ids=lambda d: [d.created_by_id])


@router.post("/cases/{case_id}/documents", status_code=201)
async def upload_document(file: UploadFile = File(...), document_type: str = Form(...), access_scope: str = Form(...), display_name: str | None = Form(None), case: Case = Depends(require_case_assignee), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roles = user_role_codes(user)
    if RoleCode.POLICE not in roles:
        raise api_error(403, "FORBIDDEN", "Your role cannot upload this document")
    data = await read_upload(file)
    try:
        doc_type = DocumentType(document_type)
        scope = AccessScope(access_scope)
    except ValueError:
        raise api_error(422, "INVALID_DOCUMENT_METADATA", "Invalid document type or access scope")
    object_key, content_hash = storage.put(data, file.content_type)
    # Circular FK resolution: create document with NULL pointer, then version, then point at it.
    document = Document(case_id=case.id, document_type=doc_type, display_name=display_name or file.filename or "document", access_scope=scope, created_by_id=user.id, current_version_id=None)
    db.add(document)
    db.flush()
    version = DocumentVersion(document_id=document.id, version_number=1, object_key=object_key, original_filename=file.filename or document.display_name, content_type=file.content_type, size_bytes=len(data), sha256=content_hash, uploaded_by_id=user.id)
    db.add(version)
    db.flush()
    document.current_version_id = version.id
    append_audit(db, actor_id=user.id, action="DOCUMENT_UPLOADED", resource_type="document", resource_id=document.id, resource_label=document.display_name, result=AuditResult.SUCCESS, details={"sha256": content_hash, "version": 1})
    db.commit()
    users = names_for(db, document.created_by_id, version.uploaded_by_id)
    return {**serialize(document, users), "current_version": serialize(version, users)}


@router.get("/documents/{document_id}")
def get_document(document_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = document_case_or_404(db, document_id, user)
    return serialize(document, names_for(db, document.created_by_id))


@router.get("/documents/{document_id}/versions")
def list_versions(document_id: str, offset: int = 0, limit: int = 20, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = document_case_or_404(db, document_id, user)
    return page(db, select(DocumentVersion).where(DocumentVersion.document_id == document.id).order_by(DocumentVersion.version_number.desc()), offset, limit, user_ids=lambda v: [v.uploaded_by_id])


@router.post("/documents/{document_id}/versions", status_code=201)
async def upload_version(document_id: str, file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = document_case_or_404(db, document_id, user)
    if RoleCode.POLICE not in user_role_codes(user) or not is_active_assignee(db, document.case_id, user):
        raise api_error(403, "FORBIDDEN", "Your role cannot create a document version")
    data = await read_upload(file)
    object_key, content_hash = storage.put(data, file.content_type)
    previous = db.get(DocumentVersion, document.current_version_id)
    next_number = (previous.version_number if previous else 0) + 1
    version = DocumentVersion(document_id=document.id, version_number=next_number, object_key=object_key, original_filename=file.filename or document.display_name, content_type=file.content_type, size_bytes=len(data), sha256=content_hash, uploaded_by_id=user.id, supersedes_version_id=previous.id if previous else None)
    db.add(version)
    db.flush()
    document.current_version_id = version.id
    append_audit(db, actor_id=user.id, action="DOCUMENT_VERSION_CREATED", resource_type="document", resource_id=document.id, resource_label=document.display_name, result=AuditResult.SUCCESS, details={"sha256": content_hash, "version": next_number})
    db.commit()
    return serialize(version, names_for(db, version.uploaded_by_id))


@router.get("/documents/{document_id}/download")
def download_document(document_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = document_case_or_404(db, document_id, user)
    version = db.get(DocumentVersion, document.current_version_id)
    if not version:
        raise api_error(404, "DOCUMENT_VERSION_NOT_FOUND", "Document version not found")
    return Response(content=storage.get(version.object_key), media_type=version.content_type, headers={"Content-Disposition": f'attachment; filename="{version.original_filename}"'})


@router.post("/documents/{document_id}/verify-integrity")
def verify_document(document_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = document_case_or_404(db, document_id, user)
    version = db.get(DocumentVersion, document.current_version_id)
    if not version: raise api_error(404, "DOCUMENT_VERSION_NOT_FOUND", "Document version not found")
    actual = hashlib.sha256(storage.get(version.object_key)).hexdigest()
    result = "VERIFIED" if actual == version.sha256 else "MISMATCH"
    append_audit(db, actor_id=user.id, action="DOCUMENT_INTEGRITY_VERIFIED", resource_type="document", resource_id=document.id, resource_label=document.display_name, result=AuditResult.SUCCESS if result == "VERIFIED" else AuditResult.FAILURE, details={"expected_sha256": version.sha256, "actual_sha256": actual, "status": result})
    db.commit()
    return {"document_id": document.id, "version_id": version.id, "expected_sha256": version.sha256, "actual_sha256": actual, "status": result, "checked_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}


@router.get("/cases/{case_id}/evidence")
def list_evidence(case: Case = Depends(require_case_assignee), offset: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return page(db, select(Evidence).where(Evidence.case_id == case.id), offset, limit, user_ids=lambda e: [e.collected_by_id, e.current_custodian_id])


@router.post("/cases/{case_id}/evidence", status_code=201)
def create_evidence(payload: EvidenceCreate, case: Case = Depends(require_case_assignee), user: User = Depends(require_roles(RoleCode.POLICE)), db: Session = Depends(get_db)):
    integrity = IntegrityStatus.PENDING if payload.integrity_sha256 else IntegrityStatus.NOT_APPLICABLE
    evidence = Evidence(case_id=case.id, evidence_number=payload.evidence_number, evidence_type=payload.evidence_type, description=payload.description, collected_at=payload.collected_at, collected_by_id=payload.collected_by_id, current_custodian_id=payload.initial_custodian_id, integrity_sha256=payload.integrity_sha256, integrity_status=integrity)
    db.add(evidence)
    db.flush()
    db.add(ChainOfCustodyEvent(evidence_id=evidence.id, event_type=CustodyEventType.REGISTERED, new_custodian_id=evidence.current_custodian_id, actor_id=user.id, notes="Evidence registered", evidence_version=evidence.version_lock))
    append_audit(db, actor_id=user.id, action="EVIDENCE_CREATED", resource_type="evidence", resource_id=evidence.id, resource_label=evidence.evidence_number, result=AuditResult.SUCCESS)
    db.commit()
    return serialize(evidence, names_for(db, evidence.collected_by_id, evidence.current_custodian_id))


def evidence_or_404(db: Session, evidence_id: str, user: User) -> Evidence:
    evidence = db.get(Evidence, evidence_id)
    if not evidence or not can_view_case(db, evidence.case_id, user):
        raise api_error(404, "EVIDENCE_NOT_FOUND", "Evidence not found")
    return evidence


@router.get("/evidence/{evidence_id}")
def get_evidence(evidence_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    evidence = evidence_or_404(db, evidence_id, user)
    return serialize(evidence, names_for(db, evidence.collected_by_id, evidence.current_custodian_id))


@router.post("/evidence/{evidence_id}/verify-integrity")
def verify_evidence(evidence_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    evidence = evidence_or_404(db, evidence_id, user)
    if evidence.integrity_status == IntegrityStatus.NOT_APPLICABLE:
        return {"evidence_id": evidence.id, "status": IntegrityStatus.NOT_APPLICABLE.value, "checked_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}
    # File attachment for evidence is deliberately deferred; do not claim verification without bytes.
    raise api_error(409, "EVIDENCE_OBJECT_UNAVAILABLE", "Evidence has no stored object available for verification")


@router.get("/evidence/{evidence_id}/chain-of-custody")
def custody_chain(evidence_id: str, offset: int = 0, limit: int = 20, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    evidence = evidence_or_404(db, evidence_id, user)
    return page(db, select(ChainOfCustodyEvent).where(ChainOfCustodyEvent.evidence_id == evidence.id).order_by(ChainOfCustodyEvent.occurred_at), offset, limit, user_ids=lambda ev: [ev.previous_custodian_id, ev.new_custodian_id, ev.actor_id])


@router.post("/evidence/{evidence_id}/transfer", status_code=201)
def transfer_evidence(payload: EvidenceTransfer, evidence_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    evidence = evidence_or_404(db, evidence_id, user)
    if evidence.current_custodian_id != user.id:
        raise api_error(403, "FORBIDDEN", "Only the current custodian may transfer evidence")
    if evidence.version_lock != payload.expected_version:
        raise api_error(409, "EVIDENCE_VERSION_CONFLICT", "Evidence has changed; refresh before transferring", {"current_version": evidence.version_lock})
    old_custodian = evidence.current_custodian_id
    evidence.current_custodian_id = payload.new_custodian_id
    evidence.version_lock += 1
    event = ChainOfCustodyEvent(evidence_id=evidence.id, event_type=CustodyEventType.TRANSFERRED, previous_custodian_id=old_custodian, new_custodian_id=payload.new_custodian_id, actor_id=user.id, location=payload.location, reason=payload.reason, evidence_version=evidence.version_lock)
    db.add(event)
    append_audit(db, actor_id=user.id, action="EVIDENCE_TRANSFERRED", resource_type="evidence", resource_id=evidence.id, resource_label=evidence.evidence_number, result=AuditResult.SUCCESS, details={"previous_custodian_id": old_custodian, "new_custodian_id": payload.new_custodian_id, "version": evidence.version_lock})
    db.commit()
    return serialize(event, names_for(db, event.previous_custodian_id, event.new_custodian_id, event.actor_id))
