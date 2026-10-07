"""Database tables. One class per table.

Design notes
- Login username = register number (students) or staff ID (staff). Always stored UPPERCASE.
- Sensitive columns from the college's Excel sheet (Aadhaar, religion, community, blood group,
  parents' details) are deliberately NOT modelled: the kiosk never needs them.
- Money uses Numeric(12, 2). Times are naive UTC; dates are plain dates (India).
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean, Date, LargeBinary, DateTime, Enum as SAEnum, ForeignKey, Index, Integer, Numeric, String, Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, deferred, mapped_column, relationship, synonym

from .database import Base
from .enums import (
    AttendanceStatus, AudienceType, Decision, LeaveStatus, LeaveType, NoticeCategory, Role, Stage,
)


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def enum_col(enum_cls, length: int):
    """Store the enum VALUE as a plain string (portable between SQLite and PostgreSQL)."""
    return SAEnum(enum_cls, native_enum=False, length=length, validate_strings=True,
                  values_callable=lambda e: [m.value for m in e])


class Department(Base):
    __tablename__ = "departments"
    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)  # e.g. "AI&DS"
    name: Mapped[str] = mapped_column(String(150))


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(100))
    role: Mapped[Role] = mapped_column(enum_col(Role, 20))
    full_name: Mapped[str] = mapped_column(String(120))
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=True)
    failed_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime)
    token_version: Mapped[int] = mapped_column(Integer, default=0)  # bump = all old tokens die
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    department: Mapped[Department | None] = relationship()


class Student(Base):
    __tablename__ = "students"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    register_no: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    academic_year: Mapped[str] = mapped_column(String(9))          # "2025-2026"
    academic_pattern: Mapped[str | None] = mapped_column(String(10))  # odd / even
    semester: Mapped[int] = mapped_column(Integer)
    programme_code: Mapped[str] = mapped_column(String(30))        # "AIDS-243"
    programme_name: Mapped[str | None] = mapped_column(String(80))  # "B.Tech"
    regulation_id: Mapped[str | None] = mapped_column(String(20))
    admission_year: Mapped[int | None] = mapped_column(Integer)
    batch: Mapped[str] = mapped_column(String(9))                  # "2023-2027"
    section: Mapped[str | None] = mapped_column(String(5))         # None until the HOD assigns
    dob: Mapped[date] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(10))
    mobile: Mapped[str | None] = mapped_column(String(15))
    email: Mapped[str | None] = mapped_column(String(120))
    address: Mapped[str | None] = mapped_column(String(300))
    city: Mapped[str | None] = mapped_column(String(80))
    district: Mapped[str | None] = mapped_column(String(80))
    pincode: Mapped[str | None] = mapped_column(String(6))
    state: Mapped[str | None] = mapped_column(String(60))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    counsellor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    photo_ref: Mapped[str | None] = mapped_column(String(200))

    user: Mapped[User] = relationship(foreign_keys=[user_id])
    department: Mapped[Department] = relationship()
    counsellor: Mapped[User | None] = relationship(foreign_keys=[counsellor_id])

    __table_args__ = (Index("ix_students_dept_section", "department_id", "section"),)

    @property
    def year_of_study(self) -> int:
        return (self.semester + 1) // 2


class Subject(Base):
    __tablename__ = "subjects"
    code: Mapped[str] = mapped_column(String(20), primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    semester: Mapped[int | None] = mapped_column(Integer, nullable=True)
    credits: Mapped[int] = mapped_column(Integer, default=3)


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    on_date: Mapped[date] = mapped_column(Date)
    hour: Mapped[int] = mapped_column(Integer)  # 1..hours_per_day
    subject_code: Mapped[str | None] = mapped_column(ForeignKey("subjects.code"))
    status: Mapped[AttendanceStatus] = mapped_column(enum_col(AttendanceStatus, 4))
    __table_args__ = (UniqueConstraint("student_id", "on_date", "hour"),)


class Mark(Base):
    """Internal assessment marks (the dashboard's Subject Wise Marks Report)."""
    __tablename__ = "marks"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    semester: Mapped[int] = mapped_column(Integer)
    subject_code: Mapped[str] = mapped_column(ForeignKey("subjects.code"))
    cia1: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    asmt1: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    cia2: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    asmt2: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    model: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    __table_args__ = (UniqueConstraint("student_id", "semester", "subject_code"),)


class Timetable(Base):
    """Timetable metadata per department and semester."""
    __tablename__ = "timetables"
    id: Mapped[int] = mapped_column(primary_key=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), index=True)
    semester: Mapped[int] = mapped_column(Integer)
    section: Mapped[str | None] = mapped_column(String(5))
    hall: Mapped[str | None] = mapped_column(String(40))
    effective_from: Mapped[date] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    department: Mapped[Department] = relationship()
    breaks: Mapped[list[TimetableBreak]] = relationship(
        back_populates="timetable", cascade="all, delete-orphan", order_by="TimetableBreak.after_period"
    )
    periods: Mapped[list[TimetablePeriod]] = relationship(
        back_populates="timetable", cascade="all, delete-orphan", order_by="TimetablePeriod.period"
    )
    entries: Mapped[list[TimetableEntry]] = relationship(
        back_populates="timetable", cascade="all, delete-orphan"
    )
    __table_args__ = (UniqueConstraint("department_id", "semester", "effective_from"),)


