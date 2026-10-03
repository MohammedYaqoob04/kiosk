import type { AssignedStudent, DepartmentCounsellor } from "@/types/staff-dashboard";

export const demoAssignedStudents: AssignedStudent[] = [
  {
    name: "Aarav Placeholder",
    registerNo: "9999900001",
    department: "AIDS / A",
    attendancePercentage: 93.73,
    assignedCounsellorId: "9999900101",
  },
  {
    name: "Meera Sample",
    registerNo: "9999900002",
    department: "AIDS / A",
    attendancePercentage: 88.4,
    assignedCounsellorId: "9999900101",
  },
  {
    name: "Kavin Example",
    registerNo: "9999900003",
    department: "AIDS / A",
    attendancePercentage: 90.2,
    assignedCounsellorId: "9999900101",
  },
  {
    name: "Tara Example",
    registerNo: "9999900004",
    department: "AIDS / A",
    attendancePercentage: 95.1,
    assignedCounsellorId: "9999900102",
  },
  {
    name: "Nila Sample",
    registerNo: "9999900005",
    department: "AIDS / A",
    attendancePercentage: 89.8,
    assignedCounsellorId: "9999900102",
  },
  {
    name: "Dev Placeholder",
    registerNo: "9999900006",
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
