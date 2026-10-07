"""Rules for NEW passwords (the first-login date-of-birth password is only temporary)."""
import re
from datetime import date

from ..enums import Role


class PasswordPolicyError(ValueError):
    pass


def _dob_variants(dob: date) -> set[str]:
    return {dob.strftime(f) for f in ("%d%m", "%d%m%Y", "%d%m%y", "%Y%m%d", "%m%d%Y", "%y%m%d")}


def validate_new_password(role: Role, new: str, *, username: str, dob: date | None = None) -> None:
    if role == Role.STUDENT:
        # Same limits as the kiosk's Change Password screen: 6 to 32 characters.
        if not 6 <= len(new) <= 32:
            raise PasswordPolicyError("Use 6 to 32 characters.")
        if len(set(new)) == 1:
            raise PasswordPolicyError("Too easy to guess: do not repeat one character.")
        if new in "01234567890" or new in "98765432109":
            raise PasswordPolicyError("Too easy to guess: do not use a sequence.")
        if dob and any(v in new for v in _dob_variants(dob) if len(v) >= 4):
            raise PasswordPolicyError("Your password must not contain your date of birth.")
        if new in username or username in new:
            raise PasswordPolicyError("Your password must not be your register number.")
        return
    # Staff, HOD, admin
    if not 8 <= len(new) <= 64:
        raise PasswordPolicyError("Use 8 to 64 characters.")
    if not (re.search(r"[A-Za-z]", new) and re.search(r"\d", new)):
        raise PasswordPolicyError("Use at least one letter and one digit.")
    if new.lower() == username.lower():
        raise PasswordPolicyError("Your password must not be your staff ID.")
