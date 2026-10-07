export type RequestKind = "LEAVE" | "OD";

export type LeaveCategory = "Medical" | "Personal" | "Family Function" | "Other";

export type OdCategory =
  | "Sports"
  | "Hackathon"
  | "Paper Presentation"
  | "Workshop/Training"
  | "Technical Symposium"
  | "Cultural"
  | "NCC/NSS"
  | "Other";

export type Status =
  | "PENDING_COUNSELLOR"
  | "REJECTED_BY_COUNSELLOR"
  | "PENDING_HOD"
  | "APPROVED"
  | "REJECTED_BY_HOD";

export interface Decision {
  by: string;
  byId?: string;
  at: string;
  remark?: string;
}

export interface LeaveLetter {
  name: string;
  type: string;
  size: number;
  url?: string;
  dataUrl?: string;
}

interface RequestBase {
  id: string;
  departmentCode: string;
  studentRegNo: string;
  studentName: string;
  section?: string | null;
  kind: RequestKind;
  category: LeaveCategory | OdCategory | string;
  fromDate: string;
  toDate: string;
  days?: number;
  status: Status;
  createdAt: string;
  counsellorId?: string;
  counsellorName?: string;
  counsellorDecision?: Decision | null;
  hodDecision?: Decision | null;
  rejectionReason?: string | null;
  waitingDays?: number | null;
  residentialAddress?: string | null;
}

export interface LeaveRequestRecord extends RequestBase {
  kind: "LEAVE";
  category: LeaveCategory | string;
  reason: string;
  eventName?: never;
  organizer?: never;
  venue?: never;
  letter?: never;
}

export interface OdRequestRecord extends RequestBase {
  kind: "OD";
  category: OdCategory | string;
  eventName: string;
  organizer: string;
  venue: string;
  letter: LeaveLetter;
  reason?: string | null;
}

export type Request = LeaveRequestRecord | OdRequestRecord;

export interface LeaveLetterInput {
  name: string;
  type: "application/pdf" | "image/jpeg" | "image/png";
  size: number;
  dataUrl: string;
}

export type LeaveDecision = "APPROVE" | "REJECT";
export type LeaveRequestType = RequestKind;
export type LeaveRequestStatus = "PENDING_COUNSELLOR" | "PENDING_HOD" | "APPROVED" | "REJECTED";

export interface LeaveHistoryEntry {
  stage: "Submitted" | "Counsellor" | "HOD" | "Final";
  decision: "SUBMITTED" | "APPROVED" | "REJECTED";
  at: string;
  remark?: string;
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
  submittedAt?: string;
}
