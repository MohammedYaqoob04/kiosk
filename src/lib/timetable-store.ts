import type { TimetableDay, TimetableSlot, TimetableWeekDay } from "@/api/types";

const TIMETABLE_STORAGE_KEY = "kiosk-class-timetables";
const EVENT_NAME = "kiosk-timetable-updated";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export interface StoredClassTimetable {
  className: string;
  hall: string;
  days: TimetableWeekDay[];
  isCustom?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

// Default schedule for Class III-A
const defaultScheduleIIIA: TimetableSlot[] = [
  { hour: 1, period: 1, time: "09:20 - 10:10", startTime: "09:20", endTime: "10:10", subjectCode: "A13021", subjectName: "IT in Agricultural System", staffName: "Mrs. V. Anitha", room: "C14" },
  { hour: 2, period: 2, time: "10:10 - 11:00", startTime: "10:10", endTime: "11:00", subjectCode: "CME365", subjectName: "Renewable Energy Technologies", staffName: "Mr. E. Prakash", room: "C14" },
  { hour: 3, period: 3, time: "11:20 - 12:10", startTime: "11:20", endTime: "12:10", subjectCode: "GE3752", subjectName: "Total Quality Management", staffName: "Mr. R. Senthil", room: "C14" },
  { hour: 4, period: 4, time: "12:10 - 13:00", startTime: "12:10", endTime: "13:00", subjectCode: "GE3791", subjectName: "Human Values and Ethics", staffName: "Ms. T. Subathra", room: "C14" },
  { hour: 5, period: 5, time: "13:50 - 14:40", startTime: "13:50", endTime: "14:40", subjectCode: "OBT357", subjectName: "Biotechnology in Healthcare", staffName: "Ms. N. Rithi Priyanka", room: "C14" },
  { hour: 6, period: 6, time: "14:40 - 15:30", startTime: "14:40", endTime: "15:30", subjectCode: "SKILL", subjectName: "Skill Development", staffName: "Faculty Demo", room: "C14" },
];

// Default schedule for Class II-A
const defaultScheduleIIA: TimetableSlot[] = [
  { hour: 1, period: 1, time: "09:20 - 10:10", startTime: "09:20", endTime: "10:10", subjectCode: "CS3451", subjectName: "Data Structures and Algorithms", staffName: "Dr. S. Ramesh", room: "B08" },
  { hour: 2, period: 2, time: "10:10 - 11:00", startTime: "10:10", endTime: "11:00", subjectCode: "CS3452", subjectName: "Database Management Systems", staffName: "Mrs. K. Priya", room: "B08" },
  { hour: 3, period: 3, time: "11:20 - 12:10", startTime: "11:20", endTime: "12:10", subjectCode: "MA3354", subjectName: "Discrete Mathematics", staffName: "Mr. A. Selvam", room: "B08" },
  { hour: 4, period: 4, time: "12:10 - 13:00", startTime: "12:10", endTime: "13:00", subjectCode: "CS3491", subjectName: "Operating Systems", staffName: "Dr. M. Deepa", room: "B08" },
  { hour: 5, period: 5, time: "13:50 - 14:40", startTime: "13:50", endTime: "14:40", subjectCode: "CS3492", subjectName: "Software Engineering", staffName: "Mr. V. Vijay", room: "B08" },
  { hour: 6, period: 6, time: "14:40 - 15:30", startTime: "14:40", endTime: "15:30", subjectCode: "LAB34", subjectName: "DBMS Laboratory", staffName: "Mrs. K. Priya", room: "Lab 2" },
];

// Default schedule for Class IV-A
const defaultScheduleIVA: TimetableSlot[] = [
  { hour: 1, period: 1, time: "09:20 - 10:10", startTime: "09:20", endTime: "10:10", subjectCode: "AI3701", subjectName: "Deep Learning & Neural Networks", staffName: "Dr. Kumar", room: "A21" },
  { hour: 2, period: 2, time: "10:10 - 11:00", startTime: "10:10", endTime: "11:00", subjectCode: "AI3702", subjectName: "Natural Language Processing", staffName: "Mrs. S. Radhika", room: "A21" },
  { hour: 3, period: 3, time: "11:20 - 12:10", startTime: "11:20", endTime: "12:10", subjectCode: "CS3791", subjectName: "Cloud Computing & DevOps", staffName: "Mr. P. Balaji", room: "A21" },
  { hour: 4, period: 4, time: "12:10 - 13:00", startTime: "12:10", endTime: "13:00", subjectCode: "MG3751", subjectName: "Principles of Management", staffName: "Dr. R. Raman", room: "A21" },
  { hour: 5, period: 5, time: "13:50 - 14:40", startTime: "13:50", endTime: "14:40", subjectCode: "PROJ", subjectName: "Capstone Project Review", staffName: "Dr. Kumar", room: "Seminar Hall" },
  { hour: 6, period: 6, time: "14:40 - 15:30", startTime: "14:40", endTime: "15:30", subjectCode: "PROJ", subjectName: "Capstone Project Review", staffName: "Dr. Kumar", room: "Seminar Hall" },
];

function buildWeekDays(hall: string, hours: TimetableSlot[]): TimetableWeekDay[] {
  return WEEKDAYS.map((dayName, index) => ({
    dayName,
    weekday: index,
    hall,
    hours: index === 5 ? [] : structuredClone(hours),
  }));
}

const DEFAULT_TIMETABLES: Record<string, StoredClassTimetable> = {
  "III-A": {
    className: "III-A",
    hall: "C14",
    days: buildWeekDays("C14", defaultScheduleIIIA),
    isCustom: false,
  },
  "II-A": {
    className: "II-A",
    hall: "B08",
    days: buildWeekDays("B08", defaultScheduleIIA),
    isCustom: false,
  },
  "IV-A": {
    className: "IV-A",
    hall: "A21",
    days: buildWeekDays("A21", defaultScheduleIVA),
    isCustom: false,
  },
};

function readTimetableStorage(): Record<string, StoredClassTimetable> {
  if (typeof window === "undefined") return { ...DEFAULT_TIMETABLES };
  try {
    const raw = window.localStorage.getItem(TIMETABLE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, StoredClassTimetable>;
      if (parsed && typeof parsed === "object") {
        return { ...DEFAULT_TIMETABLES, ...parsed };
      }
    }
  } catch (e) {
    console.error("Failed to read class timetables:", e);
  }
  return { ...DEFAULT_TIMETABLES };
}

function writeTimetableStorage(data: Record<string, StoredClassTimetable>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch (e) {
    console.error("Failed to save class timetables:", e);
  }
}

/**
 * Get authoritative timetable for a specific class.
 */
export function getClassTimetable(className = "III-A", date?: string): TimetableDay {
  const store = readTimetableStorage();
  const classData = store[className] ?? store["III-A"] ?? DEFAULT_TIMETABLES["III-A"]!;

  const now = new Date();
  const dateValue =
    date ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const localDate = new Date(`${dateValue}T00:00:00`);
  const weekday = localDate.getDay();

  // Find today's hours from the class days array
  const todayEntry = classData.days.find(
    (d) => d.dayName.toLowerCase() === new Intl.DateTimeFormat("en", { weekday: "long" }).format(localDate).toLowerCase(),
  );

  return {
    date: dateValue,
    dayName: new Intl.DateTimeFormat("en", { weekday: "long" }).format(localDate),
    hall: classData.hall,
    hours: weekday === 0 || weekday === 6 ? [] : (todayEntry?.hours ?? []),
    days: classData.days,
    className,
    isCustom: Boolean(classData.isCustom),
  };
}

/**
 * Save / Upload updated timetable for a class.
 */
export function saveClassTimetable(
  className: string,
  hall: string,
  days: TimetableWeekDay[],
  author = "Staff",
): void {
  const store = readTimetableStorage();
  store[className] = {
    className,
    hall,
    days,
    isCustom: true,
    updatedAt: new Date().toISOString(),
    updatedBy: author,
  };
  writeTimetableStorage(store);
}

/**
 * Check if a custom uploaded/edited timetable exists for a class.
 */
export function hasCustomTimetable(className: string): boolean {
  const store = readTimetableStorage();
  return Boolean(store[className]?.isCustom);
}

/**
 * Revert class timetable back to system default.
 */
export function resetClassTimetable(className: string): void {
  const store = readTimetableStorage();
  if (DEFAULT_TIMETABLES[className]) {
    store[className] = structuredClone(DEFAULT_TIMETABLES[className]);
  } else {
    delete store[className];
  }
  writeTimetableStorage(store);
}

/**
 * Listen for changes in the authoritative timetable store.
 */
export function subscribeToTimetableUpdates(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}
