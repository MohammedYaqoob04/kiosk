export type Role = "STUDENT" | "COUNSELLOR" | "HOD" | "ADMIN";

export interface User {
  id: string;
  name: string;
  role: Role;
  identifier: string;
  department: string;
  departmentCode?: string;
  year: string;
  mustChangePassword?: boolean;
}

export interface Student extends User {
  role: "STUDENT";
  registerNumber: string;
}

export interface AttendanceSummary {
  percentage: number;
  attendedHours: number;
  totalHours: number;
}

export interface HourAttendance {
  date: string;
  day: string;
  hour: number;
  subject: string;
  status: "PRESENT" | "ABSENT";
}

export interface SubjectMark {
  subject: string;
  code: string;
  internal: number;
  internalMaximum: number;
  semester: number;
}

export interface TimetableEntry {
  day: string;
  period: number;
  subject: string;
  room: string;
}

export interface SemesterResult {
  semester: number;
  gpa: number;
  marks: SubjectMark[];
}

export interface FeeRecord {
  item: string;
  semester: number;
  amount: number;
  paid: number;
  dueDate: string;
}

export interface DashboardAttendanceHour {
  hour: number;
  value: string;
}

export interface DashboardSubjectMark {
  code: string;
  subject: string;
  cia1: number;
  asmt1: number;
  cia2: number;
  asmt2: number;
  model: string;
}
