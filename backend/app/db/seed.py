from datetime import date, datetime, timezone
import pyotp
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.models import AssignmentRole, Case, CaseAssignment, CaseStatus, ChainOfCustodyEvent, CustodyEventType, Evidence, FirRecord, IntegrityStatus, Role, RoleCode, User, UserRole
from app.security.tokens import hash_password

DEMO_PASSWORD = "PrismDemo!2026"

# Fixed, published demo-only MFA secrets. NOT randomly generated: the frontend
# prototype computes each demo account's live TOTP code client-side (Web
# Crypto) so the login screen can show a real, currently-valid 6-digit code
# instead of a static placeholder. These are demo credentials, not sensitive
# in this context — a real deployment must never do this (must use per-user,
# securely provisioned secrets that never reach the client).
DEMO_MFA_SECRETS = {
    "police@prism.demo": "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
    "judge@prism.demo": "KRSXG5CTMVRXEZLUKRSXG5CTMVRXEZLU",
    "lawyer@prism.demo": "MFRGGZDFMZTWQ2LKMFRGGZDFMZTWQ2LK",
    "forensic@prism.demo": "NBSWY3DPEB3W64TMNBSWY3DPEB3W64TM",
}

def seed(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)):
        return
    roles = {code: Role(code=code, display_name=code.value.title()) for code in RoleCode}
    db.add_all(roles.values()); db.flush()
    users = {}
    secrets = {}
    records = [(RoleCode.POLICE, "police@prism.demo", "Inspector Arjun Patil", "Central Cyber Crime Police Station"), (RoleCode.JUDGE, "judge@prism.demo", "Hon. Justice A. Sharma", "Mumbai Sessions Court"), (RoleCode.LAWYER, "lawyer@prism.demo", "Adv. Rahul Mehta", "Bar Council of Maharashtra"), (RoleCode.FORENSIC, "forensic@prism.demo", "Dr. Anjali Rao", "State Forensic Science Laboratory")]
    for code, email, name, department in records:
        secret = DEMO_MFA_SECRETS[email]
        user = User(email=email, full_name=name, department=department, password_hash=hash_password(DEMO_PASSWORD), mfa_secret_encrypted=secret)
        db.add(user); db.flush(); db.add(UserRole(user_id=user.id, role_id=roles[code].id)); users[code] = user
        secrets[email] = secret
    cases = [Case(case_number="PRISM-2026-001245", title="Digital Fraud Investigation", police_station="Central Cyber Crime Police Station", area="Mumbai Central", year=2026, status=CaseStatus.UNDER_INVESTIGATION, registration_date=date(2026, 9, 2), incident_date=date(2026, 8, 29), incident_location="Andheri East, Mumbai", investigating_officer_id=users[RoleCode.POLICE].id, assigned_judge_id=users[RoleCode.JUDGE].id), Case(case_number="PRISM-2026-001180", title="Cyber Stalking Complaint", police_station="Bandra Cyber Cell", area="Bandra", year=2026, status=CaseStatus.COURT_PROCEEDING, registration_date=date(2026, 7, 14), incident_date=date(2026, 7, 1), incident_location="Bandra West, Mumbai", investigating_officer_id=users[RoleCode.POLICE].id, assigned_judge_id=users[RoleCode.JUDGE].id), Case(case_number="PRISM-2026-001299", title="Financial Data Breach", police_station="Central Cyber Crime Police Station", area="Mumbai Central", year=2026, status=CaseStatus.FORENSIC_PENDING, registration_date=date(2026, 9, 10), incident_date=date(2026, 9, 5), incident_location="Nariman Point, Mumbai", investigating_officer_id=users[RoleCode.POLICE].id, assigned_judge_id=users[RoleCode.JUDGE].id)]
    db.add_all(cases); db.flush()
    for case in cases:
        db.add_all([CaseAssignment(case_id=case.id, user_id=users[RoleCode.POLICE].id, assignment_role=AssignmentRole.INVESTIGATING_OFFICER), CaseAssignment(case_id=case.id, user_id=users[RoleCode.JUDGE].id, assignment_role=AssignmentRole.JUDGE), CaseAssignment(case_id=case.id, user_id=users[RoleCode.FORENSIC].id, assignment_role=AssignmentRole.FORENSIC_EXPERT)])
    db.flush()

    lead_case = cases[0]
    db.add(FirRecord(case_id=lead_case.id, fir_number="FIR/MUM/2026/00871", complainant="Meera Kulkarni", accused="Unidentified (IP traced, under investigation)", legal_sections="BNS 318(4), IT Act Sec. 66C, 66D", registered_at=datetime(2026, 9, 2, 11, 30, tzinfo=timezone.utc)))

    laptop = Evidence(case_id=lead_case.id, evidence_number="Evidence-884", evidence_type="Digital — Laptop", description="Dell Latitude laptop seized from accused residence, 512GB SSD", collected_at=datetime(2026, 9, 3, 10, 0, tzinfo=timezone.utc), collected_by_id=users[RoleCode.POLICE].id, current_custodian_id=users[RoleCode.FORENSIC].id, integrity_status=IntegrityStatus.NOT_APPLICABLE)
    phone = Evidence(case_id=lead_case.id, evidence_number="Evidence-885", evidence_type="Digital — Mobile Phone", description="Samsung Galaxy device, IMEI recorded, screen-locked", collected_at=datetime(2026, 9, 3, 10, 15, tzinfo=timezone.utc), collected_by_id=users[RoleCode.POLICE].id, current_custodian_id=users[RoleCode.POLICE].id, integrity_status=IntegrityStatus.NOT_APPLICABLE)
    db.add_all([laptop, phone]); db.flush()
    db.add_all([
        ChainOfCustodyEvent(evidence_id=laptop.id, event_type=CustodyEventType.REGISTERED, new_custodian_id=users[RoleCode.POLICE].id, actor_id=users[RoleCode.POLICE].id, notes="Seized under panchnama at accused residence; logged into evidence register", evidence_version=1),
        ChainOfCustodyEvent(evidence_id=laptop.id, event_type=CustodyEventType.TRANSFERRED, previous_custodian_id=users[RoleCode.POLICE].id, new_custodian_id=users[RoleCode.FORENSIC].id, actor_id=users[RoleCode.POLICE].id, location="State Forensic Science Laboratory", reason="Digital forensic imaging and data recovery", evidence_version=2),
        ChainOfCustodyEvent(evidence_id=phone.id, event_type=CustodyEventType.REGISTERED, new_custodian_id=users[RoleCode.POLICE].id, actor_id=users[RoleCode.POLICE].id, notes="Seized under panchnama at accused residence; logged into evidence register", evidence_version=1),
    ])
    laptop.version_lock = 2
    db.commit()
    print(f"PRISM seed password for every account: {DEMO_PASSWORD}")
    for email, secret in secrets.items():
        print(f"PRISM demo MFA secret for {email}: {secret}")

if __name__ == "__main__":
    from app.db.session import SessionLocal
    session = SessionLocal()
    try:
        seed(session)
        print("PRISM seed data is ready.")
    finally:
        session.close()
