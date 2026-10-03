export type LeaveRequestType = "LEAVE" | "OD";

export type LeaveRequestStatus = "PENDING_COUNSELLOR" | "PENDING_HOD" | "APPROVED" | "REJECTED";

export type LeaveDecision = "APPROVE" | "REJECT";

export interface LeaveHistoryEntry {
  stage: "Submitted" | "Counsellor" | "HOD" | "Final";
  decision: "SUBMITTED" | "APPROVED" | "REJECTED";
  at: string;
}

export interface LeaveRequest {
  id: string;
  type: LeaveRequestType;
  studentName: string;
  registerNo: string;
  department: string;
  fromDate: string;
  toDate: string;
  reason: string;
  residentialAddress: string;
  status: LeaveRequestStatus;
  history: LeaveHistoryEntry[];
  assignedCounsellorId: string;
}
