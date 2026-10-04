import type {
  AssignmentOptions,
  Dashboard,
  FeeSummary,
  ResultsResponse,
  StudentProfile,
  SubjectMarks,
} from "@/api/types";
import {
  ATTENDANCE_MIN,
  fakeAssignmentOptions,
  fakeDashboard,
  fakeFees,
  fakeProfile,
  getFakeTimetable,
} from "@/lib/erpData";

export { ATTENDANCE_MIN };
export const mockSubjects: SubjectMarks[] = fakeDashboard.marks;
export const mockProfile: StudentProfile = fakeProfile;
export const mockDashboard: Dashboard = fakeDashboard;
export const mockFees: FeeSummary = fakeFees;

export let mockResultsPublished = false;

export function setMockResultsPublished(published: boolean): void {
  mockResultsPublished = published;
}

export const mockResults: Omit<ResultsResponse, "published"> = {
  semesters: [
    {
      semester: 5,
      gpa: 8.1,
      subjects: mockSubjects.map((subject, index) => ({
        code: subject.code,
        name: subject.name,
        grade: ["A", "B+", "A", "B", "A"][index] ?? "B",
        result: "PASS",
      })),
    },
  ],
};

export const mockAssignmentOptions: AssignmentOptions = fakeAssignmentOptions;

export function getMockTimetable(date?: string) {
  return getFakeTimetable(date);
}
