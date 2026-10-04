import { useSyncExternalStore } from "react";

import type {
  LeaveDecision,
  LeaveHistoryEntry,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveRequestType,
  Request,
} from "@/types/leave";
import { department } from "@/config/department";
import { demoAssignedStudents } from "@/mock/staff-dashboard";
import type { AssignedStudent } from "@/types/staff-dashboard";
import {
  counsellorApprove,
  counsellorReject,
  getRequestsSnapshot,
  hodApprove,
  hodReject,
  listForCounsellor,
  resetRequests,
  subscribeToRequests,
  submitRequest,
} from "@/lib/leaveStore";

function toLegacyRequest(request: Request): LeaveRequest {
  const events: LeaveHistoryEntry[] = [
    { stage: "Submitted", decision: "SUBMITTED", at: request.createdAt },
  ];
  if (request.counsellorDecision) {
    const rejected = request.status === "REJECTED_BY_COUNSELLOR";
    events.push({
      stage: "Counsellor",
      decision: rejected ? "REJECTED" : "APPROVED",
      at: request.counsellorDecision.at,
      ...(request.counsellorDecision.remark ? { remark: request.counsellorDecision.remark } : {}),
    });
  }
  if (request.hodDecision) {
    const rejected = request.status === "REJECTED_BY_HOD";
    events.push({
      stage: "HOD",
      decision: rejected ? "REJECTED" : "APPROVED",
      at: request.hodDecision.at,
      ...(request.hodDecision.remark ? { remark: request.hodDecision.remark } : {}),
    });
  }
  if (
    request.status === "APPROVED" ||
    request.status === "REJECTED_BY_COUNSELLOR" ||
    request.status === "REJECTED_BY_HOD"
  ) {
    events.push({
      stage: "Final",
      decision: request.status === "APPROVED" ? "APPROVED" : "REJECTED",
      at: request.hodDecision?.at ?? request.counsellorDecision?.at ?? request.createdAt,
    });
  }
  const status: LeaveRequestStatus =
    request.status === "REJECTED_BY_COUNSELLOR" || request.status === "REJECTED_BY_HOD"
      ? "REJECTED"
      : request.status;
  return {
    id: request.id,
    type: request.kind,
    studentName: request.studentName,
    registerNo: request.studentRegNo,
    department: department.name,
    fromDate: request.fromDate,
    toDate: request.toDate,
    reason:
      request.kind === "LEAVE" ? request.reason : `${request.eventName} · ${request.category}`,
    residentialAddress: "",
    status,
    history: events,
    assignedCounsellorId: "9999900101",
    submittedAt: request.createdAt,
  };
}

export function resetLeaveRequests(): void {
  resetRequests();
}

export function nextStatus(
  current: LeaveRequestStatus,
  decision: LeaveDecision,
): LeaveRequestStatus {
  if (current !== "PENDING_COUNSELLOR" && current !== "PENDING_HOD") return current;
  if (decision === "REJECT") return "REJECTED";
  return current === "PENDING_COUNSELLOR" ? "PENDING_HOD" : "APPROVED";
}

export function useLeaveRequests(): LeaveRequest[] {
  const requests = useSyncExternalStore(
    subscribeToRequests,
    getRequestsSnapshot,
    getRequestsSnapshot,
  );
  return requests.map(toLegacyRequest);
}

export function getLeaveRequestsSnapshot(): LeaveRequest[] {
  return getRequestsSnapshot().map(toLegacyRequest);
}

export function getAssignedStudents(counsellorId: string): AssignedStudent[] {
  return demoAssignedStudents.filter((student) => student.assignedCounsellorId === counsellorId);
}

export function getCounsellorLeaveQueue(counsellorId: string): LeaveRequest[] {
  return listForCounsellor()
    .map(toLegacyRequest)
    .filter((request) => request.assignedCounsellorId === counsellorId);
}

export function createLeaveRequest(input: {
  type: LeaveRequestType;
  studentName: string;
  registerNo: string;
  department: string;
  fromDate: string;
  toDate: string;
  reason: string;
  residentialAddress: string;
  assignedCounsellorId: string;
}): LeaveRequest {
  if (input.type === "OD") {
    throw new Error("OD requests require an event and an uploaded official letter.");
  }
  const category =
    input.reason === "Medical" ||
    input.reason === "Personal" ||
    input.reason === "Family Function" ||
    input.reason === "Other"
      ? input.reason
      : "Other";
  return toLegacyRequest(
    submitRequest({
      kind: "LEAVE",
      category,
      studentRegNo: input.registerNo,
      studentName: input.studentName,
      fromDate: input.fromDate,
      toDate: input.toDate,
      reason: input.reason,
    }),
  );
}

export function decideLeaveRequest(
  id: string,
  decision: LeaveDecision,
  remark?: string,
): LeaveRequest | undefined {
  const request = getRequestsSnapshot().find((item) => item.id === id);
  if (!request) return undefined;
  const by = request.status === "PENDING_COUNSELLOR" ? "Counsellor Demo" : "HOD Demo";
  const updated =
    request.status === "PENDING_COUNSELLOR"
      ? decision === "APPROVE"
        ? counsellorApprove(id, by)
        : counsellorReject(id, by, remark ?? "")
      : request.status === "PENDING_HOD"
        ? decision === "APPROVE"
          ? hodApprove(id, by)
          : hodReject(id, by, remark ?? "")
        : undefined;
  return updated ? toLegacyRequest(updated) : undefined;
}
