import { getAuthToken, setAuthToken } from "@/lib/auth-session";
import type {
  AssignmentFrontPageResponse,
  AssignmentOptions,
  ChangePasswordResponse,
  Dashboard,
  FeeSummary,
  LoginResponse,
  ResultsResponse,
  StudentProfile,
  TimetableDay,
  StaffHistoryFilter,
  RegisteredSubjectsResponse,
} from "@/api/types";
import type { LeaveDecision } from "@/types/leave";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function formatServerError(
  err: unknown,
  fallback = "An unexpected error occurred.",
): string {
  if (err instanceof ApiError) {
    return err.code ? `[${err.code}] ${err.message}` : err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

const configuredBaseUrl = (import.meta.env["VITE_API_URL"] ?? "").replace(/\/$/, "");
const baseUrl = `${configuredBaseUrl}/api/v1`;

function resolveUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/api/v1/")) {
    return `${configuredBaseUrl}${path}`;
  }
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  let response: Response;
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  try {
    response = await fetch(resolveUrl(path), {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Unable to reach the API.",
      0,
      "NETWORK_ERROR",
    );
  }

  if (!response.ok) {
    let message = `API request failed (${response.status}).`;
    let code: string | undefined;
    try {
      const body: unknown = await response.json();
      if (typeof body === "object" && body !== null) {
        const payload = body as { message?: unknown; code?: unknown; detail?: unknown };
        if (typeof payload.message === "string") {
          message = payload.message;
        } else if (typeof payload.detail === "string") {
          message = payload.detail;
        } else if (Array.isArray(payload.detail) && payload.detail.length > 0) {
          const first = payload.detail[0] as { msg?: unknown };
          if (first && typeof first.msg === "string") {
            message = first.msg;
          }
        }
        if (typeof payload.code === "string") code = payload.code;
      }
    } catch {
      // Keep the HTTP status message when the response has no JSON error body.
    }
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      "The API returned an invalid JSON response.",
      response.status,
      "INVALID_JSON",
    );
  }
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const token = getAuthToken();
  const url = resolveUrl(path);
  let response: Response;
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...(init?.body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Unable to reach the API.",
      0,
      "NETWORK_ERROR",
    );
  }

  if (!response.ok) {
    let message = `API request failed (${response.status}).`;
    let code: string | undefined;
    try {
      const body: unknown = await response.json();
      if (typeof body === "object" && body !== null) {
        const payload = body as { message?: unknown; code?: unknown; detail?: unknown };
        if (typeof payload.message === "string") {
          message = payload.message;
        } else if (typeof payload.detail === "string") {
          message = payload.detail;
        } else if (Array.isArray(payload.detail) && payload.detail.length > 0) {
          const first = payload.detail[0] as { msg?: unknown };
          if (first && typeof first.msg === "string") {
            message = first.msg;
          }
        }
        if (typeof payload.code === "string") code = payload.code;
      }
    } catch {
      // Keep the HTTP status message when the response has no JSON error body.
    }
    throw new ApiError(message, response.status, code);
  }

  return response.blob();
}

