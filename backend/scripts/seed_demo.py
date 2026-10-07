"""Fill a LOCAL database with FAKE demo data so the kiosk can be tried end to end.
NEVER run this against a real or production database (it refuses when ENV=production).

    python -m scripts.init_db
    python -m scripts.seed_demo

Accounts created (all must change the password at first login):
    students  : register number 5104232430NN, first password = ddmm of the date of birth (see the sample sheet)
    counsellor: STAFF-DEMO-01 (section A), STAFF-DEMO-02 (section B)
    HOD       : HOD-DEMO-01
    admin     : ADMIN-DEMO-01
"""
import os
import random
import sys
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

from sqlalchemy import select

from app.config import get_settings
from app.database import SessionLocal
from app.enums import AttendanceStatus, Role
from app.models import (
    AttendanceRecord, Department, FeeItem, Mark, Payment, Result, ResultRelease, Student, Subject,
    TimetableSlot, User,
)
from app.security import hash_password
from scripts.import_students import import_students

SAMPLE = Path(__file__).resolve().parent.parent / "sample_data" / "student_dataset_10_rows_FIXED.xlsx"
SUBJECTS = {
    "DEMO101": "Machine Learning (demo)", "DEMO102": "Data Engineering (demo)",
    "DEMO103": "Cloud Computing (demo)", "DEMO104": "Professional Ethics (demo)",
    "DEMO105": "Open Elective (demo)", "DEMO106": "ML Laboratory (demo)",
}
PREV_SUBJECTS = {"DEMO401": "Algorithms (demo)", "DEMO402": "Databases (demo)", "DEMO403": "Statistics (demo)",
                 "DEMO404": "Operating Systems (demo)", "DEMO405": "Networks (demo)"}


def seed() -> int:
    s = get_settings()
    if s.env == "production":
        print("Refusing to seed demo data in production.")
        return 1
    rng = random.Random(42)
    staff_pw = os.environ.get("SEED_STAFF_PASSWORD", "ChangeMe-2026")
    with SessionLocal() as db:
        if db.scalar(select(User.id).limit(1)):
            print("Database already has users; not seeding. Use a fresh database.")
            return 1
        rep = import_students(db, SAMPLE)
        if not rep.ok:
            print(rep.errors)
            return 1
        dept = db.scalar(select(Department))

        def staff(username, name, role):
            u = User(username=username, full_name=name, role=role, department_id=dept.id,
                     password_hash=hash_password(staff_pw), must_change_password=True)
            db.add(u)
            return u
        c1, c2 = staff("STAFF-DEMO-01", "Counsellor 1 (demo)", Role.COUNSELLOR), staff("STAFF-DEMO-02", "Counsellor 2 (demo)", Role.COUNSELLOR)
        staff("HOD-DEMO-01", "HOD (demo)", Role.HOD)
        staff("ADMIN-DEMO-01", "Admin (demo)", Role.ADMIN)
        db.flush()

        students = list(db.scalars(select(Student).order_by(Student.register_no)))
        for i, st in enumerate(students):
            st.section = "A" if i < 5 else "B"
            st.counsellor_id = c1.id if i < 5 else c2.id

        for code, name in {**SUBJECTS, **PREV_SUBJECTS}.items():
            db.add(Subject(code=code, name=name))
        db.flush()

        codes = list(SUBJECTS)
        for section in ("A", "B"):
            for dow in range(5):  # Monday to Friday
                for hour in range(1, s.hours_per_day + 1):
                    db.add(TimetableSlot(department_id=dept.id, section=section, semester=students[0].semester,
                                         day_of_week=dow, hour=hour, subject_code=codes[(dow + hour) % 6],
                                         staff_name="Staff (demo)"))

        # Attendance: last 20 weekdays. Two students (3rd and 8th) fall below 75%.
        today = date.today()
        days, d = [], today
        while len(days) < 20:
            if d.weekday() < 5:
                days.append(d)
            d -= timedelta(days=1)
        for i, st in enumerate(students):
            p_absent = 0.35 if i in (2, 7) else 0.07
            for day in days:
                last_hour = 3 if day == today else s.hours_per_day  # today is only partly marked
                for hour in range(1, last_hour + 1):
                    status = AttendanceStatus.ABSENT if rng.random() < p_absent else AttendanceStatus.PRESENT
                    db.add(AttendanceRecord(student_id=st.id, on_date=day, hour=hour,
                                            subject_code=codes[(day.weekday() + hour) % 6], status=status))
            for code in codes[:5]:
                db.add(Mark(student_id=st.id, semester=st.semester, subject_code=code,
                            cia1=rng.randint(30, 50), asmt1=rng.randint(15, 20),
                            cia2=rng.choice([None, rng.randint(30, 50)]), asmt2=rng.choice([None, rng.randint(15, 20)])))
            for k, fee in enumerate((("tuition_fee", 45000), ("transport_fee", 20000), ("development_fee", 10000))):
                db.add(FeeItem(student_id=st.id, academic_year=st.academic_year, fee_key=fee[0], total=Decimal(fee[1])))
                if k < 2:
                    db.add(Payment(student_id=st.id, academic_year=st.academic_year, fee_key=fee[0],
                                   amount=Decimal(fee[1] // 2), paid_on=today - timedelta(days=30 + k),
                                   transaction_id=f"TXN-DEMO-{st.id:03d}{k}", receipt_no=f"R-DEMO-{st.id:03d}{k}"))
            for code in PREV_SUBJECTS:
                db.add(Result(student_id=st.id, semester=st.semester - 1, subject_code=code,
                              subject_name=PREV_SUBJECTS[code], grade=rng.choice(["O", "A+", "A", "B+"]), result="PASS"))
        db.add(ResultRelease(department_id=dept.id, semester=students[0].semester - 1))
        db.commit()

    print("Demo data created.\n")
    print("Students : 510423243001 .. 510423243010, first password = ddmm of the date of birth (e.g. 14 May -> 1405)")
    print(f"Staff    : STAFF-DEMO-01, STAFF-DEMO-02, HOD-DEMO-01, ADMIN-DEMO-01  password: {staff_pw}")
    print("Everyone must choose a new password at first login.")
    return 0


if __name__ == "__main__":
    sys.exit(seed())
