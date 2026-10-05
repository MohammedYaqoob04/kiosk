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
  withdrawNotice: (noticeId: number | string) => Promise<{ id: number | string; withdrawn: boolean }>;
  pinNotice: (noticeId: number | string, pinned: boolean) => Promise<{ id: number | string; pinned: boolean }>;
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
    ? async (urlOrPath: string) => {
        if (urlOrPath.startsWith("data:")) {
          const res = await fetch(urlOrPath);
          return res.blob();
        }
        return new Blob(["mock content"], { type: "application/octet-stream" });
      }
    : httpApi.getBlob,
  submitLeave: useMock
    ? async (formData: FormData) => {
        const { submitRequest } = await import("@/lib/leaveStore");
        const { getCurrentUser } = await import("@/lib/auth-session");
        const kind = (formData.get("kind") as "LEAVE" | "OD") || "LEAVE";
        const category = (formData.get("category") as string) || "Medical";
        const fromDate = (formData.get("fromDate") as string) || "";
        const toDate = (formData.get("toDate") as string) || "";
        const user = getCurrentUser();
        const studentRegNo = user?.identifier || "510423243001";
        const studentName = user?.name || "Demo Student";

        if (kind === "LEAVE") {
          const reason = (formData.get("reason") as string) || "";
          return submitRequest({
            studentRegNo,
            studentName,
            kind: "LEAVE",
            category: category as import("@/types/leave").LeaveCategory,
            fromDate,
            toDate,
            reason,
          });
        } else {
          const eventName = (formData.get("eventName") as string) || "";
          const organizer = (formData.get("organizer") as string) || "";
          const venue = (formData.get("venue") as string) || "";
          const letterFile = formData.get("letter");
          let letterInput: import("@/types/leave").LeaveLetterInput;
          if (letterFile instanceof File) {
            const buffer = await letterFile.arrayBuffer();
            let binary = "";
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i] ?? 0);
            }
            const base64 = btoa(binary);
            const letterType = (letterFile.type || "application/pdf") as import("@/types/leave").LeaveLetterInput["type"];
            letterInput = {
              name: letterFile.name,
              type: letterType,
              size: letterFile.size,
              dataUrl: `data:${letterType};base64,${base64}`,
            };
          } else {
            letterInput = {
              name: "letter.pdf",
              type: "application/pdf",
              size: 1024,
              dataUrl: "data:application/pdf;base64,bW9jayBsZXR0ZXI=",
            };
          }
          return submitRequest({
            studentRegNo,
            studentName,
            kind: "OD",
            category: category as import("@/types/leave").OdCategory,
            fromDate,
            toDate,
            eventName,
            organizer,
            venue,
            letter: letterInput,
          });
        }
      }
    : httpApi.submitLeave,
  getMyLeaves: useMock
    ? async () => {
        const { getRequestsSnapshot } = await import("@/lib/leaveStore");
        const { getCurrentUser } = await import("@/lib/auth-session");
        const user = getCurrentUser();
        const all = getRequestsSnapshot();
        return user ? all.filter((r) => r.studentRegNo === user.identifier) : all;
      }
    : httpApi.getMyLeaves,
  getLeaveLetterBlob: useMock
    ? async (leaveId: string | number) => {
        const { getRequestsSnapshot } = await import("@/lib/leaveStore");
        const all = getRequestsSnapshot();
        const req = all.find((r) => String(r.id) === String(leaveId));
        if (req && req.kind === "OD" && req.letter?.dataUrl) {
          const res = await fetch(req.letter.dataUrl);
          return res.blob();
        }
        return new Blob(["%PDF-1.4 mock letter"], { type: "application/pdf" });
      }
    : httpApi.getLeaveLetterBlob,
  getLeaveQueue: useMock
    ? async (counsellorId?: string) => {
        const { getCurrentUser } = await import("@/lib/auth-session");
        const { listForCounsellor, listForHod } = await import("@/lib/leaveStore");
        const user = getCurrentUser();
        if (user?.role === "HOD") return listForHod();
        return listForCounsellor(counsellorId ?? user?.identifier ?? user?.id ?? "demo-counsellor");
      }
    : httpApi.getLeaveQueue,
  getAssignedStudents: useMock
    ? async (counsellorId?: string, q?: string, belowMin?: boolean) => {
        const { listStudents, ATTENDANCE_MIN } = await import("@/lib/staffData");
        const { getRequestsSnapshot } = await import("@/lib/leaveStore");
        const { getCurrentUser } = await import("@/lib/auth-session");
        const user = getCurrentUser();
        const cid = counsellorId ?? user?.identifier ?? user?.id ?? "demo-counsellor";
        const stList = listStudents(cid);
        const requests = getRequestsSnapshot();
        const normalizedQ = q?.toLowerCase().trim();
        return stList
          .filter(
            (s) =>
              !normalizedQ ||
              s.name.toLowerCase().includes(normalizedQ) ||
              s.regNo.includes(normalizedQ),
          )
          .filter((s) => !belowMin || s.attendancePercentage < ATTENDANCE_MIN)
          .map((s) => {
            const sReqs = requests.filter((r) => r.studentRegNo === s.regNo);
            return {
              name: s.name,
              registerNo: s.regNo,
              department: "Artificial Intelligence & Data Science",
              departmentCode: s.departmentCode,
              attendancePercentage: s.attendancePercentage,
              assignedCounsellorId: cid,
              batch: "2023-2027",
              programme: "B.Tech",
              course: "B.Tech AIDS",
              semester: s.semester,
              year: 4,
              section: s.section,
              mobile: "",
              email: "",
              gender: "Other",
              leaveCount: sReqs.length,
              pendingCount: sReqs.filter(
                (r) => r.status === "PENDING_COUNSELLOR" || r.status === "PENDING_HOD",
              ).length,
              belowMinAttendance: s.attendancePercentage < ATTENDANCE_MIN,
            };
          });
      }
    : httpApi.getAssignedStudents,
  getStaffStudentSummary: useMock
    ? async (registerNo: string) => {
        const { getStudentSummary, ATTENDANCE_MIN } = await import("@/lib/staffData");
        const { listForStudent } = await import("@/lib/leaveStore");
        const student = getStudentSummary(registerNo);
        if (!student) return null;
        const recentRequests = listForStudent(registerNo)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 5)
          .map((r) => {
            const reason =
              r.status === "REJECTED_BY_COUNSELLOR"
                ? r.counsellorDecision?.remark
                : r.status === "REJECTED_BY_HOD"
                  ? r.hodDecision?.remark
                  : null;
            return {
              id: r.id,
              kind: r.kind,
              category: r.category,
              status: r.status,
              fromDate: r.fromDate,
              toDate: r.toDate,
              rejectionReason: reason ?? null,
            };
          });
        return {
          registerNo: student.regNo,
          name: student.name,
          batch: "2023-2027",
          section: student.section,
          semester: student.semester,
          attendancePercentage: student.attendancePercentage,
          belowMinAttendance: student.attendancePercentage < ATTENDANCE_MIN,
          recentRequests,
        };
      }
    : httpApi.getStaffStudentSummary,
  getLeaveHistory: useMock
    ? async (counsellorId?: string, filter: StaffHistoryFilter = "ALL") => {
        const { getCurrentUser } = await import("@/lib/auth-session");
        const { listCounsellorHistory, listHodHistory } = await import("@/lib/leaveStore");
        const user = getCurrentUser();
        const rawList = user?.role === "HOD" ? listHodHistory() : listCounsellorHistory();
        return rawList
          .map((req) => {
            const decisionObj = user?.role === "HOD" ? req.hodDecision : req.counsellorDecision;
            const dec = req.status.includes("REJECT") ? ("REJECTED" as const) : ("APPROVED" as const);
            return {
              id: `${req.id}-${decisionObj?.at ?? req.createdAt}`,
              request: req,
              decision: dec,
              decidedAt: decisionObj?.at ?? req.createdAt,
              ...(decisionObj?.remark ? { remark: decisionObj.remark } : {}),
            };
          })
          .filter((entry) => filter === "ALL" || entry.decision === filter)
          .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
      }
    : httpApi.getLeaveHistory,
  decideLeaveRequest: useMock
    ? async (id: string, decision: LeaveDecision, remark?: string) => {
        const { counsellorApprove, counsellorReject, hodApprove, hodReject, getRequestsSnapshot } =
          await import("@/lib/leaveStore");
        const { getCurrentUser } = await import("@/lib/auth-session");
        const user = getCurrentUser();
        const approver = user?.name ?? "Approver Demo";
        const req = getRequestsSnapshot().find((r) => r.id === id);
        if (!req) throw new Error("Request not found.");
        if (user?.role === "HOD" || req.status === "PENDING_HOD") {
          return decision === "APPROVE"
            ? hodApprove(id, approver)
            : hodReject(id, approver, remark ?? "");
        }
        return decision === "APPROVE"
          ? counsellorApprove(id, approver)
          : counsellorReject(id, approver, remark ?? "");
      }
    : httpApi.decideLeaveRequest,
  reassignLeaveRequest: useMock
    ? async (id: string, counsellorId: string) => {
        const { reassignCounsellor } = await import("@/lib/leaveStore");
        return reassignCounsellor(id, counsellorId);
      }
    : httpApi.reassignLeaveRequest,
  getHodOverview: useMock
    ? async () => {
        const { listAllStudents, ATTENDANCE_MIN } = await import("@/lib/staffData");
        const { getRequestsSnapshot } = await import("@/lib/leaveStore");
        const { getNoticesSnapshot } = await import("@/lib/noticeStore");
        const students = listAllStudents();
        const requests = getRequestsSnapshot();
        const notices = getNoticesSnapshot();
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const pendingApprovals = requests.filter((r) => r.status === "PENDING_HOD");
        const lowAttendance = students.filter((s) => s.attendancePercentage < ATTENDANCE_MIN);
        const thisMonth = requests.filter((r) => Date.parse(r.createdAt) >= monthStart.getTime());

        const attendanceBySection = (["A", "B"] as const).map((section) => {
          const sectionStudents = students.filter((s) => s.section === section);
          const avg = sectionStudents.length
            ? Number(
                (
                  sectionStudents.reduce((sum, s) => sum + s.attendancePercentage, 0) /
                  sectionStudents.length
                ).toFixed(1),
              )
            : null;
          return {
            section,
            students: sectionStudents.length,
            averagePercent: avg,
          };
        });

        const belowMinStudents = lowAttendance.map((s) => ({
          registerNo: s.regNo,
          name: s.name,
          section: s.section,
          attendancePercentage: s.attendancePercentage,
        }));

        return {
          cards: {
            pendingApprovals: pendingApprovals.length,
            totalStudents: students.length,
            belowMinAttendance: lowAttendance.length,
            leaveThisMonth: thisMonth.length,
            noticesSent: notices.length,
          },
          attendanceBySection,
          belowMinStudents,
          pendingApprovals,
        };
      }
    : httpApi.getHodOverview,
  getHodCounsellors: useMock
    ? async () => {
        const { counsellors, listStudents } = await import("@/lib/staffData");
        const { getRequestsSnapshot } = await import("@/lib/leaveStore");
        const requests = getRequestsSnapshot();
        return counsellors.map((c) => {
          const assigned = listStudents(c.id);
          const pending = requests.filter(
            (r) =>
              r.status === "PENDING_COUNSELLOR" &&
              assigned.some((s) => s.regNo === r.studentRegNo),
          );
          return {
            id: c.id,
            staffId: c.id,
            name: c.name,
            department: "Artificial Intelligence & Data Science",
            departmentCode: "AIDS",
            studentCount: assigned.length,
            pendingCount: pending.length,
          };
        });
      }
    : httpApi.getHodCounsellors,
  getHodStudents: useMock
    ? async () => {
        const { listAllStudents, counsellorOf, counsellors, ATTENDANCE_MIN } =
          await import("@/lib/staffData");
        const { getRequestsSnapshot } = await import("@/lib/leaveStore");
        const students = listAllStudents();
        const requests = getRequestsSnapshot();
        return students.map((s) => {
          const cId = counsellorOf(s.regNo);
          const c = counsellors.find((item) => item.id === cId);
          const sReqs = requests.filter((r) => r.studentRegNo === s.regNo);
          return {
            name: s.name,
            registerNo: s.regNo,
            department: "Artificial Intelligence & Data Science",
            departmentCode: s.departmentCode,
            attendancePercentage: s.attendancePercentage,
            assignedCounsellorId: cId ?? "",
            batch: "2023-2027",
            programme: "B.Tech",
            course: "B.Tech AIDS",
            semester: s.semester,
            year: 4,
            section: s.section,
            mobile: "",
            email: "",
            gender: "Other",
            leaveCount: sReqs.length,
            pendingCount: sReqs.filter(
              (r) => r.status === "PENDING_COUNSELLOR" || r.status === "PENDING_HOD",
            ).length,
            belowMinAttendance: s.attendancePercentage < ATTENDANCE_MIN,
            counsellor: c ? { id: c.id, name: c.name } : null,
          };
        });
      }
    : httpApi.getHodStudents,
  assignStudents: useMock
    ? async (counsellorId: string, registerNos: string[]) => {
        const { assignStudents } = await import("@/lib/staffData");
        assignStudents(counsellorId, registerNos);
        return { updated: registerNos.length, skipped: [] };
      }
    : httpApi.assignStudents,
  assignSection: useMock
    ? async (counsellorId: string, section: string) => {
        const { assignSection, listAllStudents } = await import("@/lib/staffData");
        assignSection(counsellorId, section as "A" | "B");
        const count = listAllStudents().filter((s) => s.section === section).length;
        return { updated: count };
      }
    : httpApi.assignSection,
  unassignStudent: useMock
    ? async (registerNo: string) => {
        const { unassign } = await import("@/lib/staffData");
        unassign(registerNo);
        return { updated: 1 };
      }
    : httpApi.unassignStudent,
  getHodLeaveReportBlob: useMock
    ? async (params?: { from?: string; to?: string; status?: string }) => {
        const { getRequestsSnapshot } = await import("@/lib/leaveStore");
        const requests = getRequestsSnapshot();
        const filtered = requests.filter((r) => {
          const d = r.createdAt.slice(0, 10);
          return (
            (!params?.from || d >= params.from) &&
            (!params?.to || d <= params.to) &&
            (!params?.status || params.status === "ALL" || r.status === params.status)
          );
        });
        const rows = [
          [
            "Date",
            "Request ID",
            "Reg No",
            "Student",
            "Kind",
            "Category",
            "From",
            "To",
            "Status",
            "Counsellor",
            "HOD",
          ],
          ...filtered.map((r) => [
            r.createdAt.slice(0, 10),
            r.id,
            r.studentRegNo,
            r.studentName,
            r.kind,
            r.category,
            r.fromDate,
            r.toDate,
            r.status,
            r.counsellorDecision?.by ?? "",
            r.hodDecision?.by ?? "",
          ]),
        ];
        const csv = rows
          .map((row) => row.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
          .join("\r\n");
        return new Blob([csv], { type: "text/csv;charset=utf-8" });
      }
    : httpApi.getHodLeaveReportBlob,
  getHodShortageReportBlob: useMock
    ? async () => {
        const { listAllStudents, ATTENDANCE_MIN } = await import("@/lib/staffData");
        const students = listAllStudents().filter((s) => s.attendancePercentage < ATTENDANCE_MIN);
        const rows = [
          ["Reg No", "Name", "Section", "Attendance %", "Department"],
          ...students.map((s) => [s.regNo, s.name, s.section, s.attendancePercentage, s.departmentCode]),
        ];
        const csv = rows
          .map((row) => row.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(","))
          .join("\r\n");
        return new Blob([csv], { type: "text/csv;charset=utf-8" });
      }
    : httpApi.getHodShortageReportBlob,
  getAuditLog: useMock
    ? async (params?: { action?: string; from?: string; to?: string; limit?: number }) => {
        const { getAuditSnapshot } = await import("@/lib/auditLog");
        let list = getAuditSnapshot();
        if (params?.action && params.action !== "ALL") {
          list = list.filter((e) => e.action === params.action);
        }
        if (params?.from) {
          const from = params.from;
          list = list.filter((e) => e.time.slice(0, 10) >= from);
        }
        if (params?.to) {
          const to = params.to;
          list = list.filter((e) => e.time.slice(0, 10) <= to);
        }
        if (params?.limit) list = list.slice(0, params.limit);
        return list;
      }
    : httpApi.getAuditLog,
  createNotice: useMock
    ? async (formData: FormData) => {
        const { createNotice: storeCreateNotice, recipientCount } = await import("@/lib/noticeStore");
        const { getCurrentUser } = await import("@/lib/auth-session");
        const user = getCurrentUser();
        const title = (formData.get("title") as string) || "";
        const body = (formData.get("body") as string) || "";
        const category = (formData.get("category") as import("@/lib/noticeStore").NoticeCategory) || "Notice";
        const audience = (formData.get("audience") as import("@/lib/noticeStore").NoticeAudience) || "ALL_STUDENTS";
        const expiresAt = (formData.get("expiresAt") as string) || undefined;
        const pinned = formData.get("pinned") === "true";

        const rawFiles = formData.getAll("files");
        const attachments: import("@/lib/noticeStore").NoticeAttachment[] = [];
        for (const file of rawFiles) {
          if (file instanceof File && file.size > 0) {
            const buffer = await file.arrayBuffer();
            let binary = "";
            const bytes = new Uint8Array(buffer);
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i] ?? 0);
            }
            const base64 = btoa(binary);
            const fileType = (file.type || "application/pdf") as import("@/lib/noticeStore").NoticeAttachment["type"];
            attachments.push({
              name: file.name,
              type: fileType,
              size: file.size,
              dataUrl: `data:${fileType};base64,${base64}`,
            });
          }
        }

        const notice = storeCreateNotice({
          title,
          body,
          category,
          audience,
          authorRole: user?.role === "HOD" ? "HOD" : "COUNSELLOR",
          authorId: user?.id || user?.identifier || "STAFF-AI-104",
          authorName: user?.name || "Staff Member",
          ...(expiresAt ? { expiresAt } : {}),
          ...(user?.role === "HOD" && pinned ? { pinned: true } : {}),
          attachments,
        });

        return {
          id: notice.id,
          recipientCount: recipientCount(notice),
        };
      }
    : httpApi.createNotice,
  getNoticeInbox: useMock
    ? async (category?: string) => {
        const { listForStudent, listForCounsellor } = await import("@/lib/noticeStore");
        const { getCurrentUser } = await import("@/lib/auth-session");
        const user = getCurrentUser();
        const identifier = user?.identifier || user?.id || "";
        const rawNotices =
          user?.role === "COUNSELLOR"
            ? listForCounsellor(identifier)
            : listForStudent(identifier);
        const filtered =
          category && category !== "All"
            ? rawNotices.filter((n) => n.category === category)
            : rawNotices;
        return filtered.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          category: n.category,
          authorName: n.authorName,
          authorRole: n.authorRole,
          createdAt: n.createdAt,
          expiresAt: n.expiresAt ?? null,
          audience: n.audience,
          pinned: Boolean(n.pinned),
          unread: !n.readBy.includes(identifier),
          attachments: n.attachments.map((att, idx) => ({
            id: `${n.id}-${idx}`,
            name: att.name,
            type: att.type,
            size: att.size,
            url: att.dataUrl,
          })),
        }));
      }
    : httpApi.getNoticeInbox,
  getUnreadNoticeCount: useMock
    ? async () => {
        const { unreadCount } = await import("@/lib/noticeStore");
        const { getCurrentUser } = await import("@/lib/auth-session");
        const user = getCurrentUser();
        const identifier = user?.identifier || "";
        return { unread: unreadCount(identifier) };
      }
    : httpApi.getUnreadNoticeCount,
  markNoticeRead: useMock
    ? async (noticeId: number | string) => {
        const { markRead } = await import("@/lib/noticeStore");
        const { getCurrentUser } = await import("@/lib/auth-session");
        const user = getCurrentUser();
        if (user?.identifier) {
          markRead(String(noticeId), user.identifier);
        }
      }
    : httpApi.markNoticeRead,
  getSentNotices: useMock
    ? async () => {
        const { listSent, recipientCount, readCount } = await import("@/lib/noticeStore");
        const { getCurrentUser } = await import("@/lib/auth-session");
        const user = getCurrentUser();
        const authorId = user?.id || user?.identifier || "";
        const sentList = listSent(authorId);
        const now = Date.now();
        return sentList.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          category: n.category,
          audience: n.audience,
          createdAt: n.createdAt,
          pinned: Boolean(n.pinned),
          withdrawn: false,
          expired: Boolean(n.expiresAt && Date.parse(`${n.expiresAt}T23:59:59`) < now),
          recipientCount: recipientCount(n),
          readCount: readCount(n),
          attachments: n.attachments.map((att, idx) => ({
            id: `${n.id}-${idx}`,
            name: att.name,
            type: att.type,
            size: att.size,
            url: att.dataUrl,
          })),
        }));
      }
    : httpApi.getSentNotices,
  withdrawNotice: useMock
    ? async (id: number | string) => {
        const { withdraw } = await import("@/lib/noticeStore");
        const { getCurrentUser } = await import("@/lib/auth-session");
        const user = getCurrentUser();
        const authorId = user?.id || user?.identifier || "";
        withdraw(String(id), authorId);
        return { id, withdrawn: true };
      }
    : httpApi.withdrawNotice,
  pinNotice: useMock
    ? async (id: number | string, pinned: boolean) => {
        const { getNoticesSnapshot } = await import("@/lib/noticeStore");
        const notices = getNoticesSnapshot();
        const found = notices.find((n) => String(n.id) === String(id));
        if (found) {
          found.pinned = pinned;
        }
        return { id, pinned };
      }
    : httpApi.pinNotice,
  getNoticeAttachmentBlob: useMock
    ? async (noticeId: number | string, attachmentId: number | string) => {
        const { getNoticesSnapshot } = await import("@/lib/noticeStore");
        const notices = getNoticesSnapshot();
        const notice = notices.find((n) => String(n.id) === String(noticeId));
        if (notice) {
          const att = notice.attachments.find(
            (_, idx) =>
              `${notice.id}-${idx}` === String(attachmentId) || String(idx) === String(attachmentId),
          );
          if (att?.dataUrl) {
            const res = await fetch(att.dataUrl);
            return res.blob();
          }
        }
        return new Blob(["mock attachment binary"], { type: "application/octet-stream" });
      }
    : httpApi.getNoticeAttachmentBlob,
};

export { ApiError } from "@/api/http";
export type * from "@/api/types";
