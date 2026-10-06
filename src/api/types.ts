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

export interface TimetableSlot {
  hour: number;
  period?: number;
  time?: string;
  startTime?: string | null;
  endTime?: string | null;
  subjectCode?: string | null;
  subjectName?: string | null;
  staffName?: string | null;
  room?: string | null;
  isFree?: boolean;
}

export interface TimetableWeekDay {
  dayName: string;
  weekday: number;
  hall?: string | null;
  breaks?: { name: string; startTime: string; endTime: string }[];
  hours: TimetableSlot[];
}

export interface TimetableDay {
  date: string;
  dayName: string;
  hall?: string | null;
  breaks?: { name: string; startTime: string; endTime: string }[];
  hours: TimetableSlot[];
  days?: TimetableWeekDay[];
  className?: string;
  isCustom?: boolean;
}

export interface RegisteredSubject {
  code: string;
  title: string;
  credits: number;
}

export interface RegisteredSubjectsResponse {
  subjects: RegisteredSubject[];
  totalSubjects: number;
  totalCredits: number;
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

export interface AuthUserResponse {
  id: number;
  username: string;
  fullName: string;
  role: "STUDENT" | "COUNSELLOR" | "HOD" | "ADMIN";
  department: string | null;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUserResponse;
}

export interface ChangePasswordResponse {
  changed: boolean;
  accessToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user?: AuthUserResponse;
}

import type { Request } from "@/types/leave";

export interface StaffLeaveHistory {
  id: string;
  request: Request | LeaveRequest;
  decision: "APPROVED" | "REJECTED";
  decidedAt: string;
  remark?: string;
}

export interface StaffStudentRecentRequest {
  id: string;
  kind: string;
  category: string;
  status: string;
  fromDate: string;
  toDate: string;
  rejectionReason?: string | null;
}

export interface StaffStudentSummary {
  registerNo: string;
  name: string;
  batch?: string;
  section?: string;
  semester?: number;
  attendancePercentage: number | null;
  belowMinAttendance: boolean;
  recentRequests: StaffStudentRecentRequest[];
}

export type StaffHistoryFilter = "ALL" | "APPROVED" | "REJECTED";

export interface LeaveDecisionInput {
  id: string;
  decision: LeaveDecision;
  remark?: string;
}

export interface HodOverviewCards {
  pendingApprovals: number;
  totalStudents: number;
  belowMinAttendance: number;
  leaveThisMonth: number;
  noticesSent: number;
}

export interface HodSectionAttendance {
  section: string;
  students: number;
  averagePercent: number | null;
}

export interface HodBelowMinStudent {
  registerNo: string;
  name: string;
  section?: string;
  attendancePercentage: number | null;
}

export interface HodOverviewResponse {
  cards: HodOverviewCards;
  attendanceBySection: HodSectionAttendance[];
  belowMinStudents: HodBelowMinStudent[];
  pendingApprovals: Request[];
}

export interface HodCounsellor {
  id: string;
  staffId: string;
  name: string;
  department: string;
  departmentCode: string;
  studentCount: number;
  pendingCount: number;
}

export interface HodStudent extends AssignedStudent {
  counsellor?: { id: string; name: string } | null;
}

export interface AssignStudentsResponse {
  updated: number;
  skipped: string[];
}

export interface AssignSectionResponse {
  updated: number;
}

export interface UnassignStudentResponse {
  updated: number;
}

export type AuditAction =
  | "REQUEST_SUBMIT"
  | "COUNSELLOR_APPROVE"
  | "COUNSELLOR_REJECT"
  | "HOD_APPROVE"
  | "HOD_REJECT"
  | "COUNSELLOR_REASSIGN"
  | "STUDENT_ASSIGN"
  | "STUDENT_UNASSIGN"
  | "NOTICE_CREATE"
  | "NOTICE_WITHDRAW";

export interface AuditEntry {
  id: string;
  actor: string;
  role: string;
  action: AuditAction | string;
  targetId: string;
  time: string;
  reason?: string;
}

export const noticeCategories = ["Event", "Circular", "Notice", "Exam", "Holiday"] as const;
export type NoticeCategory = (typeof noticeCategories)[number];
export type NoticeRole = "COUNSELLOR" | "HOD";
export type NoticeAudience =
  | "MY_STUDENTS"
  | `SELECTED_STUDENTS:${string}`
  | "ALL_STUDENTS"
  | "SECTION:A"
  | "SECTION:B"
  | "ALL_COUNSELLORS";

export function noticeAudienceSelection(regNos: string[]): NoticeAudience {
  return `SELECTED_STUDENTS:${[...new Set(regNos)].join(",")}`;
}

export interface NoticeAttachmentResponse {
  id: number | string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface NoticeInboxItem {
  id: number | string;
  title: string;
  body: string;
  category: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  expiresAt: string | null;
  audience: string;
  pinned: boolean;
  unread: boolean;
  attachments: NoticeAttachmentResponse[];
}

export interface NoticeSentItem {
  id: number | string;
  title: string;
  body?: string;
  category: string;
  audience: string;
  createdAt: string;
  pinned: boolean;
  withdrawn: boolean;
  expired: boolean;
  recipientCount: number;
  readCount: number;
  attachments: NoticeAttachmentResponse[];
}

export interface CreateNoticeResponse {
  id: number | string;
  recipientCount: number;
}

export interface UnreadNoticeCountResponse {
  unread: number;
}

export interface StudentImportError {
  row: number;
  message: string;
}

export interface StudentImportResponse {
  dryRun: boolean;
  rowsRead: number;
  errors: StudentImportError[];
  warnings: string[];
  ignoredSensitiveColumns: string[];
  created: number;
  updated: number;
  assigned: number;
}

export type { AssignedStudent, LeaveDecision, LeaveRequest };



