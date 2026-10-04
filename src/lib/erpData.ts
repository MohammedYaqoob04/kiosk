import type {
  AssignmentOptions,
  Dashboard,
  FeeSummary,
  StudentProfile,
  TimetableDay,
} from "@/api/types";
import { department } from "@/config/department";

export const ATTENDANCE_MIN = 75;

export const fakeProfile: StudentProfile = {
  registerNo: "510423243001",
  name: "Test Student",
  batch: department.batch,
  departmentCode: department.code,
  programme: "B.Tech AIDS",
  course: "B.TECH AIDS",
  semester: 7,
  year: 4,
  section: "A",
  academicYear: "2026-2027",
  department: department.code,
  dateOfBirth: "01-01-2005",
  gender: "Male",
  mobile: "9876543210",
  email: "student@example.com",
  lastLoginAt: "2026-10-04T09:00:00.000Z",
};

export const fakeStudent = fakeProfile;

export const fakeDashboard: Dashboard = {
  attendance: {
    overallPercent: 87.5,
    eligible: 87.5 >= ATTENDANCE_MIN,
    thresholdPercent: ATTENDANCE_MIN,
  },
  today: {
    date: "2026-10-04",
    hours: Array.from({ length: 7 }, (_, index) => ({
      hour: (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
      status: null,
    })),
  },
  marks: [
    { code: "XX1001", name: "Subject One", cia1: 38, asmt1: 18, cia2: 41, asmt2: 19, model: null },
    { code: "XX1002", name: "Subject Two", cia1: 40, asmt1: 17, cia2: 42, asmt2: 18, model: null },
    {
      code: "XX1003",
      name: "Subject Three",
      cia1: 36,
      asmt1: 19,
      cia2: 39,
      asmt2: 20,
      model: null,
    },
    { code: "XX1004", name: "Subject Four", cia1: 44, asmt1: 18, cia2: 43, asmt2: 17, model: null },
    { code: "XX1005", name: "Subject Five", cia1: 39, asmt1: 20, cia2: 40, asmt2: 18, model: null },
  ],
};

export const fakeFees: FeeSummary = {
  academicYear: fakeProfile.academicYear,
  items: [
    { feeType: "tuition_fee", total: 52000, paid: 32000, balance: 20000 },
    { feeType: "transport_fee", total: 25000, paid: 10000, balance: 15000 },
  ],
  payments: [
    {
      transactionId: "TXN-SAMPLE-0001",
      feeType: "tuition_fee",
      amount: 32000,
      date: "2026-06-12",
      receiptNo: "RCP-SAMPLE-0001",
    },
    {
      transactionId: "TXN-SAMPLE-0002",
      feeType: "development_fee",
      amount: 2500,
      date: "2026-06-12",
      receiptNo: "RCP-SAMPLE-0002",
    },
    {
      transactionId: "TXN-SAMPLE-0003",
      feeType: "transport_fee",
      amount: 5000,
      date: "2026-07-08",
      receiptNo: "RCP-SAMPLE-0003",
    },
  ],
};

export const fakeAssignmentOptions: AssignmentOptions = {
  subjects: fakeDashboard.marks.map(({ code, name }) => ({ code, name })),
  assignmentNumbers: [1, 2, 3, 4],
};

const fakeSchedule: TimetableDay["hours"] = [
  { hour: 1, subjectCode: "XX1001", subjectName: "Subject One", staffName: "Faculty Demo" },
  { hour: 2, subjectCode: "XX1002", subjectName: "Subject Two", staffName: "Faculty Demo" },
  { hour: 3, subjectCode: "XX1003", subjectName: "Subject Three", staffName: "Faculty Demo" },
];

export function getFakeTimetable(date?: string): TimetableDay {
  const now = new Date();
  const dateValue =
    date ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const localDate = new Date(`${dateValue}T00:00:00`);
  const weekday = localDate.getDay();
  return {
    date: dateValue,
    dayName: new Intl.DateTimeFormat("en", { weekday: "long" }).format(localDate),
    hours: weekday === 0 || weekday === 6 ? [] : fakeSchedule,
  };
}
