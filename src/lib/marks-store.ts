import { demoAssignedStudents } from "@/mock/staff-dashboard";
import { mockRegisteredSubjects } from "@/api/mock/data";

export interface AssessmentItem {
  name: string;
  maxMarks: number;
  obtainedMarks: number | null;
}

export interface SubjectMarksShowcase {
  code: string;
  name: string;
  credits: number;
  assignments: {
    asmt1: AssessmentItem;
    asmt2: AssessmentItem;
    asmt3: AssessmentItem;
  };
  cia: {
    cia1: AssessmentItem;
    cia2: AssessmentItem;
  };
  modelExam: AssessmentItem;
  totalInternal: number;
  maxInternal: number;
}

export interface StudentMarksRecord {
  registerNo: string;
  name: string;
  className: string;
  subjects: SubjectMarksShowcase[];
}

// Deterministic mark calculation based on student regNo and subject code
function generateConsistentMarks(
  regNo: string,
  subjectCode: string,
  subjectName: string,
  credits: number,
): SubjectMarksShowcase {
  // Use char codes for deterministic values that don't invent random numbers on each render
  const seed = regNo
    .split("")
    .reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 1), 0);
  const codeSeed = subjectCode
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const combined = (seed + codeSeed) % 100;

  // Grade tier: 0..100
  // Performance offset between 70% and 95%
  const factor = 0.7 + (combined / 100) * 0.26;

  const asmt1Score = Math.min(20, Math.round(20 * factor));
  const asmt2Score = Math.min(20, Math.round(19 * factor));
  const asmt3Score = Math.min(40, Math.round(38 * factor));

  const cia1Score = Math.min(60, Math.round(58 * factor));
  const cia2Score = Math.min(60, Math.round(56 * factor));

  const modelScore = Math.min(100, Math.round(92 * factor));

  // Scaled 100-point equivalent
  const totalInternal = Math.round(
    asmt1Score + asmt2Score + asmt3Score * 0.5 + cia1Score * 0.25 + cia2Score * 0.25,
  );

  return {
    code: subjectCode,
    name: subjectName,
    credits,
    assignments: {
      asmt1: {
        name: "Assignment 1",
        maxMarks: 20,
        obtainedMarks: asmt1Score,
      },
      asmt2: {
        name: "Assignment 2",
        maxMarks: 20,
        obtainedMarks: asmt2Score,
      },
      asmt3: {
        name: "Assignment 3",
        maxMarks: 40,
        obtainedMarks: asmt3Score,
      },
    },
    cia: {
      cia1: {
        name: "CIA 1",
        maxMarks: 60,
        obtainedMarks: cia1Score,
      },
      cia2: {
        name: "CIA 2",
        maxMarks: 60,
        obtainedMarks: cia2Score,
      },
    },
    modelExam: {
      name: "Model Exam",
      maxMarks: 100,
      obtainedMarks: modelScore,
    },
    totalInternal,
    maxInternal: 100,
  };
}

/**
 * Get marks showcase for a specific student.
 */
export function getStudentMarksShowcase(registerNo: string): StudentMarksRecord | null {
  const student = demoAssignedStudents.find((s) => s.registerNo === registerNo);
  if (!student) return null;

  const subjects = mockRegisteredSubjects.map((sub) =>
    generateConsistentMarks(registerNo, sub.code, sub.title, sub.credits),
  );

  return {
    registerNo: student.registerNo,
    name: student.name,
    className: student.className ?? "III-A",
    subjects,
  };
}

/**
 * Get all students' marks records for a selected class.
 */
export function getClassStudentsMarks(className = "III-A"): StudentMarksRecord[] {
  const students = demoAssignedStudents.filter(
    (s) => (s.className ?? "III-A") === className,
  );

  return students.map((student) => {
    const subjects = mockRegisteredSubjects.map((sub) =>
      generateConsistentMarks(student.registerNo, sub.code, sub.title, sub.credits),
    );
    return {
      registerNo: student.registerNo,
      name: student.name,
      className,
      subjects,
    };
  });
}

/**
 * Get class marks summary status for the staff dashboard widget.
 */
export function getClassMarksStatus(className = "III-A"): {
  totalStudents: number;
  subjectsCount: number;
  asmtSubmittedPercent: number;
  ciaSubmittedPercent: number;
  modelExamStatus: string;
} {
  const students = demoAssignedStudents.filter(
    (s) => (s.className ?? "III-A") === className,
  );
  return {
    totalStudents: students.length,
    subjectsCount: mockRegisteredSubjects.length,
    asmtSubmittedPercent: 100,
    ciaSubmittedPercent: 100,
    modelExamStatus: "Completed",
  };
}
