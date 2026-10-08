import os

# Settings must be in place BEFORE the app is imported.
os.environ.update({
    "ENV": "test", "DATABASE_URL": "sqlite://", "BCRYPT_ROUNDS": "4",
    "SECRET_KEY": "test-secret-key-test-secret-key-0000",
    "INITIAL_PASSWORD_FORMAT": "ddmmyyyy",
    "STAFF_SEE_CONTACT": "false",
})

from datetime import date, timedelta  # noqa: E402
from decimal import Decimal  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.enums import AttendanceStatus, Role  # noqa: E402
from app.main import app  # noqa: E402
from app.models import (  # noqa: E402
    AttendanceRecord, Department, FeeItem, Mark, Payment, Result, ResultRelease, Student, Subject,
    TimetableSlot, User,
)
from app.security import hash_password  # noqa: E402
from tests.helpers import FRESH_DOB_PW, STAFF_PW, STUDENT_PW  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield


@pytest.fixture
def client():
    return TestClient(app)


def _user(db, username, name, role, dept, password, must_change=False):
    u = User(username=username, full_name=name, role=role, department_id=dept.id,
             password_hash=hash_password(password), must_change_password=must_change)
    db.add(u)
    db.flush()
    return u


@pytest.fixture
def world():
    """AI&DS dept: 2 counsellors, HOD, 6 students (3 each) + 1 first-login student. CSE dept: HOD + 1 student."""
    w = {}
    with SessionLocal() as db:
        a = Department(code="AIDS", name="Artificial Intelligence & Data Science")
        b = Department(code="CSE", name="Computer Science")
        db.add_all([a, b])
        db.flush()
        c1 = _user(db, "STAFF-1", "Counsellor One", Role.COUNSELLOR, a, STAFF_PW)
        c2 = _user(db, "STAFF-2", "Counsellor Two", Role.COUNSELLOR, a, STAFF_PW)
        hod = _user(db, "HOD-1", "HOD One", Role.HOD, a, STAFF_PW)
        hod_b = _user(db, "HOD-B", "HOD B", Role.HOD, b, STAFF_PW)
        _user(db, "ADMIN-1", "Admin", Role.ADMIN, a, STAFF_PW)

        def student(n, dept, counsellor, section, pw=STUDENT_PW, must_change=False):
            reg = f"5104232430{n:02d}"
            u = _user(db, reg, f"Student {n:02d}", Role.STUDENT, dept, pw, must_change)
            st = Student(user_id=u.id, register_no=reg, academic_year="2025-2026", semester=5,
                         programme_code="AIDS-243", programme_name="B.Tech", batch="2023-2027",
                         section=section, dob=date(2006, 5, 14), gender="Male", mobile="9000000001",
                         email=f"s{n}@example.com", address=f"{n} Test Street", department_id=dept.id,
                         counsellor_id=counsellor.id if counsellor else None)
            db.add(st)
            db.flush()
            return st
        students = [student(i, a, c1 if i <= 3 else c2, "A" if i <= 3 else "B") for i in range(1, 7)]
        other = student(90, b, None, None)
        fresh = student(50, a, c1, "A", pw=FRESH_DOB_PW, must_change=True)

        db.add_all([Subject(code="S1", name="Subject One"), Subject(code="S2", name="Subject Two")])
        db.flush()
        today = date.today()
        for st, present in ((students[0], 8), (students[1], 5)):  # 80% and 50%
            for h in range(10):
                db.add(AttendanceRecord(student_id=st.id, on_date=today - timedelta(days=1 + h // 7), hour=h % 7 + 1,
                                        subject_code="S1",
                                        status=AttendanceStatus.PRESENT if h < present else AttendanceStatus.ABSENT))
        s1 = students[0]
        db.add(Mark(student_id=s1.id, semester=5, subject_code="S1", cia1=Decimal("45"), asmt1=Decimal("20")))
        db.add(TimetableSlot(department_id=a.id, section="A", semester=5, day_of_week=today.weekday(),
                             hour=1, subject_code="S1", staff_name="Staff X"))
        db.add(FeeItem(student_id=s1.id, academic_year="2025-2026", fee_key="tuition_fee", total=Decimal("25000")))
        db.add(Payment(student_id=s1.id, academic_year="2025-2026", fee_key="tuition_fee", amount=Decimal("12500"),
                       paid_on=today, transaction_id="TXN1", receipt_no="R1"))
        db.add(Result(student_id=s1.id, semester=4, subject_code="X1", subject_name="Old Subject", grade="A", result="PASS"))
        db.commit()
        w.update(c1=c1.username, c2=c2.username, hod=hod.username, hod_b=hod_b.username, admin="ADMIN-1",
                 students=[s.register_no for s in students], other=other.register_no, fresh=fresh.register_no)
    return w
