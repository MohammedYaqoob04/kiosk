import type {
  AssignmentOptions,
  Dashboard,
  FeeSummary,
  ResultsResponse,
  StudentProfile,
  SubjectMarks,
  RegisteredSubject,
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

export const mockRegisteredSubjects: RegisteredSubject[] = [
  { code: "A13021", title: "IT in Agricultural System", credits: 3 },
  { code: "CME365", title: "Renewable Energy Technologies", credits: 3 },
  { code: "GE3752", title: "Total Quality Management", credits: 3 },
  { code: "GE3791", title: "Human Values and Ethics", credits: 3 },
  { code: "OBT357", title: "Biotechnology in Healthcare", credits: 3 },
  { code: "SKILL", title: "Skill Development", credits: 3 },
];

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

import { getClassTimetable } from "@/lib/timetable-store";

export function getMockTimetable(date?: string, className?: string) {
  const resolvedClass =
    className ??
    (fakeProfile.year === 4
      ? "IV-A"
      : fakeProfile.year === 3
        ? "III-A"
        : fakeProfile.year === 2
          ? "II-A"
          : "III-A");
  return getClassTimetable(resolvedClass, date);
}

