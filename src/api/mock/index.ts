import type {
  AssignmentFrontPageResponse,
  AssignmentOptions,
  ChangePasswordResponse,
  Dashboard,
  FeeSummary,
  ResultsResponse,
  StudentProfile,
  TimetableDay,
  RegisteredSubjectsResponse,
} from "@/api/types";
import {
  getMockTimetable,
  mockAssignmentOptions,
  mockDashboard,
  mockFees,
  mockProfile,
  mockRegisteredSubjects,
  mockResults,
  mockResultsPublished,
} from "@/api/mock/data";
import {
  decideLeaveRequest,
  getAssignedStudents,
  getCounsellorLeaveQueue,
  getLeaveRequestsSnapshot,
} from "@/lib/leave-store";
import type { LeaveDecision } from "@/types/leave";
import type { StaffHistoryFilter } from "@/api/types";

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 300));
const dateOfDecision = (request: ReturnType<typeof getLeaveRequestsSnapshot>[number]) =>
  [...request.history].reverse().find((entry) => entry.stage === "Counsellor");

export const mockApi = {
  async getProfile(): Promise<StudentProfile> {
    await delay();
    return structuredClone(mockProfile);
  },
  async getDashboard(): Promise<Dashboard> {
    await delay();
    return structuredClone(mockDashboard);
  },
  async getTimetable(date?: string, className?: string): Promise<TimetableDay> {
    await delay();
    return structuredClone(getMockTimetable(date, className));
  },
  async getRegisteredSubjects(): Promise<RegisteredSubjectsResponse> {
    await delay();
    return {
      subjects: structuredClone(mockRegisteredSubjects),
      totalSubjects: mockRegisteredSubjects.length,
      totalCredits: mockRegisteredSubjects.reduce((acc, s) => acc + s.credits, 0),
    };
  },
  async getFees(): Promise<FeeSummary> {
    await delay();
    return structuredClone(mockFees);
  },
  async getResults(): Promise<ResultsResponse> {
    await delay();
    return structuredClone({ ...mockResults, published: mockResultsPublished });
  },
  async getAssignmentOptions(): Promise<AssignmentOptions> {
    await delay();
    return structuredClone(mockAssignmentOptions);
  },
  async createAssignmentFrontPage(
    subjectCode: string,
    no: number,
  ): Promise<AssignmentFrontPageResponse> {
    await delay();
    return { created: true, subjectCode, assignmentNumber: no };
  },
  async changePassword(_current: string, _next: string): Promise<ChangePasswordResponse> {
    await delay();
    return { changed: true };
  },
  async getLeaveQueue(counsellorId: string) {
    await delay();
    return structuredClone(getCounsellorLeaveQueue(counsellorId));
  },
  async getAssignedStudents(counsellorId: string) {
    await delay();
    return structuredClone(getAssignedStudents(counsellorId));
  },
  async getLeaveHistory(counsellorId: string, filter: StaffHistoryFilter = "ALL") {
    await delay();
    return getLeaveRequestsSnapshot()
      .filter((request) => request.assignedCounsellorId === counsellorId)
      .flatMap((request) => {
        const decisionEntry = dateOfDecision(request);
        if (!decisionEntry || (filter !== "ALL" && decisionEntry.decision !== filter)) return [];
        return [
          {
            id: `${request.id}-${decisionEntry.at}`,
            request,
            decision: decisionEntry.decision as "APPROVED" | "REJECTED",
            decidedAt: decisionEntry.at,
            ...(decisionEntry.remark ? { remark: decisionEntry.remark } : {}),
          },
        ];
      })
      .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))
      .map((record) => structuredClone(record));
  },
  async decideLeaveRequest(id: string, decision: LeaveDecision, remark?: string) {
    await delay();
    if (decision === "REJECT" && !remark?.trim()) {
      throw new Error("A rejection remark is required.");
    }
    const updated = decideLeaveRequest(id, decision, remark?.trim());
    if (!updated) throw new Error("This request is no longer pending.");
    return structuredClone(updated);
  },
};
