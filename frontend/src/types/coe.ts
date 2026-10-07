export type CoeNoticeCategory = "Exams" | "Results" | "Circulars";

export interface CoeNotice {
  id: string;
  date: string;
  title: string;
  description: string;
  category: CoeNoticeCategory;
}

export interface CoeExamScheduleItem {
  id: string;
  title: string;
  date: string;
}
