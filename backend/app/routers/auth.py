"""Login, logout and password change."""
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit
from ..config import get_settings
from ..database import get_db
from ..deps import current_user_any
from ..enums import Role
from ..models import Student, User, utcnow
from ..security import (
    DUMMY_HASH, create_access_token, hash_password, password_candidates, verify_password,
)
from ..services.passwords import PasswordPolicyError, validate_new_password

router = APIRouter(prefix="/auth", tags=["auth"])

PORTAL_ROLE = {"student": Role.STUDENT, "staff": Role.COUNSELLOR, "hod": Role.HOD}
GENERIC_FAIL = {"code": "INVALID_CREDENTIALS", "message": "Invalid credentials."}


class LoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=40)
    password: str = Field(min_length=1, max_length=128)
    portal: Literal["student", "staff", "hod"] | None = None


class ChangePasswordIn(BaseModel):
    current_password: str = Field(alias="current", min_length=1, max_length=128)
    new_password: str = Field(alias="next", min_length=1, max_length=128)
    model_config = {"populate_by_name": True}


def user_out(user: User, previous_login: datetime | None = None) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "fullName": user.full_name,
        "role": user.role.value,
        "department": user.department.code if user.department else None,
        "mustChangePassword": user.must_change_password,
        "lastLoginAt": previous_login.isoformat() if previous_login else None,
    }


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    s = get_settings()
    now = utcnow()
    username = body.username.strip().upper()
    user = db.scalar(select(User).where(User.username == username))

    if user is None or not user.is_active:
        verify_password(body.password, DUMMY_HASH)  # same timing as a real check
        raise HTTPException(401, GENERIC_FAIL)

    if user.locked_until and user.locked_until > now:
        minutes = int((user.locked_until - now).total_seconds() // 60) + 1
        raise HTTPException(429, {"code": "ACCOUNT_LOCKED",
                                  "message": f"Too many wrong attempts. Try again in {minutes} minutes."})

    ok = any(verify_password(c, user.password_hash) for c in password_candidates(body.password, user.role))
    if not ok:
        user.failed_attempts += 1
        if user.failed_attempts >= s.max_failed_logins:
            from datetime import timedelta
            user.locked_until = now + timedelta(minutes=s.lockout_minutes)
            user.failed_attempts = 0
            audit.log(db, user, audit.ACCOUNT_LOCKED, target_type="user", target_id=user.id)
        db.commit()
        raise HTTPException(401, GENERIC_FAIL)

    # Password is right. Only now reveal a portal mismatch (so IDs cannot be probed).
    if body.portal and PORTAL_ROLE[body.portal] != user.role:
        raise HTTPException(403, {"code": "WRONG_PORTAL",
                                  "message": "This account belongs to a different portal."})

    previous = user.last_login_at
    user.failed_attempts = 0
    user.locked_until = None
    user.last_login_at = now
    db.commit()
    token, expires_in = create_access_token(user.id, user.role, user.token_version)
    return {"accessToken": token, "tokenType": "bearer", "expiresIn": expires_in,
            "user": user_out(user, previous)}


@router.post("/logout", status_code=204)
def logout(user: User = Depends(current_user_any), db: Session = Depends(get_db)):
    """Kills every token of this user, so pressing Back on a shared kiosk cannot reuse a session."""
    user.token_version += 1
    db.commit()


@router.post("/change-password")
def change_password(body: ChangePasswordIn, user: User = Depends(current_user_any),
                    db: Session = Depends(get_db)):
    ok = any(verify_password(c, user.password_hash)
             for c in password_candidates(body.current_password, user.role))
    if not ok:
        raise HTTPException(401, {"code": "INVALID_CREDENTIALS", "message": "Current password is wrong."})
    dob = None
    if user.role == Role.STUDENT:
        student = db.scalar(select(Student).where(Student.user_id == user.id))
        dob = student.dob if student else None
    try:
        validate_new_password(user.role, body.new_password, username=user.username, dob=dob)
    except PasswordPolicyError as e:
        raise HTTPException(422, {"code": "WEAK_PASSWORD", "message": str(e)})
    if any(verify_password(c, user.password_hash)
           for c in password_candidates(body.new_password, user.role)):
        raise HTTPException(422, {"code": "WEAK_PASSWORD", "message": "Choose a different password."})

    user.password_hash = hash_password(body.new_password)
    user.must_change_password = False
    user.token_version += 1  # old tokens die; a fresh one is returned below
    audit.log(db, user, audit.PASSWORD_CHANGED, target_type="user", target_id=user.id)
    db.commit()
    token, expires_in = create_access_token(user.id, user.role, user.token_version)
    return {"changed": True, "accessToken": token, "tokenType": "bearer", "expiresIn": expires_in,
            "user": user_out(user)}


@router.get("/me")
def me(user: User = Depends(current_user_any)):
    return user_out(user)
