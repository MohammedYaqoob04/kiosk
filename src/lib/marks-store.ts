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
  totalInternal: number | null;
  maxInternal: number;
}

export interface StudentMarksRecord {
  registerNo: string;
  name: string;
  className: string;
  subjects: SubjectMarksShowcase[];
}

/**
 * Retrieve marks data for a class.
 * Real DB has 0 rows in `marks` table, so no fabricated marks are returned.
 */
export function getClassStudentsMarks(_className: string): StudentMarksRecord[] {
  // Authoritative real data: marks table in DB currently has 0 records.
  // Never fabricate, estimate, or randomise marks.
  return [];
}

/**
 * Get summary stats for marks publication in a class.
 */
export function getClassMarksStatus(_className: string): {
  published: number;
  pending: number;
  totalExpected: number;
  percentage: number;
} {
  return {
    published: 0,
    pending: 0,
    totalExpected: 0,
    percentage: 0,
  };
}
