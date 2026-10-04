import { useSyncExternalStore } from "react";

import type {
  LeaveDecision,
  LeaveHistoryEntry,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveRequestType,
} from "@/types/leave";

type Listener = () => void;
const listeners = new Set<Listener>();
const timestamp = "2026-10-03T09:00:00.000Z";

function history(
  submittedAt: string,
  counsellor?: LeaveHistoryEntry["decision"],
  hod?: LeaveHistoryEntry["decision"],
): LeaveHistoryEntry[] {
  const events: LeaveHistoryEntry[] = [
    { stage: "Submitted", decision: "SUBMITTED", at: submittedAt },
  ];
  if (counsellor) {
    events.push({ stage: "Counsellor", decision: counsellor, at: submittedAt });
  }
  if (hod) {
    events.push({ stage: "HOD", decision: hod, at: submittedAt });
  }
  if (counsellor === "REJECTED" || hod === "REJECTED" || hod === "APPROVED") {
    const decision = counsellor === "REJECTED" || hod === "REJECTED" ? "REJECTED" : "APPROVED";
    events.push({ stage: "Final", decision, at: submittedAt });
  }
  return events;
}

const initialRequests: LeaveRequest[] = [
  {
    id: "leave-demo-1",
    type: "LEAVE",
    studentName: "Sample Student",
    registerNo: "510000000001",
    department: "AIDS / A",
    fromDate: "2026-10-06",
    toDate: "2026-10-07",
    reason: "Medical",
    residentialAddress: "Sample address · Demo",
    status: "PENDING_COUNSELLOR",
    history: history(timestamp),
    assignedCounsellorId: "9999900101",
  },
  {
    id: "leave-demo-2",
    type: "OD",
    studentName: "Sample Student",
    registerNo: "510000000002",
    department: "AIDS / A",
    fromDate: "2026-10-08",
    toDate: "2026-10-08",
    reason: "Academic event",
    residentialAddress: "Sample address · Demo",
    status: "PENDING_HOD",
    history: history(timestamp, "APPROVED"),
    assignedCounsellorId: "9999900101",
  },
  {
    id: "leave-demo-3",
    type: "LEAVE",
    studentName: "Sample Student",
    registerNo: "510000000003",
    department: "AIDS / A",
    fromDate: "2026-09-30",
    toDate: "2026-10-01",
    reason: "Family function",
    residentialAddress: "Sample address · Demo",
    status: "APPROVED",
    history: history(timestamp, "APPROVED", "APPROVED"),
    assignedCounsellorId: "9999900101",
  },
  {
    id: "leave-demo-4",
    type: "OD",
    studentName: "Sample Student",
    registerNo: "510000000004",
    department: "AIDS / A",
    fromDate: "2026-09-25",
    toDate: "2026-09-25",
    reason: "Department activity",
    residentialAddress: "Sample address · Demo",
    status: "REJECTED",
    history: history(timestamp, "REJECTED"),
    assignedCounsellorId: "9999900102",
  },
  {
    id: "leave-demo-5",
    type: "LEAVE",
    studentName: "Sample Student",
    registerNo: "510000000005",
    department: "AIDS / A",
    fromDate: "2026-10-10",
    toDate: "2026-10-11",
    reason: "Other",
    residentialAddress: "Sample address · Demo",
    status: "PENDING_COUNSELLOR",
    history: history(timestamp),
    assignedCounsellorId: "9999900102",
  },
];
let requests: LeaveRequest[] = [...initialRequests];

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function resetLeaveRequests(): void {
  requests = [...initialRequests];
  emitChange();
}

export function nextStatus(
  current: LeaveRequestStatus,
  decision: LeaveDecision,
): LeaveRequestStatus {
  if (current !== "PENDING_COUNSELLOR" && current !== "PENDING_HOD") return current;
  if (decision === "REJECT") return "REJECTED";
  return current === "PENDING_COUNSELLOR" ? "PENDING_HOD" : "APPROVED";
}

/*
 * Example calls:
 * nextStatus("PENDING_COUNSELLOR", "APPROVE") === "PENDING_HOD"
 * nextStatus("PENDING_HOD", "APPROVE") === "APPROVED"
 * nextStatus("PENDING_COUNSELLOR", "REJECT") === "REJECTED"
 * nextStatus("APPROVED", "REJECT") === "APPROVED"
 */
export function useLeaveRequests(): LeaveRequest[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => requests,
    () => requests,
  );
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
  const request: LeaveRequest = {
    ...input,
    id: `leave-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "PENDING_COUNSELLOR",
    history: [{ stage: "Submitted", decision: "SUBMITTED", at: new Date().toISOString() }],
  };
  requests = [request, ...requests];
  emitChange();
  return request;
}

export function decideLeaveRequest(id: string, decision: LeaveDecision): LeaveRequest | undefined {
  const index = requests.findIndex((request) => request.id === id);
  if (index < 0) return undefined;
  const request = requests[index];
  if (!request || (request.status !== "PENDING_COUNSELLOR" && request.status !== "PENDING_HOD")) {
    return undefined;
  }
  const stage = request.status === "PENDING_COUNSELLOR" ? "Counsellor" : "HOD";
  const action = decision === "APPROVE" ? "APPROVED" : "REJECTED";
  const status = nextStatus(request.status, decision);
  const updated: LeaveRequest = {
    ...request,
    status,
    history: [
      ...request.history,
      { stage, decision: action, at: new Date().toISOString() },
      ...(status === "APPROVED" || status === "REJECTED"
        ? [
            {
              stage: "Final" as const,
              decision: status,
              at: new Date().toISOString(),
            },
          ]
        : []),
    ],
  };
  requests = requests.map((item) => (item.id === id ? updated : item));
  emitChange();
  return updated;
}
