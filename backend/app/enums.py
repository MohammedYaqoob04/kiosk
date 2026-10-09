from enum import Enum


class Role(str, Enum):
    STUDENT = "STUDENT"
    COUNSELLOR = "COUNSELLOR"  # shown as "Staff" in the kiosk
    HOD = "HOD"
    ADMIN = "ADMIN"


class LeaveType(str, Enum):
    LEAVE = "LEAVE"
    OD = "OD"


class LeaveStatus(str, Enum):
    PENDING_COUNSELLOR = "PENDING_COUNSELLOR"
    REJECTED_BY_COUNSELLOR = "REJECTED_BY_COUNSELLOR"  # final: never reaches the HOD
    PENDING_HOD = "PENDING_HOD"
    APPROVED = "APPROVED"
    REJECTED_BY_HOD = "REJECTED_BY_HOD"


class LeaveCategory(str, Enum):
    MEDICAL = "Medical"
    PERSONAL = "Personal"
    FAMILY = "Family Function"
    OTHER = "Other"


class OdCategory(str, Enum):
    SPORTS = "Sports"
    HACKATHON = "Hackathon"
    PAPER = "Paper Presentation"
    WORKSHOP = "Workshop/Training"
    SYMPOSIUM = "Technical Symposium"
    CULTURAL = "Cultural"
    NCC_NSS = "NCC/NSS"
    OTHER = "Other"


class Stage(str, Enum):
    COUNSELLOR = "COUNSELLOR"
    HOD = "HOD"


class Decision(str, Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"


class AttendanceStatus(str, Enum):
    PRESENT = "P"
    ABSENT = "A"
    OD = "OD"  # on duty: counts as present


class NoticeCategory(str, Enum):
    EVENT = "Event"
    CIRCULAR = "Circular"
    NOTICE = "Notice"
    EXAM = "Exam"
    HOLIDAY = "Holiday"


class AudienceType(str, Enum):
    MY_STUDENTS = "MY_STUDENTS"            # counsellor
    SELECTED_STUDENTS = "SELECTED_STUDENTS"  # counsellor (own) or HOD (department)
    ALL_STUDENTS = "ALL_STUDENTS"          # HOD
    SECTION = "SECTION"                    # HOD
    ALL_COUNSELLORS = "ALL_COUNSELLORS"    # HOD
    BOTH = "BOTH"                          # HOD (both staff and students)

