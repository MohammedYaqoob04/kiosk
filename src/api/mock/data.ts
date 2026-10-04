import type {
  AssignmentOptions,
  Dashboard,
  FeeSummary,
  ResultsResponse,
  StudentProfile,
  SubjectMarks,
  TimetableDay,
} from "@/api/types";

export const mockSubjects: SubjectMarks[] = [
  {
    code: "AI3021",
    name: "IT in Agricultural System",
    cia1: 36,
    asmt1: 18,
    cia2: 39,
    asmt2: 17,
    model: 78,
  },
  {
    code: "CME365",
    name: "Renewable Energy Technologies",
    cia1: 41,
    asmt1: 16,
    cia2: 38,
    asmt2: 19,
    model: 74,
  },
  {
    code: "GE3752",
    name: "Total Quality Management",
    cia1: 34,
    asmt1: 20,
    cia2: 40,
    asmt2: 18,
    model: 81,
  },
  {
    code: "GE3791",
    name: "Human Values and Ethics",
    cia1: 43,
    asmt1: 17,
    cia2: 35,
    asmt2: 20,
    model: 76,
  },
  {
    code: "OBT357",
    name: "Biotechnology in Healthcare",
    cia1: 37,
    asmt1: 19,
    cia2: 42,
    asmt2: 16,
    model: 79,
  },
];

export const mockProfile: StudentProfile = {
  registerNo: "510000000001",
  name: "Sample Student",
  batch: "2023-2027",
  programme: "B.E.",
  course: "Computer Science and Engineering",
  semester: 6,
  year: 3,
  section: "A",
  academicYear: "2026-2027",
  department: "Computer Science and Engineering",
  dateOfBirth: "2005-01-01",
  gender: "Not specified",
  mobile: "9000000001",
  email: "sample.student@example.invalid",
  lastLoginAt: "2026-10-04T09:00:00.000Z",
};

export const mockDashboard: Dashboard = {
  attendance: { overallPercent: 87.5, eligible: true, thresholdPercent: 75 },
  today: {
    date: "2026-10-04",
    hours: [
      {
        hour: 1,
        subjectCode: "AI3021",
        subjectName: "IT in Agricultural System",
        status: "PRESENT",
      },
      {
        hour: 2,
        subjectCode: "CME365",
        subjectName: "Renewable Energy Technologies",
        status: "PRESENT",
      },
      { hour: 3, subjectCode: "GE3752", subjectName: "Total Quality Management", status: "OD" },
      { hour: 4, subjectCode: "GE3791", subjectName: "Human Values and Ethics", status: null },
      { hour: 5, subjectCode: "OBT357", subjectName: "Biotechnology in Healthcare", status: null },
      { hour: 6, subjectCode: "AI3021", subjectName: "IT in Agricultural System", status: null },
      {
        hour: 7,
        subjectCode: "CME365",
        subjectName: "Renewable Energy Technologies",
        status: null,
      },
    ],
  },
  marks: mockSubjects,
};

const mockTimetable: TimetableDay = {
  date: "2026-10-04",
  dayName: "Sunday",
  hours: mockDashboard.today.hours.map((slot) => ({
    hour: slot.hour,
    subjectCode: slot.subjectCode ?? "AI3021",
    subjectName: slot.subjectName ?? "IT in Agricultural System",
    staffName: "Sample Faculty",
  })),
};

export const mockFees: FeeSummary = {
  academicYear: "2026-2027",
  items: [
    { feeType: "Tuition", total: 52000, paid: 32000, balance: 20000 },
    { feeType: "Library", total: 2500, paid: 2500, balance: 0 },
    { feeType: "Laboratory", total: 8500, paid: 5000, balance: 3500 },
    { feeType: "Student services", total: 3000, paid: 0, balance: 3000 },
  ],
  payments: [
    {
      transactionId: "TXN-SAMPLE-0001",
      feeType: "Tuition",
      amount: 32000,
      date: "2026-06-12",
      receiptNo: "RCP-SAMPLE-0001",
    },
    {
      transactionId: "TXN-SAMPLE-0002",
      feeType: "Library",
      amount: 2500,
      date: "2026-06-12",
      receiptNo: "RCP-SAMPLE-0002",
    },
    {
      transactionId: "TXN-SAMPLE-0003",
      feeType: "Laboratory",
      amount: 5000,
      date: "2026-07-08",
      receiptNo: "RCP-SAMPLE-0003",
    },
  ],
};

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

export const mockAssignmentOptions: AssignmentOptions = {
  subjects: mockSubjects.map(({ code, name }) => ({ code, name })),
  assignmentNumbers: [1, 2, 3, 4],
};

export function getMockTimetable(date?: string): TimetableDay {
  return date ? { ...mockTimetable, date } : mockTimetable;
}
