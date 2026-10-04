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
import { httpApi } from "@/api/http";
import { mockApi } from "@/api/mock";

const useMock = (import.meta.env["VITE_USE_MOCK"] ?? "true").toLowerCase() !== "false";
const implementation = useMock ? mockApi : httpApi;
export const isMockApi = useMock;

export const api: {
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
  changePassword: (current: string, next: string) => Promise<ChangePasswordResponse>;
} = implementation;

export { ApiError } from "@/api/http";
export type * from "@/api/types";
