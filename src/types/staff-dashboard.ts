export interface AssignedStudent {
  name: string;
  registerNo: string;
  department: string;
  attendancePercentage: number;
  assignedCounsellorId: string;
  batch: string;
  programme: string;
  course: string;
  semester: number;
  year: number;
  section: string;
  mobile: string;
  email: string;
  gender: string;
}

export interface DepartmentCounsellor {
  id: string;
  name: string;
  staffId: string;
  department: string;
}
