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
import {
  getMockTimetable,
  mockAssignmentOptions,
  mockDashboard,
  mockFees,
  mockProfile,
  mockResults,
  mockResultsPublished,
} from "@/api/mock/data";

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 300));

export const mockApi = {
  async getProfile(): Promise<StudentProfile> {
    await delay();
    return structuredClone(mockProfile);
  },
  async getDashboard(): Promise<Dashboard> {
    await delay();
    return structuredClone(mockDashboard);
  },
  async getTimetable(date?: string): Promise<TimetableDay> {
    await delay();
    return structuredClone(getMockTimetable(date));
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
};
