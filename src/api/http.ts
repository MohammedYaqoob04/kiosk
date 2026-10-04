import { getAuthToken } from "@/lib/auth-session";
import type {
  AssignmentFrontPageResponse,
  AssignmentOptions,
  ChangePasswordResponse,
  Dashboard,
  FeeSummary,
  ResultsResponse,
  StudentProfile,
  TimetableDay,
} from "@/api/types";

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

const configuredBaseUrl = (import.meta.env["VITE_API_URL"] ?? "").replace(/\/$/, "");
const baseUrl = `${configuredBaseUrl}/api/v1`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
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
        const payload = body as { message?: unknown; code?: unknown };
        if (typeof payload.message === "string") message = payload.message;
        if (typeof payload.code === "string") code = payload.code;
      }
    } catch {
      // Keep the HTTP status message when the response has no JSON error body.
    }
    throw new ApiError(message, response.status, code);
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

export const httpApi = {
  getProfile: () => request<StudentProfile>("/profile"),
  getDashboard: () => request<Dashboard>("/dashboard"),
  getTimetable: (date?: string) =>
    request<TimetableDay>(`/timetable${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  getFees: () => request<FeeSummary>("/fees"),
  getResults: () => request<ResultsResponse>("/results"),
  getAssignmentOptions: () => request<AssignmentOptions>("/assignments/options"),
  createAssignmentFrontPage: (subjectCode: string, no: number) =>
    request<AssignmentFrontPageResponse>("/assignments/front-page", {
      method: "POST",
      body: JSON.stringify({ subjectCode, no }),
    }),
  changePassword: (current: string, next: string) =>
    request<ChangePasswordResponse>("/password", {
      method: "POST",
      body: JSON.stringify({ current, next }),
    }),
};
