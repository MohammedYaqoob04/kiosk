import type { TimetableDay, TimetableSlot, TimetableWeekDay } from "@/api/types";
import { api } from "@/api";

const TIMETABLE_STORAGE_KEY = "kiosk-class-timetables";
const EVENT_NAME = "kiosk-timetable-updated";

export interface StoredClassTimetable {
  className: string;
  hall: string;
  days: TimetableWeekDay[];
  isCustom?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

// Authoritative Semester 7 (Year 4) timetable from the database
const realScheduleYear4: TimetableWeekDay[] = [
  {
    dayName: "Monday",
    weekday: 0,
    hall: "C14",
    hours: [
      { hour: 1, period: 1, time: "09:20 - 10:10", startTime: "09:20", endTime: "10:10", subjectCode: null, subjectName: "Skill Development", staffName: null, room: "C14", isFree: false },
      { hour: 3, period: 3, time: "11:20 - 12:10", startTime: "11:20", endTime: "12:10", subjectCode: "OBT357", subjectName: "Biotechnology in Healthcare", staffName: "Ms. N. Rithi Priyanka", room: "C14", isFree: false },
      { hour: 4, period: 4, time: "12:10 - 13:00", startTime: "12:10", endTime: "13:00", subjectCode: "GE3752", subjectName: "Total Quality Management", staffName: "Mr. R. Senthil", room: "C14", isFree: false },
      { hour: 5, period: 5, time: "13:50 - 14:40", startTime: "13:50", endTime: "14:40", subjectCode: "GE3752", subjectName: "Total Quality Management", staffName: "Mr. R. Senthil", room: "C14", isFree: false },
      { hour: 6, period: 6, time: "14:40 - 15:30", startTime: "14:40", endTime: "15:30", subjectCode: "CME365", subjectName: "Renewable Energy Technologies", staffName: "Mr. E. Prakash", room: "C14", isFree: false },
      { hour: 7, period: 7, time: "15:30 - 16:20", startTime: "15:30", endTime: "16:20", subjectCode: "AI3021", subjectName: "IT in Agricultural System", staffName: "Mrs. V. Anitha", room: "C14", isFree: false },
    ],
  },
  {
    dayName: "Tuesday",
    weekday: 1,
    hall: "C14",
    hours: [
      { hour: 1, period: 1, time: "09:20 - 10:10", startTime: "09:20", endTime: "10:10", subjectCode: "GE3752", subjectName: "Total Quality Management", staffName: "Mr. R. Senthil", room: "C14", isFree: false },
      { hour: 2, period: 2, time: "10:10 - 11:00", startTime: "10:10", endTime: "11:00", subjectCode: "CME365", subjectName: "Renewable Energy Technologies", staffName: "Mr. E. Prakash", room: "C14", isFree: false },
      { hour: 3, period: 3, time: "11:20 - 12:10", startTime: "11:20", endTime: "12:10", subjectCode: null, subjectName: "Skill Development", staffName: null, room: "C14", isFree: false },
      { hour: 5, period: 5, time: "13:50 - 14:40", startTime: "13:50", endTime: "14:40", subjectCode: "OBT357", subjectName: "Biotechnology in Healthcare", staffName: "Ms. N. Rithi Priyanka", room: "C14", isFree: false },
      { hour: 6, period: 6, time: "14:40 - 15:30", startTime: "14:40", endTime: "15:30", subjectCode: "GE3791", subjectName: "Human Values and Ethics", staffName: "Ms. T. Subathra", room: "C14", isFree: false },
      { hour: 7, period: 7, time: "15:30 - 16:20", startTime: "15:30", endTime: "16:20", subjectCode: "GE3752", subjectName: "Total Quality Management", staffName: "Mr. R. Senthil", room: "C14", isFree: false },
    ],
  },
  {
    dayName: "Wednesday",
    weekday: 2,
    hall: "C14",
    hours: [
      { hour: 1, period: 1, time: "09:20 - 10:10", startTime: "09:20", endTime: "10:10", subjectCode: "GE3791", subjectName: "Human Values and Ethics", staffName: "Ms. T. Subathra", room: "C14", isFree: false },
      { hour: 2, period: 2, time: "10:10 - 11:00", startTime: "10:10", endTime: "11:00", subjectCode: "AI3021", subjectName: "IT in Agricultural System", staffName: "Mrs. V. Anitha", room: "C14", isFree: false },
      { hour: 3, period: 3, time: "11:20 - 12:10", startTime: "11:20", endTime: "12:10", subjectCode: "CME365", subjectName: "Renewable Energy Technologies", staffName: "Mr. E. Prakash", room: "C14", isFree: false },
      { hour: 4, period: 4, time: "12:10 - 13:00", startTime: "12:10", endTime: "13:00", subjectCode: "OBT357", subjectName: "Biotechnology in Healthcare", staffName: "Ms. N. Rithi Priyanka", room: "C14", isFree: false },
      { hour: 5, period: 5, time: "13:50 - 14:40", startTime: "13:50", endTime: "14:40", subjectCode: "CME365", subjectName: "Renewable Energy Technologies", staffName: "Mr. E. Prakash", room: "C14", isFree: false },
      { hour: 6, period: 6, time: "14:40 - 15:30", startTime: "14:40", endTime: "15:30", subjectCode: null, subjectName: "Skill Development", staffName: null, room: "C14", isFree: false },
    ],
  },
  {
    dayName: "Thursday",
    weekday: 3,
    hall: "C14",
    hours: [
      { hour: 1, period: 1, time: "09:20 - 10:10", startTime: "09:20", endTime: "10:10", subjectCode: "OBT357", subjectName: "Biotechnology in Healthcare", staffName: "Ms. N. Rithi Priyanka", room: "C14", isFree: false },
      { hour: 2, period: 2, time: "10:10 - 11:00", startTime: "10:10", endTime: "11:00", subjectCode: "AI3021", subjectName: "IT in Agricultural System", staffName: "Mrs. V. Anitha", room: "C14", isFree: false },
      { hour: 3, period: 3, time: "11:20 - 12:10", startTime: "11:20", endTime: "12:10", subjectCode: "AI3021", subjectName: "IT in Agricultural System", staffName: "Mrs. V. Anitha", room: "C14", isFree: false },
      { hour: 4, period: 4, time: "12:10 - 13:00", startTime: "12:10", endTime: "13:00", subjectCode: "GE3791", subjectName: "Human Values and Ethics", staffName: "Ms. T. Subathra", room: "C14", isFree: false },
      { hour: 5, period: 5, time: "13:50 - 14:40", startTime: "13:50", endTime: "14:40", subjectCode: null, subjectName: "Library / Counseling", staffName: "Mrs. V. Anitha", room: "C14", isFree: false },
      { hour: 6, period: 6, time: "14:40 - 15:30", startTime: "14:40", endTime: "15:30", subjectCode: "CME365", subjectName: "Renewable Energy Technologies", staffName: "Mr. E. Prakash", room: "C14", isFree: false },
      { hour: 7, period: 7, time: "15:30 - 16:20", startTime: "15:30", endTime: "16:20", subjectCode: "GE3791", subjectName: "Human Values and Ethics", staffName: "Ms. T. Subathra", room: "C14", isFree: false },
    ],
  },
  {
    dayName: "Friday",
    weekday: 4,
    hall: "C14",
    hours: [
      { hour: 1, period: 1, time: "09:20 - 10:10", startTime: "09:20", endTime: "10:10", subjectCode: "AI3021", subjectName: "IT in Agricultural System", staffName: "Mrs. V. Anitha", room: "C14", isFree: false },
      { hour: 2, period: 2, time: "10:10 - 11:00", startTime: "10:10", endTime: "11:00", subjectCode: "GE3791", subjectName: "Human Values and Ethics", staffName: "Ms. T. Subathra", room: "C14", isFree: false },
      { hour: 3, period: 3, time: "11:20 - 12:10", startTime: "11:20", endTime: "12:10", subjectCode: "GE3752", subjectName: "Total Quality Management", staffName: "Mr. R. Senthil", room: "C14", isFree: false },
      { hour: 4, period: 4, time: "12:10 - 13:00", startTime: "12:10", endTime: "13:00", subjectCode: "OBT357", subjectName: "Biotechnology in Healthcare", staffName: "Ms. N. Rithi Priyanka", room: "C14", isFree: false },
      { hour: 5, period: 5, time: "13:50 - 14:40", startTime: "13:50", endTime: "14:40", subjectCode: "CME365", subjectName: "Renewable Energy Technologies", staffName: "Mr. E. Prakash", room: "C14", isFree: false },
      { hour: 6, period: 6, time: "14:40 - 15:30", startTime: "14:40", endTime: "15:30", subjectCode: null, subjectName: "Skill Development", staffName: null, room: "C14", isFree: false },
    ],
  },
  {
    dayName: "Saturday",
    weekday: 5,
    hall: "C14",
    hours: [],
  },
];

// Real database-backed class timetable definitions
// Year 4 has the real semester 7 timetable; Year 2 and Year 3 have no data in DB
const REAL_TIMETABLES: Record<string, StoredClassTimetable> = {
  "IV-A": {
    className: "IV-A",
    hall: "C14",
    days: realScheduleYear4,
    isCustom: false,
  },
  "IV": {
    className: "IV",
    hall: "C14",
    days: realScheduleYear4,
    isCustom: false,
  },
  "III-A": {
    className: "III-A",
    hall: "",
    days: [],
    isCustom: false,
  },
  "II-A": {
    className: "II-A",
    hall: "",
    days: [],
    isCustom: false,
  },
};

function readTimetableStorage(): Record<string, StoredClassTimetable> {
  if (typeof window === "undefined") return { ...REAL_TIMETABLES };
  try {
    const raw = window.localStorage.getItem(TIMETABLE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, StoredClassTimetable>;
      if (parsed && typeof parsed === "object") {
        return { ...REAL_TIMETABLES, ...parsed };
      }
    }
  } catch (e) {
    console.error("Failed to read class timetables:", e);
  }
  return { ...REAL_TIMETABLES };
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
export function getClassTimetable(className = "IV-A", date?: string): TimetableDay {
  const store = readTimetableStorage();
  const classData =
    store[className] ??
    REAL_TIMETABLES[className] ?? {
      className,
      hall: "",
      days: [],
      isCustom: false,
    };

  const now = new Date();
  const dateValue =
    date ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const localDate = new Date(`${dateValue}T00:00:00`);
  const weekday = localDate.getDay();

  // Find today's hours from the class days array
  const todayEntry = classData.days.find(
    (d) =>
      d.dayName.toLowerCase() ===
      new Intl.DateTimeFormat("en", { weekday: "long" }).format(localDate).toLowerCase(),
  );

  return {
    date: dateValue,
    dayName: new Intl.DateTimeFormat("en", { weekday: "long" }).format(localDate),
    hall: classData.hall || null,
    hours: weekday === 0 || weekday === 6 ? [] : (todayEntry?.hours ?? []),
    days: classData.days,
    className,
    isCustom: Boolean(classData.isCustom),
  };
}

/**
 * Save / Upload updated timetable for a class to DB and storage.
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

  // Sync to database
  api.saveStaffTimetable({ className, hall, days }).catch((err) => {
    console.warn("Could not sync timetable to backend API:", err);
  });
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
  if (REAL_TIMETABLES[className]) {
    store[className] = structuredClone(REAL_TIMETABLES[className]);
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
