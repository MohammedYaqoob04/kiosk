import type {
  AssignmentFrontPageResponse,
  AssignmentOptions,
  ChangePasswordResponse,
  Dashboard,
  FeeSummary,
  ResultsResponse,
  StudentProfile,
  TimetableDay,
  StaffHistoryFilter,
  StaffLeaveHistory,
  StaffStudentSummary,
  HodOverviewResponse,
  HodCounsellor,
  HodStudent,
  AssignStudentsResponse,
  AssignSectionResponse,
  UnassignStudentResponse,
  AuditEntry,
  CreateNoticeResponse,
  NoticeInboxItem,
  NoticeSentItem,
  UnreadNoticeCountResponse,
} from "@/api/types";
import type { LeaveDecision, LeaveRequest } from "@/types/leave";
import type { AssignedStudent } from "@/types/staff-dashboard";
import { httpApi } from "@/api/http";
import { mockApi } from "@/api/mock";

const useMock = (import.meta.env["VITE_USE_MOCK"] ?? "true").toLowerCase() !== "false";
const implementation = useMock ? mockApi : httpApi;
export const isMockApi = useMock;

export const api: {
  login: (
    username: string,
    password: string,
    portal?: "student" | "staff" | "hod",
  ) => Promise<import("@/api/types").LoginResponse>;
  logout: () => Promise<void>;
  getProfile: () => Promise<StudentProfile>;
  getDashboard: () => Promise<Dashboard>;
  getTimetable: (date?: string) => Promise<TimetableDay>;
  getFees: () => Promise<FeeSummary>;
  getResults: () => Promise<ResultsResponse>;
  getAssignmentOptions: () => Promise<AssignmentOptions>;
  createAssignmentFrontPage: (
    subjectCode: string,
    no: number,
  ) => Promise<AssignmentFrontPageResponse>;
  getAssignmentFrontPageBlob: (subjectCode: string, no: number) => Promise<Blob>;
  getBlob: (urlOrPath: string, init?: RequestInit) => Promise<Blob>;
  submitLeave: (formData: FormData) => Promise<import("@/types/leave").Request>;
  getMyLeaves: () => Promise<import("@/types/leave").Request[]>;
  getLeaveLetterBlob: (leaveId: string | number) => Promise<Blob>;
  changePassword: (current: string, next: string) => Promise<ChangePasswordResponse>;
  getLeaveQueue: (counsellorId?: string) => Promise<LeaveRequest[] | import("@/types/leave").Request[]>;
  getAssignedStudents: (
    counsellorId?: string,
    q?: string,
    belowMin?: boolean,
  ) => Promise<AssignedStudent[]>;
  getStaffStudentSummary: (registerNo: string) => Promise<StaffStudentSummary | null>;
  getLeaveHistory: (
    counsellorId?: string,
    filter?: StaffHistoryFilter,
  ) => Promise<StaffLeaveHistory[]>;
  decideLeaveRequest: (
    id: string,
    decision: LeaveDecision,
    remark?: string,
  ) => Promise<LeaveRequest | import("@/types/leave").Request>;
  reassignLeaveRequest: (
    id: string,
    counsellorId: string,
  ) => Promise<import("@/types/leave").Request>;
  getHodOverview: () => Promise<HodOverviewResponse>;
  getHodCounsellors: () => Promise<HodCounsellor[]>;
  getHodStudents: () => Promise<HodStudent[]>;
  assignStudents: (
    counsellorId: string,
    registerNos: string[],
  ) => Promise<AssignStudentsResponse>;
  assignSection: (
    counsellorId: string,
    section: string,
  ) => Promise<AssignSectionResponse>;
  unassignStudent: (registerNo: string) => Promise<UnassignStudentResponse>;
  getHodLeaveReportBlob: (params?: {
    from?: string;
    to?: string;
    status?: string;
  }) => Promise<Blob>;
  getHodShortageReportBlob: () => Promise<Blob>;
  getAuditLog: (params?: {
    action?: string;
    from?: string;
    to?: string;
    limit?: number;
  }) => Promise<AuditEntry[]>;
  createNotice: (formData: FormData) => Promise<CreateNoticeResponse>;
  getNoticeInbox: (category?: string) => Promise<NoticeInboxItem[]>;
  getUnreadNoticeCount: () => Promise<UnreadNoticeCountResponse>;
  markNoticeRead: (noticeId: number | string) => Promise<void>;
  getSentNotices: () => Promise<NoticeSentItem[]>;
  withdrawNotice: (noticeId: number | string) => Promise<{ id: number; withdrawn: boolean }>;
  pinNotice: (noticeId: number | string, pinned: boolean) => Promise<{ id: number; pinned: boolean }>;
  getNoticeAttachmentBlob: (noticeId: number | string, attachmentId: number | string) => Promise<Blob>;
} = {
  ...implementation,
  login: useMock
    ? async (username: string) => ({
        accessToken: `mock-session-${username}`,
        tokenType: "bearer",
        expiresIn: 3600,
        user: {
          id: 1,
          username,
          fullName: "Demo User",
          role: "STUDENT" as const,
          department: "AI&DS",
          mustChangePassword: false,
          lastLoginAt: null,
        },
      })
    : httpApi.login,
  logout: useMock ? async () => {} : httpApi.logout,
  getAssignmentFrontPageBlob: useMock
    ? async () => new Blob(["%PDF-1.4 mock assignment"], { type: "application/pdf" })
    : httpApi.getAssignmentFrontPageBlob,
  getBlob: useMock
    ? async () => new Blob(["mock content"], { type: "application/octet-stream" })
    : httpApi.getBlob,
  submitLeave: useMock
    ? async () => {
        throw new Error("Mock submitLeave not supported directly on api; use leaveStore");
      }
    : httpApi.submitLeave,
  getMyLeaves: useMock
    ? async () => []
    : httpApi.getMyLeaves,
  getLeaveLetterBlob: useMock
    ? async () => new Blob(["mock letter"], { type: "application/pdf" })
    : httpApi.getLeaveLetterBlob,
  getLeaveQueue: useMock
    ? (counsellorId?: string) => mockApi.getLeaveQueue(counsellorId ?? "demo-counsellor")
    : httpApi.getLeaveQueue,
  getAssignedStudents: useMock
    ? (counsellorId?: string) => mockApi.getAssignedStudents(counsellorId ?? "demo-counsellor")
    : httpApi.getAssignedStudents,
  getStaffStudentSummary: useMock
    ? async () => null
    : httpApi.getStaffStudentSummary,
  getLeaveHistory: useMock
    ? (counsellorId?: string, filter: StaffHistoryFilter = "ALL") =>
        mockApi.getLeaveHistory(counsellorId ?? "demo-counsellor", filter)
    : httpApi.getLeaveHistory,
  decideLeaveRequest: useMock ? mockApi.decideLeaveRequest : httpApi.decideLeaveRequest,
  reassignLeaveRequest: useMock
    ? async () => {
        throw new Error("Mock reassign not supported directly on api; use leaveStore");
      }
    : httpApi.reassignLeaveRequest,
  getHodOverview: useMock
    ? async () => ({
        cards: {
          pendingApprovals: 0,
          totalStudents: 0,
          belowMinAttendance: 0,
          leaveThisMonth: 0,
          noticesSent: 0,
        },
        attendanceBySection: [],
        belowMinStudents: [],
        pendingApprovals: [],
      })
    : httpApi.getHodOverview,
  getHodCounsellors: useMock ? async () => [] : httpApi.getHodCounsellors,
  getHodStudents: useMock ? async () => [] : httpApi.getHodStudents,
  assignStudents: useMock ? async () => ({ updated: 0, skipped: [] }) : httpApi.assignStudents,
  assignSection: useMock ? async () => ({ updated: 0 }) : httpApi.assignSection,
  unassignStudent: useMock ? async () => ({ updated: 0 }) : httpApi.unassignStudent,
  getHodLeaveReportBlob: useMock
    ? async () => new Blob([""], { type: "text/csv" })
    : httpApi.getHodLeaveReportBlob,
  getHodShortageReportBlob: useMock
    ? async () => new Blob([""], { type: "text/csv" })
    : httpApi.getHodShortageReportBlob,
  getAuditLog: useMock ? async () => [] : httpApi.getAuditLog,
  createNotice: useMock
    ? async () => ({ id: 1, recipientCount: 0 })
    : httpApi.createNotice,
  getNoticeInbox: useMock ? async () => [] : httpApi.getNoticeInbox,
  getUnreadNoticeCount: useMock ? async () => ({ unread: 0 }) : httpApi.getUnreadNoticeCount,
  markNoticeRead: useMock ? async () => {} : httpApi.markNoticeRead,
  getSentNotices: useMock ? async () => [] : httpApi.getSentNotices,
  withdrawNotice: useMock
    ? async (id: number | string) => ({ id: Number(id), withdrawn: true })
    : httpApi.withdrawNotice,
  pinNotice: useMock
    ? async (id: number | string, pinned: boolean) => ({ id: Number(id), pinned })
    : httpApi.pinNotice,
  getNoticeAttachmentBlob: useMock
    ? async () => new Blob([""], { type: "application/octet-stream" })
    : httpApi.getNoticeAttachmentBlob,
};

export { ApiError } from "@/api/http";
export type * from "@/api/types";
