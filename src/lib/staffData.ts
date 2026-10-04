import { department } from "@/config/department";
import { appendAudit } from "@/lib/auditLog";

export const ATTENDANCE_MIN = 75;
export const DEMO_COUNSELLOR_ID = "demo-counsellor";
export const SECOND_COUNSELLOR_ID = "counsellor-2";
export const STAFF_DATA_STORAGE_KEY = "arunai-erp-staff-data";
const LEGACY_ASSIGNMENT_KEYS = ["arunai-erp-staff-assignments"];

export interface StaffStudent {
  regNo: string;
  name: string;
  section: "A" | "B";
  semester: 7;
  attendancePercentage: number;
  departmentCode: string;
}

export interface CounsellorOption {
  id: string;
  name: string;
}

const students: readonly StaffStudent[] = Array.from({ length: 12 }, (_, index) => ({
  regNo: `510423243${String(index + 1).padStart(3, "0")}`,
  name: `Student ${String(index + 1).padStart(2, "0")}`,
  section: index < 6 ? "A" : "B",
  semester: 7,
  attendancePercentage: [68, 72, 74, 81, 88, 77, 75, 93, 79, 85, 90, 82][index] ?? 75,
  departmentCode: department.code,
}));

export const counsellors: readonly CounsellorOption[] = [
  { id: DEMO_COUNSELLOR_ID, name: "Counsellor Demo" },
  { id: SECOND_COUNSELLOR_ID, name: "Counsellor 2" },
];

type AssignmentMap = Record<string, string[]>;
const defaultAssignments: AssignmentMap = {
  [DEMO_COUNSELLOR_ID]: students.slice(0, 6).map(({ regNo }) => regNo),
  [SECOND_COUNSELLOR_ID]: students.slice(6).map(({ regNo }) => regNo),
};

function isAssignmentMap(value: unknown): value is AssignmentMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const assigned = Object.values(value);
  return (
    assigned.every(
      (regNos) =>
        Array.isArray(regNos) &&
        regNos.every(
          (regNo) => typeof regNo === "string" && students.some((student) => student.regNo === regNo),
        ),
    ) &&
    new Set(assigned.flat()).size === assigned.flat().length
  );
}

function copyDefaults(): AssignmentMap {
  return Object.fromEntries(
    Object.entries(defaultAssignments).map(([id, regNos]) => [id, [...regNos]]),
  );
}

function readAssignments(): AssignmentMap {
  if (typeof window === "undefined") return copyDefaults();
  try {
    const saved = window.localStorage.getItem(STAFF_DATA_STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (!isAssignmentMap(parsed)) {
        throw new Error("Saved staff assignments have an invalid format.");
      }
      return parsed;
    }

    for (const legacyKey of LEGACY_ASSIGNMENT_KEYS) {
      const legacy = window.localStorage.getItem(legacyKey);
      if (!legacy) continue;
      const parsed: unknown = JSON.parse(legacy);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
      const old = parsed as Record<string, unknown>;
      const legacyCounsellorRegNos = old["9999900101"];
      const migrated = copyDefaults();
      if (
        Array.isArray(legacyCounsellorRegNos) &&
        legacyCounsellorRegNos.every(
          (regNo): regNo is string =>
            typeof regNo === "string" && students.some((student) => student.regNo === regNo),
        )
      ) {
        migrated[DEMO_COUNSELLOR_ID] = legacyCounsellorRegNos;
        const assigned = new Set(legacyCounsellorRegNos);
        migrated[SECOND_COUNSELLOR_ID] = students
          .slice(6)
          .map(({ regNo }) => regNo)
          .filter((regNo) => !assigned.has(regNo));
      }
      window.localStorage.setItem(STAFF_DATA_STORAGE_KEY, JSON.stringify(migrated));
      window.localStorage.removeItem(legacyKey);
      return migrated;
    }
    return copyDefaults();
  } catch (error) {
    console.error("Unable to read saved staff assignments.", error);
    return copyDefaults();
  }
}

let assignments = readAssignments();

function saveAssignments(next: AssignmentMap): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STAFF_DATA_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Unable to save staff assignments.", error);
      throw new Error("Student assignments could not be saved.");
    }
  }
  assignments = next;
}

export function listStudents(counsellorId: string): StaffStudent[] {
  const assigned = new Set(assignments[counsellorId] ?? []);
  return students.filter(({ regNo }) => assigned.has(regNo));
}

export function listAllStudents(): StaffStudent[] {
  return [...students];
}

export function getStudentSummary(regNo: string): StaffStudent | null {
  return students.find((student) => student.regNo === regNo) ?? null;
}

export function counsellorOf(regNo: string): string | null {
  return Object.entries(assignments).find(([, regNos]) => regNos.includes(regNo))?.[0] ?? null;
}

export function assignStudents(counsellorId: string, regNos: string[]): void {
  if (!counsellors.some((counsellor) => counsellor.id === counsellorId)) {
    throw new Error("Choose a valid counsellor.");
  }
  if (!regNos.every((regNo) => students.some((student) => student.regNo === regNo))) {
    throw new Error("One or more register numbers are invalid.");
  }
  const uniqueRegNos = [...new Set(regNos)];
  const next = Object.fromEntries(
    Object.entries(assignments).map(([id, assignedRegNos]) => [
      id,
      assignedRegNos.filter((regNo) => !uniqueRegNos.includes(regNo)),
    ]),
  );
  next[counsellorId] = [...new Set([...(next[counsellorId] ?? []), ...uniqueRegNos])];
  saveAssignments(next);
  for (const regNo of uniqueRegNos) {
    appendAudit({
      actor: "HOD Demo",
      role: "HOD",
      action: "STUDENT_ASSIGN",
      targetId: regNo,
      reason: `Assigned to ${counsellorId}.`,
    });
  }
}

export function assignSection(counsellorId: string, section: "A" | "B"): void {
  assignStudents(
    counsellorId,
    students.filter((student) => student.section === section).map(({ regNo }) => regNo),
  );
}

export function unassign(regNo: string): void {
  const priorCounsellor = counsellorOf(regNo);
  const next = Object.fromEntries(
    Object.entries(assignments).map(([id, assignedRegNos]) => [
      id,
      assignedRegNos.filter((assignedRegNo) => assignedRegNo !== regNo),
    ]),
  );
  saveAssignments(next);
  if (priorCounsellor) {
    appendAudit({
      actor: "HOD Demo",
      role: "HOD",
      action: "STUDENT_UNASSIGN",
      targetId: regNo,
      reason: `Removed from ${priorCounsellor}.`,
    });
  }
}
