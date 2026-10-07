import type {
  AttendanceSummary,
  DashboardAttendanceHour,
  DashboardSubjectMark,
  FeeRecord,
  HourAttendance,
  Role,
  SemesterResult,
  Student,
  SubjectMark,
  TimetableEntry,
  User,
} from "@/types/erp";
import { department } from "@/config/department";

export const demoStudent: Student = {
  id: "demo-student",
  name: "Test Student",
  role: "STUDENT",
  identifier: "510423243001",
  registerNumber: "510423243001",
  department: department.name,
  departmentCode: department.code,
  year: department.batch,
};

export const demoUsers: Record<Exclude<Role, "STUDENT">, User> = {
  COUNSELLOR: {
    id: "demo-counsellor",
    name: "Counsellor Demo",
    role: "COUNSELLOR",
    identifier: "9999900101",
    department: "Academic Office · Demo",
    departmentCode: department.code,
    year: "Staff",
  },
  HOD: {
    id: "demo-hod",
    name: "HOD Demo",
    role: "HOD",
    identifier: "9999900102",
    department: department.name,
    departmentCode: department.code,
    year: "Staff",
  },
  ADMIN: {
    id: "demo-admin",
    name: "Admin Demo",
    role: "ADMIN",
    identifier: "9999900103",
    department: "Administration · Demo",
    year: "Staff",
  },
};

export const demoAttendanceSummary: AttendanceSummary = {
  percentage: 93.73,
  attendedHours: 299,
  totalHours: 319,
};

export const demoStudentDashboardDetails = {
  batch: department.batch,
  department: department.name,
  attendancePercentage: "93.73%",
  attendanceStatus: "Eligible",
  attendanceDate: "03-10-2026",
};

export const demoTodayAttendance: DashboardAttendanceHour[] = Array.from(
  { length: 7 },
  (_, index) => ({ hour: index + 1, value: "---" }),
);

export const demoDashboardSubjectMarks: DashboardSubjectMark[] = [
  {
    code: "AI3021",
    subject: "IT in Agricultural System",
    cia1: 45,
    asmt1: 20,
    cia2: 37,
    asmt2: 20,
    model: "-",
  },
  {
    code: "CME365",
    subject: "Renewable Energy Technologies",
    cia1: 48,
    asmt1: 20,
    cia2: 48,
    asmt2: 20,
    model: "-",
  },
  {
    code: "GE3752",
    subject: "Total Quality Management",
    cia1: 49,
    asmt1: 20,
    cia2: 47,
    asmt2: 20,
    model: "-",
  },
  {
    code: "GE3791",
    subject: "Human Values and Ethics",
    cia1: 38,
    asmt1: 20,
    cia2: 50,
    asmt2: 20,
    model: "-",
  },
  {
    code: "OBT357",
    subject: "Biotechnology in Healthcare",
    cia1: 47,
    asmt1: 20,
    cia2: 41,
    asmt2: 20,
    model: "-",
  },
];

export const demoWeekAttendance: HourAttendance[] = [
  { date: "2026-09-28", day: "Monday", hour: 1, subject: "Mathematics", status: "PRESENT" },
  { date: "2026-09-28", day: "Monday", hour: 2, subject: "Data Structures", status: "PRESENT" },
  { date: "2026-09-29", day: "Tuesday", hour: 1, subject: "Physics", status: "ABSENT" },
  { date: "2026-09-29", day: "Tuesday", hour: 2, subject: "Programming", status: "PRESENT" },
  { date: "2026-09-30", day: "Wednesday", hour: 1, subject: "Mathematics", status: "PRESENT" },
  { date: "2026-09-30", day: "Wednesday", hour: 2, subject: "English", status: "PRESENT" },
  { date: "2026-10-01", day: "Thursday", hour: 1, subject: "Data Structures", status: "PRESENT" },
  { date: "2026-10-01", day: "Thursday", hour: 2, subject: "Physics", status: "ABSENT" },
  { date: "2026-10-02", day: "Friday", hour: 1, subject: "Programming", status: "PRESENT" },
  { date: "2026-10-02", day: "Friday", hour: 2, subject: "Mathematics", status: "PRESENT" },
];

export const demoSubjectMarks: SubjectMark[] = [
  { subject: "Mathematics", code: "DEMO101", internal: 42, internalMaximum: 50, semester: 1 },
  { subject: "Data Structures", code: "DEMO102", internal: 39, internalMaximum: 50, semester: 1 },
  { subject: "Physics", code: "DEMO103", internal: 44, internalMaximum: 50, semester: 1 },
  { subject: "Programming", code: "DEMO104", internal: 46, internalMaximum: 50, semester: 1 },
];