export const httpApi = {
  login: async (username: string, password: string, portal?: "student" | "staff" | "hod") => {
    const res = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, portal }),
    });
    if (res.accessToken) {
      setAuthToken(res.accessToken);
    }
    return res;
  },
  logout: async () => {
    try {
      await request<void>("/auth/logout", {
        method: "POST",
      });
    } finally {
      setAuthToken(null);
    }
  },
  getProfile: () => request<StudentProfile>("/profile"),
  getDashboard: () => request<Dashboard>("/dashboard"),
  getTimetable: (date?: string, className?: string) => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (className) params.set("className", className);
    const qs = params.toString();
    return request<TimetableDay>(`/timetable${qs ? `?${qs}` : ""}`);
  },
  getRegisteredSubjects: () => request<RegisteredSubjectsResponse>("/subjects"),
  getFees: () => request<FeeSummary>("/fees"),
  getResults: () => request<ResultsResponse>("/results"),
  getAssignmentOptions: () => request<AssignmentOptions>("/assignments/options"),
  createAssignmentFrontPage: (subjectCode: string, no: number) =>
    request<AssignmentFrontPageResponse>("/assignments/front-page", {
      method: "POST",
      body: JSON.stringify({ subjectCode, no }),
    }),
  getAssignmentFrontPageBlob: (subjectCode: string, no: number) =>
    requestBlob("/assignments/front-page", {
      method: "POST",
      body: JSON.stringify({ subjectCode, no }),
    }),
  submitLeave: (formData: FormData) =>
    request<import("@/types/leave").Request>("/leave", {
      method: "POST",
      body: formData,
    }),
  getMyLeaves: () => request<import("@/types/leave").Request[]>("/leave/mine"),
  getLeaveLetterBlob: (leaveId: string | number) =>
    requestBlob(`/leave/${leaveId}/letter`),
  getBlob: (urlOrPath: string, init?: RequestInit) => requestBlob(urlOrPath, init),
  changePassword: async (current: string, next: string) => {
    const result = await request<ChangePasswordResponse>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current, next }),
    });
    if (result.accessToken) {
      setAuthToken(result.accessToken);
    }
    return result;
  },
  getLeaveQueue: (_counsellorId?: string) =>
    request<import("@/types/leave").Request[]>("/leave/queue"),
  getAssignedStudents: (
    counsellorIdOrParams?: string | { q?: string; belowMin?: boolean },
    qParam?: string,
    belowMinParam?: boolean,
  ) => {
    const params = new URLSearchParams();
    let q: string | undefined;
    let belowMin: boolean | undefined;

    if (typeof counsellorIdOrParams === "object" && counsellorIdOrParams !== null) {
      q = counsellorIdOrParams.q;
      belowMin = counsellorIdOrParams.belowMin;
    } else {
      q = qParam;
      belowMin = belowMinParam;
    }

    if (q) params.set("q", q);
    if (belowMin) params.set("below_min", "true");
    const qs = params.toString();
    return request<import("@/types/staff-dashboard").AssignedStudent[]>(
      `/staff/students${qs ? `?${qs}` : ""}`,
    );
  },
  getStaffStudentSummary: (registerNo: string) =>
    request<import("@/api/types").StaffStudentSummary>(
      `/staff/students/${encodeURIComponent(registerNo)}`,
    ),
  getStaffTimetable: (className?: string) => {
    const params = new URLSearchParams();
    if (className) params.set("className", className);
    const qs = params.toString();
    return request<{
      className: string;
      hall: string | null;
      days: import("@/api/types").TimetableWeekDay[];
    }>(`/staff/timetable${qs ? `?${qs}` : ""}`);
  },
  saveStaffTimetable: (payload: {
    className: string;
    hall: string;
    days: import("@/api/types").TimetableWeekDay[];
  }) =>
    request<{ ok: boolean; message: string; className: string; hall: string }>(
      "/staff/timetable",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  getLeaveHistory: (
    filterOrCounsellorId?: StaffHistoryFilter | string,
    maybeFilter: StaffHistoryFilter = "ALL",
  ) => {
    const filter: StaffHistoryFilter =
      filterOrCounsellorId === "ALL" ||
      filterOrCounsellorId === "APPROVED" ||
      filterOrCounsellorId === "REJECTED"
        ? filterOrCounsellorId
        : maybeFilter;
    return request<import("@/api/types").StaffLeaveHistory[]>(`/leave/history?filter=${filter}`);
  },
  decideLeaveRequest: (id: string, decision: LeaveDecision, remark?: string) => {
    if (decision === "REJECT" && (!remark || remark.trim().length < 10)) {
      throw new ApiError(
        "Rejection reason must be at least 10 characters.",
        400,
        "INVALID_REASON",
      );
    }
    return request<import("@/types/leave").Request>(`/leave/${encodeURIComponent(id)}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision, remark: remark?.trim() }),
    });
  },
  reassignLeaveRequest: (id: string, counsellorId: string) =>
    request<import("@/types/leave").Request>(`/leave/${encodeURIComponent(id)}/reassign`, {
      method: "POST",
      body: JSON.stringify({ counsellorId }),
    }),
  getHodOverview: () =>
    request<import("@/api/types").HodOverviewResponse>("/hod/overview"),
  getHodCounsellors: () =>
    request<import("@/api/types").HodCounsellor[]>("/hod/counsellors"),
  getHodStudents: () =>
    request<import("@/api/types").HodStudent[]>("/hod/students"),
  assignStudents: (counsellorId: string, registerNos: string[]) =>
    request<import("@/api/types").AssignStudentsResponse>("/hod/assign", {
      method: "POST",
      body: JSON.stringify({ counsellorId, registerNos }),
    }),
  assignSection: (counsellorId: string, section: string) =>
    request<import("@/api/types").AssignSectionResponse>("/hod/assign-section", {
      method: "POST",
      body: JSON.stringify({ counsellorId, section }),
    }),
  unassignStudent: (registerNo: string) =>
    request<import("@/api/types").UnassignStudentResponse>(
      `/hod/assign/${encodeURIComponent(registerNo)}`,
      { method: "DELETE" },
    ),
  getHodLeaveReportBlob: (params?: { from?: string; to?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.status && params.status !== "ALL") qs.set("status", params.status);
    const q = qs.toString();
    return requestBlob(`/hod/reports/leave.csv${q ? `?${q}` : ""}`);
  },
  getHodShortageReportBlob: async () => {
    try {
      return await requestBlob("/hod/reports/attendance-shortage.csv");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return await requestBlob("/attendance-shortage.csv");
      }
      throw err;
    }
  },
  getAuditLog: (params?: { action?: string; from?: string; to?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.action && params.action !== "ALL") qs.set("action", params.action);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return request<import("@/api/types").AuditEntry[]>(`/audit${q ? `?${q}` : ""}`);
  },
  createNotice: (formData: FormData) =>
    request<import("@/api/types").CreateNoticeResponse>("/notices", {
      method: "POST",
      body: formData,
    }),
  getNoticeInbox: (category?: string) => {
    const qs = category && category !== "All" ? `?category=${encodeURIComponent(category)}` : "";
    return request<import("@/api/types").NoticeInboxItem[]>(`/notices/inbox${qs}`);
  },
  getUnreadNoticeCount: () =>
    request<import("@/api/types").UnreadNoticeCountResponse>("/notices/unread-count"),
  markNoticeRead: (noticeId: number | string) =>
    request<void>(`/notices/${encodeURIComponent(noticeId)}/read`, {
      method: "POST",
    }),
  getSentNotices: () =>
    request<import("@/api/types").NoticeSentItem[]>("/notices/sent"),
  withdrawNotice: (noticeId: number | string) =>
    request<{ id: number | string; withdrawn: boolean }>(
      `/notices/${encodeURIComponent(noticeId)}/withdraw`,
      { method: "POST" },
    ),
  pinNotice: (noticeId: number | string, pinned: boolean) =>
    request<{ id: number | string; pinned: boolean }>(
      `/notices/${encodeURIComponent(noticeId)}/pin`,
      {
        method: "POST",
        body: JSON.stringify({ pinned }),
      },
    ),
  getNoticeAttachmentBlob: (noticeId: number | string, attachmentId: number | string) =>
    requestBlob(
      `/notices/${encodeURIComponent(noticeId)}/attachments/${encodeURIComponent(attachmentId)}`,
    ),
  importStudents: async (
    file: File,
    dryRun: boolean,
    assignTo?: string,
  ): Promise<import("@/api/types").StudentImportResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dryRun", String(dryRun));
    formData.append("dry_run", String(dryRun));
    if (assignTo) {
      formData.append("assignTo", assignTo);
      formData.append("assign_to", assignTo);
    }

    const qs = new URLSearchParams();
    qs.set("dryRun", String(dryRun));
    qs.set("dry_run", String(dryRun));
    if (assignTo) {
      qs.set("assignTo", assignTo);
      qs.set("assign_to", assignTo);
    }

    const raw = await request<any>(`/hod/students/import?${qs.toString()}`, {
      method: "POST",
      body: formData,
    });

    const rowsRead = raw?.rowsRead ?? raw?.rows_read ?? 0;
    const errorsRaw = raw?.errors ?? [];
    const errors: import("@/api/types").StudentImportError[] = Array.isArray(errorsRaw)
      ? errorsRaw.map((e: any) => ({
          row: e.row ?? e.rowNumber ?? e.row_number ?? e.line ?? 0,
          message: e.message ?? e.msg ?? e.error ?? String(e),
        }))
      : [];
    const warnings: string[] = Array.isArray(raw?.warnings)
      ? raw.warnings.map((w: any) =>
          typeof w === "string" ? w : w.message ?? w.msg ?? JSON.stringify(w),
        )
      : [];
    const ignoredSensitiveColumns: string[] = Array.isArray(
      raw?.ignoredSensitiveColumns ?? raw?.ignored_sensitive_columns,
    )
      ? (raw.ignoredSensitiveColumns ?? raw.ignored_sensitive_columns)
      : [];
    const created = raw?.created ?? raw?.inserted ?? 0;
    const updated = raw?.updated ?? 0;
    const assigned = raw?.assigned ?? 0;

    return {
      dryRun: Boolean(raw?.dryRun ?? raw?.dry_run ?? dryRun),
      rowsRead,
      errors,
      warnings,
      ignoredSensitiveColumns,
      created,
      updated,
      assigned,
    };
  },
};