class TimetableBreak(Base):
    __tablename__ = "timetable_breaks"
    id: Mapped[int] = mapped_column(primary_key=True)
    timetable_id: Mapped[int] = mapped_column(ForeignKey("timetables.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(40))
    start_time: Mapped[str] = mapped_column(String(10))
    end_time: Mapped[str] = mapped_column(String(10))
    after_period: Mapped[int] = mapped_column(Integer)

    timetable: Mapped[Timetable] = relationship(back_populates="breaks")


class TimetablePeriod(Base):
    __tablename__ = "timetable_periods"
    id: Mapped[int] = mapped_column(primary_key=True)
    timetable_id: Mapped[int] = mapped_column(ForeignKey("timetables.id", ondelete="CASCADE"), index=True)
    period: Mapped[int] = mapped_column(Integer)
    start_time: Mapped[str] = mapped_column(String(10))
    end_time: Mapped[str] = mapped_column(String(10))

    timetable: Mapped[Timetable] = relationship(back_populates="periods")
    __table_args__ = (UniqueConstraint("timetable_id", "period"),)


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"
    id: Mapped[int] = mapped_column(primary_key=True)
    timetable_id: Mapped[int | None] = mapped_column(ForeignKey("timetables.id", ondelete="CASCADE"), index=True, nullable=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), index=True)
    semester: Mapped[int] = mapped_column(Integer)
    section: Mapped[str | None] = mapped_column(String(5))  # None = applies to every section
    weekday: Mapped[int] = mapped_column(Integer)  # 0 = Monday
    period: Mapped[int] = mapped_column(Integer)  # 1..7
    start_time: Mapped[str | None] = mapped_column(String(10), nullable=True)
    end_time: Mapped[str | None] = mapped_column(String(10), nullable=True)
    subject_id: Mapped[str | None] = mapped_column(ForeignKey("subjects.code"), nullable=True)
    label: Mapped[str | None] = mapped_column(String(150), nullable=True)
    staff_name: Mapped[str | None] = mapped_column(String(120), nullable=True)

    timetable: Mapped[Timetable | None] = relationship(back_populates="entries")

    day_of_week = synonym("weekday")
    hour = synonym("period")
    subject_code = synonym("subject_id")

    def __init__(self, **kwargs):
        if "day_of_week" in kwargs and "weekday" not in kwargs:
            kwargs["weekday"] = kwargs.pop("day_of_week")
        if "hour" in kwargs and "period" not in kwargs:
            kwargs["period"] = kwargs.pop("hour")
        if "subject_code" in kwargs and "subject_id" not in kwargs:
            kwargs["subject_id"] = kwargs.pop("subject_code")
        super().__init__(**kwargs)


TimetableSlot = TimetableEntry


class FeeItem(Base):
    __tablename__ = "fee_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    academic_year: Mapped[str] = mapped_column(String(9))
    fee_key: Mapped[str] = mapped_column(String(40))  # e.g. "tuition_fee"
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    __table_args__ = (UniqueConstraint("student_id", "academic_year", "fee_key"),)


class Payment(Base):
    """Payment history. Recorded by staff or imported; the kiosk never takes payments."""
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    academic_year: Mapped[str] = mapped_column(String(9))
    fee_key: Mapped[str] = mapped_column(String(40))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    paid_on: Mapped[date] = mapped_column(Date)
    transaction_id: Mapped[str] = mapped_column(String(40), unique=True)
    receipt_no: Mapped[str | None] = mapped_column(String(40))


class Result(Base):
    __tablename__ = "results"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    semester: Mapped[int] = mapped_column(Integer)
    subject_code: Mapped[str] = mapped_column(String(20))
    subject_name: Mapped[str] = mapped_column(String(150))
    grade: Mapped[str] = mapped_column(String(4))
    result: Mapped[str] = mapped_column(String(10))  # PASS / FAIL / ...
    __table_args__ = (UniqueConstraint("student_id", "semester", "subject_code"),)


class ResultRelease(Base):
    """A semester's results are visible to students only after the COE releases them."""
    __tablename__ = "result_releases"
    id: Mapped[int] = mapped_column(primary_key=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    semester: Mapped[int] = mapped_column(Integer)
    released_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    __table_args__ = (UniqueConstraint("department_id", "semester"),)


class StoredFile(Base):
    """An uploaded file (OD letter or notice attachment). Max 2 MB each, checked by content."""
    __tablename__ = "stored_files"
    id: Mapped[int] = mapped_column(primary_key=True)
    content_type: Mapped[str] = mapped_column(String(40))
    size_bytes: Mapped[int] = mapped_column(Integer)
    data: Mapped[bytes] = deferred(mapped_column(LargeBinary))  # only loaded when a file is downloaded
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    counsellor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)  # set at submit
    type: Mapped[LeaveType] = mapped_column(enum_col(LeaveType, 10))  # LEAVE or OD (API name: kind)
    category: Mapped[str] = mapped_column(String(40))  # LeaveCategory or OdCategory value
    from_date: Mapped[date] = mapped_column(Date)
    to_date: Mapped[date] = mapped_column(Date)
    days: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str | None] = mapped_column(String(500))  # required for LEAVE
    address: Mapped[str | None] = mapped_column(String(300))
    event_name: Mapped[str | None] = mapped_column(String(150))  # OD only
    organizer: Mapped[str | None] = mapped_column(String(150))   # OD only
    venue: Mapped[str | None] = mapped_column(String(150))       # OD only
    letter_name: Mapped[str | None] = mapped_column(String(120))  # OD letter (PDF/JPG/PNG, max 2 MB)
    letter_type: Mapped[str | None] = mapped_column(String(40))
    letter_size: Mapped[int | None] = mapped_column(Integer)
    letter_file_id: Mapped[int | None] = mapped_column(ForeignKey("stored_files.id"))
    status: Mapped[LeaveStatus] = mapped_column(enum_col(LeaveStatus, 24), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    student: Mapped[Student] = relationship()
    counsellor: Mapped[User] = relationship(foreign_keys=[counsellor_id])
    actions: Mapped[list[LeaveAction]] = relationship(
        order_by="LeaveAction.id", back_populates="request")


class LeaveAction(Base):
    """One approval or rejection: the 'approval stamp' that replaces a handwritten signature."""
    __tablename__ = "leave_actions"
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("leave_requests.id"), index=True)
    stage: Mapped[Stage] = mapped_column(enum_col(Stage, 12))
    decision: Mapped[Decision] = mapped_column(enum_col(Decision, 10))
    actor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    remark: Mapped[str | None] = mapped_column(String(300))  # required when rejecting
    at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    request: Mapped[LeaveRequest] = relationship(back_populates="actions")
    actor: Mapped[User] = relationship()


