import os

os.environ["DATABASE_URL"] = "sqlite:///./test_prism.db"

import pyotp
from fastapi.testclient import TestClient

from app.db.seed import seed
from app.db.session import Base, SessionLocal, engine
from app.main import app
from app.models.models import Case, User


def setup_module():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


def login(client, email):
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).one()
        challenge = client.post("/auth/login", json={"email": email, "password": "PrismDemo!2026"})
        assert challenge.status_code == 202
        verified = client.post("/auth/mfa/verify", json={"challenge_id": challenge.json()["challenge_id"], "code": pyotp.TOTP(user.mfa_secret_encrypted).now()})
        assert verified.status_code == 200
        return {"Authorization": f"Bearer {verified.json()['access_token']}"}
    finally:
        db.close()


def test_auth_and_case_visibility():
    client = TestClient(app)
    police_headers = login(client, "police@prism.demo")
    assert client.get("/auth/me", headers=police_headers).status_code == 200
    assert client.get("/cases", headers=police_headers).json()["total"] == 3

    db = SessionLocal()
    try:
        case_id = db.query(Case).first().id
    finally:
        db.close()
    lawyer_headers = login(client, "lawyer@prism.demo")
    denied = client.get(f"/cases/{case_id}", headers=lawyer_headers)
    assert denied.status_code == 404
    assert denied.json()["error"]["code"] == "CASE_NOT_FOUND"


def test_cross_role_create_is_denied_with_common_envelope():
    client = TestClient(app)
    lawyer_headers = login(client, "lawyer@prism.demo")
    db = SessionLocal()
    try:
        police = db.query(User).filter_by(email="police@prism.demo").one()
        judge = db.query(User).filter_by(email="judge@prism.demo").one()
        response = client.post("/cases", headers=lawyer_headers, json={"case_number": "PRISM-TEST-1", "title": "Denied", "police_station": "Test", "registration_date": "2026-09-27", "investigating_officer_id": police.id, "assigned_judge_id": judge.id})
    finally:
        db.close()
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"
