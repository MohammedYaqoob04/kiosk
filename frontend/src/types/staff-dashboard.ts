export interface AssignedStudent {
  name: string;
  registerNo: string;
  department: string;
  departmentCode: string;
  attendancePercentage: number | null;
  assignedCounsellorId: string | null;
  batch: string;
  programme: string;
  course: string;
  semester: number;
  year: number;
  section: string | null;
  mobile: string;
  parentMobile?: string;
  fatherMobile?: string;
  motherMobile?: string;
  email: string;
  gender: string;
  className?: string;
  leaveCount?: number;
  pendingCount?: number;
}

export interface DepartmentCounsellor {
  id: string;
  name: string;
  staffId: string;
  department: string;
  departmentCode: string;
}
