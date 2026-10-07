import pytest

from app.enums import Decision, LeaveStatus, Role
from app.services.leave_workflow import InvalidTransition, next_status

P_C, P_H = LeaveStatus.PENDING_COUNSELLOR, LeaveStatus.PENDING_HOD
REASON = "Not enough supporting detail given"


def test_happy_path():
    assert next_status(P_C, Role.COUNSELLOR, Decision.APPROVE) == P_H
    assert next_status(P_H, Role.HOD, Decision.APPROVE) == LeaveStatus.APPROVED


def test_rejections_are_final_and_distinct():
    assert next_status(P_C, Role.COUNSELLOR, Decision.REJECT, REASON) == LeaveStatus.REJECTED_BY_COUNSELLOR
    assert next_status(P_H, Role.HOD, Decision.REJECT, REASON) == LeaveStatus.REJECTED_BY_HOD


@pytest.mark.parametrize("bad", [None, "", "   ", "no", "too short"])  # fewer than 10 characters
def test_reject_needs_a_reason_of_at_least_10_characters(bad):
    with pytest.raises(InvalidTransition) as e:
        next_status(P_C, Role.COUNSELLOR, Decision.REJECT, bad)
    assert e.value.code == "REASON_REQUIRED"
    with pytest.raises(InvalidTransition):
        next_status(P_H, Role.HOD, Decision.REJECT, bad)


def test_wrong_role_for_stage():
    for status, role in ((P_C, Role.HOD), (P_H, Role.COUNSELLOR), (P_C, Role.STUDENT), (P_H, Role.ADMIN)):
        with pytest.raises(InvalidTransition) as e:
            next_status(status, role, Decision.APPROVE)
        assert e.value.code == "WRONG_STAGE"


@pytest.mark.parametrize("final", [LeaveStatus.APPROVED, LeaveStatus.REJECTED_BY_COUNSELLOR, LeaveStatus.REJECTED_BY_HOD])
def test_finished_requests_cannot_change(final):
    for role in (Role.COUNSELLOR, Role.HOD):
        with pytest.raises(InvalidTransition) as e:
            next_status(final, role, Decision.APPROVE)
        assert e.value.code == "ALREADY_DECIDED"
