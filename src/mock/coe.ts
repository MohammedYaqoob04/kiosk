import type { CoeExamScheduleItem, CoeNotice } from "@/types/coe";

export const demoCoeNotices: CoeNotice[] = [
  {
    id: "notice-exams-demo",
    date: "-- add from COE",
    title: "Examination schedule update",
    description: "Sample examination notice for demonstration.",
    category: "Exams",
  },
  {
    id: "notice-results-demo",
    date: "-- add from COE",
    title: "University results update",
    description: "Sample results notice for demonstration.",
    category: "Results",
  },
  {
    id: "notice-circular-demo",
    date: "-- add from COE",
    title: "Controller of Examinations circular",
    description: "Sample circular for demonstration.",
    category: "Circulars",
  },
];

export const demoCoeExamSchedule: CoeExamScheduleItem[] = [
  {
    id: "schedule-current-demo",
    title: "Examination timetable",
    date: "-- add from COE",
  },
  {
    id: "schedule-notice-demo",
    title: "Additional examination notice",
    date: "-- add from COE",
  },
];
