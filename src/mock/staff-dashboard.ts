import type { AssignedStudent, DepartmentCounsellor } from "@/types/staff-dashboard";

export const demoAssignedStudents: AssignedStudent[] = [
  {
    name: "Sample Student",
    registerNo: "510000000001",
    department: "AIDS / A",
    attendancePercentage: 93.73,
    assignedCounsellorId: "9999900101",
  },
  {
    name: "Sample Student",
    registerNo: "510000000002",
    department: "AIDS / A",
    attendancePercentage: 88.4,
    assignedCounsellorId: "9999900101",
  },
  {
    name: "Sample Student",
    registerNo: "510000000003",
    department: "AIDS / A",
    attendancePercentage: 90.2,
    assignedCounsellorId: "9999900101",
  },
  {
    name: "Sample Student",
    registerNo: "510000000004",
    department: "AIDS / A",
    attendancePercentage: 95.1,
    assignedCounsellorId: "9999900102",
  },
  {
    name: "Sample Student",
    registerNo: "510000000005",
    department: "AIDS / A",
    attendancePercentage: 89.8,
    assignedCounsellorId: "9999900102",
  },
  {
    name: "Sample Student",
    registerNo: "510000000006",
    department: "Mechanical · Demo",
    attendancePercentage: 86.5,
    assignedCounsellorId: "9999900103",
  },
];

export const demoDepartmentCounsellors: DepartmentCounsellor[] = [
  {
    id: "counsellor-demo-1",
    name: "Counsellor Demo One",
    staffId: "9999900101",
    department: "AIDS / A",
  },
  {
    id: "counsellor-demo-2",
    name: "Counsellor Demo Two",
    staffId: "9999900102",
    department: "AIDS / A",
  },
  {
    id: "counsellor-demo-3",
    name: "Counsellor Demo Three",
    staffId: "9999900103",
    department: "Mechanical · Demo",
  },
];
