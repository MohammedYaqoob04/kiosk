export interface AssignedStudent {
  name: string;
  registerNo: string;
  department: string;
  attendancePercentage: number;
  assignedCounsellorId: string;
}

export interface DepartmentCounsellor {
  id: string;
  name: string;
  staffId: string;
  department: string;
}
