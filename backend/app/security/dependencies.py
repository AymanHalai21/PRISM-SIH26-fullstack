from collections.abc import Callable

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import api_error
from app.db.session import get_db
from app.models.models import Case, CaseAssignment, CaseAuthorization, RoleCode, User
from app.security.tokens import decode_access_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise api_error(401, "AUTH_REQUIRED", "Authentication is required")
    try:
        user_id = decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        raise api_error(401, "INVALID_TOKEN", "Access token is invalid or expired")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise api_error(401, "INVALID_TOKEN", "Access token is invalid or expired")
    return user


def user_role_codes(user: User) -> set[RoleCode]:
    return {role.code for role in user.roles}


def require_roles(*roles: RoleCode) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if not (user_role_codes(user) & set(roles)):
            raise api_error(403, "FORBIDDEN", "Your role cannot perform this action")
        return user
    return dependency


def is_active_assignee(db: Session, case_id: str, user: User) -> bool:
    return db.scalar(select(CaseAssignment.id).where(CaseAssignment.case_id == case_id, CaseAssignment.user_id == user.id, CaseAssignment.active.is_(True))) is not None


def can_view_case(db: Session, case_id: str, user: User) -> bool:
    roles = user_role_codes(user)
    if roles & {RoleCode.POLICE, RoleCode.JUDGE, RoleCode.FORENSIC}:
        return is_active_assignee(db, case_id, user)
    if RoleCode.LAWYER in roles:
        return db.scalar(select(CaseAuthorization.id).where(CaseAuthorization.case_id == case_id, CaseAuthorization.lawyer_id == user.id, CaseAuthorization.status == "ACTIVE", CaseAuthorization.revoked_at.is_(None))) is not None
    return False


def require_case_view(case_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Case:
    case = db.get(Case, case_id)
    # Neutral 404 deliberately covers both an absent and an inaccessible case.
    if not case or not can_view_case(db, case_id, user):
        raise api_error(404, "CASE_NOT_FOUND", "Case not found")
    return case


def require_case_assignee(case_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Case:
    case = db.get(Case, case_id)
    if not case or not is_active_assignee(db, case_id, user):
        raise api_error(404, "CASE_NOT_FOUND", "Case not found")
    return case
