"""Request dependencies: database session, current user, role checks and data-scope checks."""
from datetime import datetime

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .enums import Role
from .models import Student, User
from .security import decode_access_token

bearer = HTTPBearer(auto_error=False)


def _unauthorized(message: str = "Please log in again.") -> HTTPException:
    return HTTPException(401, {"code": "UNAUTHORIZED", "message": message},
                         headers={"WWW-Authenticate": "Bearer"})


def current_user_any(creds: HTTPAuthorizationCredentials | None = Depends(bearer),
                     db: Session = Depends(get_db)) -> User:
    """Valid login token, even if the user still must change the first-login password."""
    if creds is None:
        raise _unauthorized()
    try:
        payload = decode_access_token(creds.credentials)
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise _unauthorized("Your session has expired.")
    user = db.get(User, user_id)
    if user is None or not user.is_active or user.token_version != payload.get("ver"):
        raise _unauthorized("Your session has ended.")
    return user


def current_user(user: User = Depends(current_user_any)) -> User:
    if user.must_change_password:
        raise HTTPException(403, {"code": "PASSWORD_CHANGE_REQUIRED",
                                  "message": "Please change your password to continue."})
    return user


def require_roles(*roles: Role):
    def checker(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(403, {"code": "FORBIDDEN", "message": "You do not have access to this."})
        return user
    return checker


def student_of(db: Session, user: User) -> Student:
    student = db.scalar(select(Student).where(Student.user_id == user.id))
    if student is None:
        raise HTTPException(404, {"code": "NOT_FOUND", "message": "No student record for this account."})
    return student


def not_found(message: str = "Not found.") -> HTTPException:
    return HTTPException(404, {"code": "NOT_FOUND", "message": message})


def can_see_student(user: User, student: Student) -> bool:
    """Data scope: a counsellor sees only assigned students; a HOD only their own department."""
    if user.role == Role.COUNSELLOR:
        return student.counsellor_id == user.id
    if user.role == Role.HOD:
        return student.department_id == user.department_id
    return False


def now_utc() -> datetime:
    from .models import utcnow
    return utcnow()
