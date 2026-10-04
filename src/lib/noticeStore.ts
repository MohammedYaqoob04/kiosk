import { department } from "@/config/department";
import { appendAudit } from "@/lib/auditLog";
import {
  counsellors,
  listAllStudents,
  listStudents,
  counsellorOf,
} from "@/lib/staffData";

export const NOTICE_STORAGE_KEY = "arunai-erp-notices";
export const noticeCategories = ["Event", "Circular", "Notice", "Exam", "Holiday"] as const;
export type NoticeCategory = (typeof noticeCategories)[number];
export type NoticeRole = "COUNSELLOR" | "HOD";
export type NoticeAudience =
  | "MY_STUDENTS"
  | `SELECTED_STUDENTS:${string}`
  | "ALL_STUDENTS"
  | "SECTION:A"
  | "SECTION:B"
  | "ALL_COUNSELLORS";

export interface NoticeAttachment {
  name: string;
  type: "application/pdf" | "image/jpeg" | "image/png";
  size: number;
  dataUrl: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  category: NoticeCategory;
  audience: NoticeAudience;
  authorRole: NoticeRole;
  authorId: string;
  authorName: string;
  departmentCode: string;
  createdAt: string;
  expiresAt?: string;
  pinned?: boolean;
  attachments: NoticeAttachment[];
  readBy: string[];
}

export interface CreateNoticeInput {
  title: string;
  body: string;
  category: NoticeCategory;
  audience: NoticeAudience;
  authorRole: NoticeRole;
  authorId: string;
  authorName: string;
  departmentCode?: string;
  expiresAt?: string;
  pinned?: boolean;
  attachments: NoticeAttachment[];
}

const listeners = new Set<() => void>();
const validAttachmentTypes = ["application/pdf", "image/jpeg", "image/png"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNotice(value: unknown): value is Notice {
  if (!isObject(value)) return false;
  return (
    typeof value["id"] === "string" &&
    typeof value["title"] === "string" &&
    typeof value["body"] === "string" &&
    noticeCategories.includes(value["category"] as NoticeCategory) &&
    typeof value["audience"] === "string" &&
    (value["authorRole"] === "COUNSELLOR" || value["authorRole"] === "HOD") &&
    typeof value["authorId"] === "string" &&
    typeof value["authorName"] === "string" &&
    typeof value["createdAt"] === "string" &&
    Array.isArray(value["attachments"]) &&
    Array.isArray(value["readBy"]) &&
    value["readBy"].every((regNo) => typeof regNo === "string")
  );
}

function readNotices(): Notice[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(NOTICE_STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isNotice)) {
      throw new Error("Saved notices have an invalid format.");
    }
    return parsed;
  } catch (error) {
    console.error("Unable to read saved notices.", error);
    return [];
  }
}

let notices = readNotices();

function publish(next: Notice[]): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Unable to save notices.", error);
      throw new Error("The notice could not be saved.");
    }
  }
  notices = next;
  listeners.forEach((listener) => listener());
}

function validateDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T23:59:59`));
}

function selectedStudents(audience: NoticeAudience): string[] {
  if (!audience.startsWith("SELECTED_STUDENTS:")) return [];
  return audience.slice("SELECTED_STUDENTS:".length).split(",").filter(Boolean);
}

function matchesStudentAudience(notice: Notice, regNo: string): boolean {
  if (notice.audience === "ALL_STUDENTS") return true;
  if (notice.audience === "SECTION:A" || notice.audience === "SECTION:B") {
    return listAllStudents().some(
      (student) =>
        student.regNo === regNo && student.section === notice.audience.slice("SECTION:".length),
    );
  }
  if (notice.audience === "MY_STUDENTS") {
    return notice.authorRole === "COUNSELLOR" && listStudents(notice.authorId).some((s) => s.regNo === regNo);
  }
  return notice.audience.startsWith("SELECTED_STUDENTS:") && selectedStudents(notice.audience).includes(regNo);
}

function allStudentsForNotice(notice: Notice): string[] {
  if (notice.audience === "ALL_STUDENTS") {
    return listAllStudents().map(({ regNo }) => regNo);
  }
  if (notice.audience === "SECTION:A" || notice.audience === "SECTION:B") {
    const section = notice.audience.slice("SECTION:".length);
    return listAllStudents()
      .filter((student) => student.section === section)
      .map(({ regNo }) => regNo);
  }
  if (notice.audience === "MY_STUDENTS" && notice.authorRole === "COUNSELLOR") {
    return listStudents(notice.authorId).map(({ regNo }) => regNo);
  }
  if (notice.audience.startsWith("SELECTED_STUDENTS:")) return selectedStudents(notice.audience);
  return [];
}

export function createNotice(input: CreateNoticeInput): Notice {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 1 || title.length > 80) throw new Error("Title must be 1–80 characters.");
  if (body.length < 1 || body.length > 1500) throw new Error("Message must be 1–1500 characters.");
  if (!noticeCategories.includes(input.category)) throw new Error("Choose a notice category.");
  if (!input.authorId.trim() || !input.authorName.trim()) throw new Error("Author is required.");
  if (input.attachments.length > 3) throw new Error("Attach no more than 3 files.");
  for (const attachment of input.attachments) {
    if (!validAttachmentTypes.includes(attachment.type)) {
      throw new Error("Attachments must be PDF, JPG, or PNG files.");
    }
    if (attachment.size <= 0 || attachment.size > 2 * 1024 * 1024) {
      throw new Error("Each attachment must be no larger than 2 MB.");
    }
    if (!attachment.dataUrl.startsWith(`data:${attachment.type};base64,`)) {
      throw new Error("An attachment could not be read. Select it again.");
    }
  }
  if (input.expiresAt && !validateDate(input.expiresAt)) throw new Error("Enter a valid expiry date.");
  if (input.authorRole === "COUNSELLOR") {
    if (input.audience !== "MY_STUDENTS" && !input.audience.startsWith("SELECTED_STUDENTS:")) {
      throw new Error("Counsellors can send only to their students.");
    }
    if (
      selectedStudents(input.audience).some(
        (regNo) => counsellorOf(regNo) !== input.authorId,
      )
    ) {
      throw new Error("Selected students must be assigned to you.");
    }
    if (input.pinned) throw new Error("Only HOD notices can be pinned.");
  } else if (
    input.audience !== "ALL_STUDENTS" &&
    input.audience !== "SECTION:A" &&
    input.audience !== "SECTION:B" &&
    input.audience !== "ALL_COUNSELLORS" &&
    !input.audience.startsWith("SELECTED_STUDENTS:")
  ) {
    throw new Error("Choose a valid notice audience.");
  }
  if (input.audience.startsWith("SELECTED_STUDENTS:")) {
    const selected = selectedStudents(input.audience);
    if (selected.length === 0 || selected.some((regNo) => !getStudentExists(regNo))) {
      throw new Error("Choose at least one valid student.");
    }
  }
  const notice: Notice = {
    id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    category: input.category,
    audience: input.audience,
    authorRole: input.authorRole,
    authorId: input.authorId,
    authorName: input.authorName.trim(),
    departmentCode: input.departmentCode ?? department.code,
    createdAt: new Date().toISOString(),
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    ...(input.authorRole === "HOD" && input.pinned ? { pinned: true } : {}),
    attachments: input.attachments.map((attachment) => ({ ...attachment })),
    readBy: [],
  };
  publish([notice, ...notices]);
  appendAudit({
    actor: input.authorName.trim(),
    role: input.authorRole,
    action: "NOTICE_CREATE",
    targetId: notice.id,
    reason: `Sent to ${recipientCount(notice)} recipients.`,
  });
  return notice;
}

function getStudentExists(regNo: string): boolean {
  return listAllStudents().some((student) => student.regNo === regNo);
}

export function listForStudent(regNo: string): Notice[] {
  const now = Date.now();
  return notices
    .filter(
      (notice) =>
        notice.departmentCode === department.code &&
        (!notice.expiresAt || Date.parse(`${notice.expiresAt}T23:59:59`) >= now) &&
        matchesStudentAudience(notice, regNo),
    )
    .sort(
      (a, b) =>
        Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) ||
        Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
}

export function listForCounsellor(counsellorId: string): Notice[] {
  return notices
    .filter(
      (notice) =>
        notice.authorRole === "HOD" &&
        notice.audience === "ALL_COUNSELLORS" &&
        counsellors.some((counsellor) => counsellor.id === counsellorId),
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function listSent(authorId: string): Notice[] {
  return notices
    .filter((notice) => notice.authorId === authorId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function markRead(id: string, regNo: string): void {
  const notice = notices.find((item) => item.id === id);
  if (!notice) throw new Error("Notice not found.");
  if (!/^5104\d{8}$/.test(regNo)) throw new Error("Register number is invalid.");
  if (notice.readBy.includes(regNo)) return;
  publish(notices.map((item) => (item.id === id ? { ...item, readBy: [...item.readBy, regNo] } : item)));
}

export function unreadCount(regNo: string): number {
  return listForStudent(regNo).filter((notice) => !notice.readBy.includes(regNo)).length;
}

export function withdraw(id: string, authorId: string): void {
  const notice = notices.find((item) => item.id === id);
  if (!notice) throw new Error("Notice not found.");
  if (notice.authorId !== authorId) throw new Error("You can withdraw only your own notices.");
  publish(notices.filter((item) => item.id !== id));
  appendAudit({
    actor: notice.authorName,
    role: notice.authorRole,
    action: "NOTICE_WITHDRAW",
    targetId: notice.id,
    reason: "Notice withdrawn by author.",
  });
}

export function recipientCount(notice: Notice): number {
  return notice.audience === "ALL_COUNSELLORS"
    ? 2
    : allStudentsForNotice(notice).filter((regNo) =>
        notice.authorRole === "COUNSELLOR"
          ? counsellorOf(regNo) === notice.authorId
          : true,
      ).length;
}

export function readCount(notice: Notice): number {
  const recipients = new Set(allStudentsForNotice(notice));
  return notice.readBy.filter((regNo) => recipients.has(regNo)).length;
}

export function getNoticesSnapshot(): Notice[] {
  return notices;
}

export function subscribeToNotices(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetNotices(): void {
  publish([]);
}

export function noticeAudienceSelection(regNos: string[]): NoticeAudience {
  return `SELECTED_STUDENTS:${[...new Set(regNos)].join(",")}`;
}
