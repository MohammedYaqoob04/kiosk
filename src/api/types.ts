import type { LeaveDecision, LeaveRequest } from "@/types/leave";
import type { AssignedStudent } from "@/types/staff-dashboard";

export interface StudentProfile {
  registerNo: string;
  name: string;
  batch: string;
  departmentCode: string;
  programme: string;
  course: string;
  semester: number;
  year: number;
  section: string;
  academicYear: string;
  department: string;
  dateOfBirth: string;
  gender: string;
  mobile: string;
  email: string;
  photoUrl?: string;
  lastLoginAt?: string;
}

export interface HourSlot {
  hour: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  subjectCode?: string;
  subjectName?: string;
  status?: "PRESENT" | "ABSENT" | "OD" | null;
}

export interface SubjectMarks {
  code: string;
  name: string;
  cia1: number | null;
  asmt1: number | null;
  cia2: number | null;
  asmt2: number | null;
  model: number | null;
}

export interface Dashboard {
  attendance: {
    overallPercent: number;
    eligible: boolean;
    thresholdPercent: number;
  };
  today: {
    date: string;
    hours: HourSlot[];
  };
  marks: SubjectMarks[];
}

export interface TimetableDay {
  date: string;
  dayName: string;
  hours: {
    hour: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    subjectCode: string;
    subjectName: string;
    staffName?: string;
  }[];
}

export interface FeeSummary {
  academicYear: string;
  items: {
    feeType: string;
    total: number;
    paid: number;
    balance: number;
  }[];
  payments: {
    transactionId: string;
    feeType: string;
    amount: number;
    date: string;
    receiptNo: string;
  }[];
}

export interface ResultsResponse {
  published: boolean;
  semesters: {
    semester: number;
    gpa?: number;
    subjects: {
      code: string;
      name: string;
      grade: string;
      result: string;
    }[];
  }[];
}

export interface AssignmentOptions {
  subjects: { code: string; name: string }[];
  assignmentNumbers: number[];
}

export interface AssignmentFrontPageResponse {
  created: boolean;
  subjectCode: string;
  assignmentNumber: number;
}

export interface ChangePasswordResponse {
  changed: boolean;
}

export interface StaffLeaveHistory {
  id: string;
  request: LeaveRequest;
  decision: "APPROVED" | "REJECTED";
  decidedAt: string;
  remark?: string;
}

export type StaffHistoryFilter = "ALL" | "APPROVED" | "REJECTED";

export interface LeaveDecisionInput {
  id: string;
  decision: LeaveDecision;
  remark?: string;
}

export type { AssignedStudent, LeaveDecision, LeaveRequest };
