"""Create a counsellor, HOD or admin account. The password is typed at a hidden prompt, never put on the
command line (it would stay in your shell history).

    python -m scripts.create_staff --username STAFF-AI-104 --name "Full Name" --role COUNSELLOR --department "AI&DS"
"""
import argparse
import getpass
import sys

from sqlalchemy import select

from app.database import SessionLocal
from app.enums import Role
from app.models import Department, User
from app.security import hash_password
from app.services.passwords import PasswordPolicyError, validate_new_password


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--username", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--role", required=True, choices=["COUNSELLOR", "HOD", "ADMIN"])
    ap.add_argument("--department", required=True, help='department code, e.g. "AI&DS"')
    args = ap.parse_args()
    username = args.username.strip().upper()
    role = Role(args.role)
    pw = getpass.getpass("Initial password: ")
    if pw != getpass.getpass("Repeat password: "):
        print("Passwords do not match.")
        return 1
    try:
        validate_new_password(role, pw, username=username)
    except PasswordPolicyError as e:
        print(f"Password rejected: {e}")
        return 1
    with SessionLocal() as db:
        dept = db.scalar(select(Department).where(Department.code == args.department))
        if dept is None:
            print(f"No department with code {args.department!r}. Import students first or create it.")
            return 1
        if db.scalar(select(User).where(User.username == username)):
            print("That username already exists.")
            return 1
        db.add(User(username=username, full_name=args.name.strip(), role=role, department_id=dept.id,
                    password_hash=hash_password(pw), must_change_password=True))
        db.commit()
    print(f"Created {role.value} {username}. They must change the password at first login.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
