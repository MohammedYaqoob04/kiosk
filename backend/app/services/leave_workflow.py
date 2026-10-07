"""The Leave/OD approval state machine, as one pure function (no database, easy to test).

PENDING_COUNSELLOR --approve--> PENDING_HOD --approve--> APPROVED
        |                              |
      reject (reason required)       reject (reason required)
        v                              v
REJECTED_BY_COUNSELLOR           REJECTED_BY_HOD      (a counsellor rejection never reaches the HOD)
"""
from ..enums import Decision, LeaveStatus, Role, Stage

STAGE_OF_STATUS = {LeaveStatus.PENDING_COUNSELLOR: Stage.COUNSELLOR, LeaveStatus.PENDING_HOD: Stage.HOD}
ROLE_OF_STAGE = {Stage.COUNSELLOR: Role.COUNSELLOR, Stage.HOD: Role.HOD}
PENDING = tuple(STAGE_OF_STATUS)
REJECTED = (LeaveStatus.REJECTED_BY_COUNSELLOR, LeaveStatus.REJECTED_BY_HOD)
FINISHED = (LeaveStatus.APPROVED, *REJECTED)
ACTIVE = (*PENDING, LeaveStatus.APPROVED)  # a request still "holding" its dates
MIN_REASON_LENGTH = 10  # same rule as the kiosk screens


class InvalidTransition(Exception):
    """Raised when a decision is not allowed (wrong stage, wrong role, missing reason...)."""

    def __init__(self, message: str, code: str = "INVALID_TRANSITION"):
        super().__init__(message)
        self.message = message
        self.code = code


def next_status(current: LeaveStatus, role: Role, decision: Decision, remark: str | None = None) -> LeaveStatus:
    stage = STAGE_OF_STATUS.get(current)
    if stage is None:
        raise InvalidTransition("This request is already finished.", "ALREADY_DECIDED")
    if ROLE_OF_STAGE[stage] != role:
        raise InvalidTransition("This request is waiting for a different approver.", "WRONG_STAGE")
    if decision == Decision.REJECT:
        if not remark or len(remark.strip()) < MIN_REASON_LENGTH:
            raise InvalidTransition(
                f"Rejection reason must be at least {MIN_REASON_LENGTH} characters.", "REASON_REQUIRED")
        return LeaveStatus.REJECTED_BY_COUNSELLOR if stage == Stage.COUNSELLOR else LeaveStatus.REJECTED_BY_HOD
    return LeaveStatus.PENDING_HOD if stage == Stage.COUNSELLOR else LeaveStatus.APPROVED


def action_name(stage: Stage, decision: Decision) -> str:
    return f"{stage.value}_{decision.value}"  # COUNSELLOR_APPROVE, HOD_REJECT ... (same names as the kiosk)