export const demoTimetable: TimetableEntry[] = [
  { day: "Monday", period: 1, subject: "Mathematics", room: "Demo room 101" },
  {
    day: "Monday",
    period: 2,
    subject: "Data Structures",
    room: "Demo room 102",
  },
  { day: "Monday", period: 3, subject: "Programming", room: "Demo lab 1" },
  { day: "Monday", period: 4, subject: "Physics", room: "Demo room 103" },
  { day: "Tuesday", period: 1, subject: "Physics", room: "Demo room 103" },
  { day: "Tuesday", period: 2, subject: "Mathematics", room: "Demo room 101" },
  { day: "Tuesday", period: 3, subject: "English", room: "Demo room 104" },
  {
    day: "Tuesday",
    period: 4,
    subject: "Data Structures",
    room: "Demo room 102",
  },
  { day: "Wednesday", period: 1, subject: "Programming", room: "Demo lab 1" },
  { day: "Wednesday", period: 2, subject: "Physics", room: "Demo room 103" },
  {
    day: "Wednesday",
    period: 3,
    subject: "Data Structures",
    room: "Demo room 102",
  },
  {
    day: "Wednesday",
    period: 4,
    subject: "Mathematics",
    room: "Demo room 101",
  },
  { day: "Thursday", period: 1, subject: "English", room: "Demo room 104" },
  {
    day: "Thursday",
    period: 2,
    subject: "Data Structures",
    room: "Demo room 102",
  },
  { day: "Thursday", period: 3, subject: "Physics", room: "Demo room 103" },
  { day: "Thursday", period: 4, subject: "Programming", room: "Demo lab 1" },
  {
    day: "Friday",
    period: 1,
    subject: "Data Structures",
    room: "Demo room 102",
  },
  {
    day: "Friday",
    period: 2,
    subject: "Programming",
    room: "Demo lab 1",
  },
  { day: "Friday", period: 3, subject: "Mathematics", room: "Demo room 101" },
  { day: "Friday", period: 4, subject: "English", room: "Demo room 104" },
];

export const demoSemesterResults: SemesterResult[] = [
  { semester: 1, gpa: 8.2, marks: demoSubjectMarks },
  {
    semester: 2,
    gpa: 8.5,
    marks: [
      { subject: "Algorithms", code: "DEMO201", internal: 41, internalMaximum: 50, semester: 2 },
      {
        subject: "Computer Systems",
        code: "DEMO202",
        internal: 43,
        internalMaximum: 50,
        semester: 2,
      },
      { subject: "Statistics", code: "DEMO203", internal: 40, internalMaximum: 50, semester: 2 },
    ],
  },
  {
    semester: 3,
    gpa: 8.1,
    marks: [
      { subject: "Networks", code: "DEMO301", internal: 38, internalMaximum: 50, semester: 3 },
      {
        subject: "Database Systems",
        code: "DEMO302",
        internal: 45,
        internalMaximum: 50,
        semester: 3,
      },
      {
        subject: "Software Design",
        code: "DEMO303",
        internal: 42,
        internalMaximum: 50,
        semester: 3,
      },
    ],
  },
  {
    semester: 4,
    gpa: 8.4,
    marks: [
      {
        subject: "Operating Systems",
        code: "DEMO401",
        internal: 44,
        internalMaximum: 50,
        semester: 4,
      },
      {
        subject: "Web Technologies",
        code: "DEMO402",
        internal: 41,
        internalMaximum: 50,
        semester: 4,
      },
      {
        subject: "Data Analytics",
        code: "DEMO403",
        internal: 39,
        internalMaximum: 50,
        semester: 4,
      },
    ],
  },
];

export const demoFees: FeeRecord[] = [
  { item: "Tuition fee · Demo", semester: 4, amount: 48_000, paid: 30_000, dueDate: "2026-10-15" },
  {
    item: "Library fee · Demo",
    semester: 4,
    amount: 2_000,
    paid: 2_000,
    dueDate: "2026-09-15",
  },
  {
    item: "Laboratory fee · Demo",
    semester: 4,
    amount: 8_000,
    paid: 5_000,
    dueDate: "2026-10-15",
  },
  {
    item: "Student services · Demo",
    semester: 4,
    amount: 3_000,
    paid: 0,
    dueDate: "2026-10-15",
  },
];

export function getDemoUser(role: Role): User {
  return role === "STUDENT" ? demoStudent : demoUsers[role];
}
