from datetime import timedelta

import pyotp
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import api_error
from app.db.session import get_db
from app.models.models import RefreshToken, User
from app.schemas.common import LoginInput, LogoutInput, MfaVerifyInput, RefreshInput
from app.security.dependencies import get_current_user
from app.security.tokens import create_access_token, create_refresh_token, hash_password, sha256, utcnow, verify_password
from app.services.audit import append_audit
from app.models.models import AuditResult

router = APIRouter(prefix="/auth", tags=["auth"])
_challenges: dict[str, str] = {}


def user_payload(user: User) -> dict:
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "department": user.department, "roles": [role.code.value for role in user.roles], "mfa_enabled": True}


def token_response(db: Session, user: User, request: Request) -> dict:
    raw_refresh = create_refresh_token()
    settings = get_settings()
    db.add(RefreshToken(user_id=user.id, token_hash=sha256(raw_refresh), expires_at=utcnow() + timedelta(days=settings.refresh_token_days), ip_address=request.client.host if request.client else None, user_agent=request.headers.get("user-agent")))
    return {"access_token": create_access_token(user.id), "token_type": "bearer", "expires_in": settings.access_token_minutes * 60, "refresh_token": raw_refresh, "user": user_payload(user)}


@router.post("/login", status_code=status.HTTP_202_ACCEPTED)
def login(payload: LoginInput, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise api_error(401, "INVALID_CREDENTIALS", "Invalid email or password")
    challenge = create_refresh_token()
    _challenges[challenge] = user.id
    return {"mfa_required": True, "challenge_id": challenge, "expires_at": (utcnow() + timedelta(minutes=5)).isoformat().replace("+00:00", "Z")}


@router.post("/mfa/verify")
def verify_mfa(payload: MfaVerifyInput, request: Request, db: Session = Depends(get_db)):
    user_id = _challenges.pop(payload.challenge_id, None)
    user = db.get(User, user_id) if user_id else None
    if not user or not pyotp.TOTP(user.mfa_secret_encrypted).verify(payload.code, valid_window=1):
        raise api_error(401, "INVALID_MFA_CODE", "Invalid or expired MFA challenge")
    user.last_login_at = utcnow()
    response = token_response(db, user, request)
    append_audit(db, actor_id=user.id, action="LOGIN_MFA_VERIFIED", resource_type="auth", resource_id=user.id, resource_label=user.email, result=AuditResult.SUCCESS)
    db.commit()
    return response


@router.post("/refresh")
def refresh(payload: RefreshInput, request: Request, db: Session = Depends(get_db)):
    token = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == sha256(payload.refresh_token)))
    if not token or token.revoked_at or token.expires_at <= utcnow():
        raise api_error(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired")
    token.revoked_at = utcnow()
    user = db.get(User, token.user_id)
    response = token_response(db, user, request)
    db.flush()
    replacement = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == sha256(response["refresh_token"])))
    token.replaced_by_id = replacement.id
    db.commit()
    return response


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: LogoutInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == sha256(payload.refresh_token), RefreshToken.user_id == user.id))
    if token and not token.revoked_at:
        token.revoked_at = utcnow()
    append_audit(db, actor_id=user.id, action="LOGOUT", resource_type="auth", resource_id=user.id, resource_label=user.email, result=AuditResult.SUCCESS)
    db.commit()


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_payload(user)