class Notice(Base):
    __tablename__ = "notices"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(80))
    body: Mapped[str] = mapped_column(Text)
    category: Mapped[NoticeCategory] = mapped_column(enum_col(NoticeCategory, 12))
    audience_type: Mapped[AudienceType] = mapped_column(enum_col(AudienceType, 20))
    audience_value: Mapped[str | None] = mapped_column(String(60))
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime)
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime)

    author: Mapped[User] = relationship()
    attachments: Mapped[list[NoticeAttachment]] = relationship(
        order_by="NoticeAttachment.id", cascade="all, delete-orphan")


class NoticeRecipient(Base):
    """Recipients are fixed when the notice is sent (a snapshot). read_at records who has read it."""
    __tablename__ = "notice_recipients"
    id: Mapped[int] = mapped_column(primary_key=True)
    notice_id: Mapped[int] = mapped_column(ForeignKey("notices.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime)
    __table_args__ = (UniqueConstraint("notice_id", "user_id"),)


class NoticeAttachment(Base):
    __tablename__ = "notice_attachments"
    id: Mapped[int] = mapped_column(primary_key=True)
    notice_id: Mapped[int] = mapped_column(ForeignKey("notices.id"), index=True)
    filename: Mapped[str] = mapped_column(String(120))
    content_type: Mapped[str] = mapped_column(String(40))
    size_bytes: Mapped[int] = mapped_column(Integer)
    file_id: Mapped[int] = mapped_column(ForeignKey("stored_files.id"))


class AuditLog(Base):
    """Append-only. The code has no update or delete path; in PostgreSQL also revoke
    UPDATE/DELETE on this table from the application's database user (see README)."""
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(primary_key=True)
    at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), index=True)
    actor_role: Mapped[str | None] = mapped_column(String(20))
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), index=True)
    action: Mapped[str] = mapped_column(String(40), index=True)
    target_type: Mapped[str | None] = mapped_column(String(30))
    target_id: Mapped[str | None] = mapped_column(String(60))
    detail: Mapped[str | None] = mapped_column(Text)
