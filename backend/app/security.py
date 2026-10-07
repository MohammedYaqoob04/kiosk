"""Password hashing and access tokens."""
import re
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from .config import get_settings
from .enums import Role

ALGORITHM = "HS256"
# Date typed with separators: 25-01, 25-01-2002, 25/01/2002, 25.01.2002
DOB_WITH_SEPARATORS = re.compile(r"^\d{2}[-/.]\d{2}([-/.]\d{4})?$")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=get_settings().bcrypt_rounds)).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:  # e.g. password longer than bcrypt's 72-byte limit
        return False


# Compared against when the username does not exist, so response time does not reveal valid IDs.
DUMMY_HASH = hash_password("not-a-real-password")


def initial_password(dob) -> str:
    """The first-login password: ddmm (the college rule) or ddmmyyyy, set by INITIAL_PASSWORD_FORMAT."""
    fmt = "%d%m%Y" if get_settings().initial_password_format.lower() == "ddmmyyyy" else "%d%m"
    return dob.strftime(fmt)


def password_candidates(raw: str, role: Role) -> list[str]:
    """Students may type a date with separators (25-01); it is compared as digits only (2501)."""
    out = [raw]
    if role == Role.STUDENT and DOB_WITH_SEPARATORS.match(raw):
        out.append(re.sub(r"\D", "", raw))
    return out


def create_access_token(user_id: int, role: Role, token_version: int) -> tuple[str, int]:
    s = get_settings()
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=s.access_token_minutes)
    payload = {"sub": str(user_id), "role": role.value, "ver": token_version,
               "iat": int(now.timestamp()), "exp": int(expires.timestamp())}
    return jwt.encode(payload, s.secret_key, algorithm=ALGORITHM), s.access_token_minutes * 60


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, get_settings().secret_key, algorithms=[ALGORITHM])
