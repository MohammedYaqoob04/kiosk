import type {
  Decision,
  LeaveCategory,
  LeaveLetterInput,
  OdCategory,
  Request,
  Status,
} from "@/types/leave";
import { department } from "@/config/department";
import { DEMO_COUNSELLOR_ID, counsellorOf } from "@/lib/staffData";

export const LEAVE_REQUEST_STORAGE_KEY = "arunai-erp-leave-requests";
const MAX_LETTER_SIZE = 2 * 1024 * 1024;
const leaveCategories: readonly LeaveCategory[] = [
  "Medical",
  "Personal",
  "Family Function",
  "Other",
];
const odCategories: readonly OdCategory[] = [
  "Sports",
  "Hackathon",
  "Paper Presentation",
  "Workshop/Training",
  "Technical Symposium",
  "Cultural",
  "NCC/NSS",
  "Other",
];
const allowedLetterTypes = ["application/pdf", "image/jpeg", "image/png"] as const;
const listeners = new Set<() => void>();

export type SubmitRequestInput =
  | {
      studentRegNo: string;
      studentName: string;
      kind: "LEAVE";
      category: LeaveCategory;
      fromDate: string;
      toDate: string;
      reason: string;
    }
  | {
      studentRegNo: string;
      studentName: string;
      kind: "OD";
      category: OdCategory;
      fromDate: string;
      toDate: string;
      eventName: string;
      organizer: string;
      venue: string;
      letter: LeaveLetterInput;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredRequest(value: unknown): value is Request {
  if (!isRecord(value)) return false;
  const status: Status[] = [
    "PENDING_COUNSELLOR",
    "REJECTED_BY_COUNSELLOR",
    "PENDING_HOD",
    "APPROVED",
    "REJECTED_BY_HOD",
  ];
  return (
    typeof value["id"] === "string" &&
    typeof value["departmentCode"] === "string" &&
    typeof value["studentRegNo"] === "string" &&
    typeof value["studentName"] === "string" &&
    typeof value["fromDate"] === "string" &&
    typeof value["toDate"] === "string" &&
    typeof value["createdAt"] === "string" &&
    status.includes(value["status"] as Status) &&
    (value["kind"] === "LEAVE" || value["kind"] === "OD")
  );
}

function readRequests(): Request[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(LEAVE_REQUEST_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      throw new Error("Saved leave requests have an invalid format.");
    }
    const normalized = parsed.map((value) =>
      isRecord(value) && !("departmentCode" in value)
        ? { ...value, departmentCode: department.code }
        : value,
    );
    if (!normalized.every(isStoredRequest)) {
      throw new Error("Saved leave requests have an invalid format.");
    }
    return normalized;
  } catch (error) {
    console.error("Unable to read saved leave requests.", error);
    return [];
  }
}

let requests = readRequests();

function publish(next: Request[]): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LEAVE_REQUEST_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Unable to save leave request changes.", error);
      throw new Error("Your request could not be saved. Please try again.");
    }
  }
  requests = next;
  listeners.forEach((listener) => listener());
}

function validateDates(fromDate: string, toDate: string): void {
  const validDate = (date: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date;
  if (!validDate(fromDate) || !validDate(toDate) || toDate < fromDate) {
    throw new Error("To date must be the same as or after the from date.");
  }
}

function validateLetter(letter: LeaveLetterInput): void {
  if (!allowedLetterTypes.includes(letter.type)) {
    throw new Error("OD letter must be a PDF, JPG, or PNG file.");
  }
  if (letter.size <= 0 || letter.size > MAX_LETTER_SIZE) {
    throw new Error("OD letter must be no larger than 2 MB.");
  }
  if (!letter.name.trim() || !letter.dataUrl.startsWith(`data:${letter.type};base64,`)) {
    throw new Error("OD letter could not be read. Please upload it again.");
  }
}

export function submitRequest(input: SubmitRequestInput): Request {
  validateDates(input.fromDate, input.toDate);
  if (!/^5104\d{8}$/.test(input.studentRegNo)) {
    throw new Error("Register number must be 12 digits starting with 5104.");
  }
  if (!input.studentName.trim()) throw new Error("Student name is required.");

  const assignedCounsellorId = counsellorOf(input.studentRegNo);
  let request: Request;
  const common = {
    id: `request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    departmentCode: department.code,
    studentRegNo: input.studentRegNo,
    studentName: input.studentName.trim(),
    fromDate: input.fromDate,
    toDate: input.toDate,
    createdAt: new Date().toISOString(),
    status: "PENDING_COUNSELLOR" as const,
    ...(assignedCounsellorId ? { counsellorId: assignedCounsellorId } : {}),
  };

  if (input.kind === "LEAVE") {
    if (!leaveCategories.includes(input.category)) throw new Error("Choose a leave category.");
    if (input.reason.trim().length < 10) {
      throw new Error("Leave reason must be at least 10 characters.");
    }
    request = {
      ...common,
      kind: input.kind,
      category: input.category,
      reason: input.reason.trim(),
    };
  } else {
    if (!odCategories.includes(input.category)) throw new Error("Choose an OD category.");
    if (!input.eventName.trim() || !input.organizer.trim() || !input.venue.trim()) {
      throw new Error("Event name, organizer, and venue are required for OD.");
    }
    validateLetter(input.letter);
    request = {
      ...common,
      kind: input.kind,
      category: input.category,
      eventName: input.eventName.trim(),
      organizer: input.organizer.trim(),
      venue: input.venue.trim(),
      letter: input.letter,
    };
  }

  publish([request, ...requests]);
  return request;
}

function updateRequest(
  id: string,
  expectedStatus: Status,
  status: Status,
  decisionKey: "counsellorDecision" | "hodDecision",
  by: string,
  remark?: string,
): Request {
  const request = requests.find((item) => item.id === id);
  if (!request) throw new Error("Request not found.");
  if (request.status !== expectedStatus) {
    throw new Error(`Cannot update a request in ${request.status} status.`);
  }
  const decision: Decision = {
    by: by.trim(),
    at: new Date().toISOString(),
    ...(remark ? { remark: remark.trim() } : {}),
  };
  if (!decision.by) throw new Error("Approver name is required.");
  const updated = { ...request, status, [decisionKey]: decision } as Request;
  publish(requests.map((item) => (item.id === id ? updated : item)));
  return updated;
}

function validateRejectionReason(reason: string): string {
  const trimmed = reason.trim();
  if (trimmed.length < 10) throw new Error("Rejection reason must be at least 10 characters.");
  return trimmed;
}

export function counsellorApprove(id: string, by: string): Request {
  return updateRequest(id, "PENDING_COUNSELLOR", "PENDING_HOD", "counsellorDecision", by);
}

export function counsellorReject(id: string, by: string, reason: string): Request {
  return updateRequest(
    id,
    "PENDING_COUNSELLOR",
    "REJECTED_BY_COUNSELLOR",
    "counsellorDecision",
    by,
    validateRejectionReason(reason),
  );
}

export function hodApprove(id: string, by: string): Request {
  return updateRequest(id, "PENDING_HOD", "APPROVED", "hodDecision", by);
}

export function hodReject(id: string, by: string, reason: string): Request {
  return updateRequest(
    id,
    "PENDING_HOD",
    "REJECTED_BY_HOD",
    "hodDecision",
    by,
    validateRejectionReason(reason),
  );
}

export function listForStudent(regNo: string): Request[] {
  return requests.filter((request) => request.studentRegNo === regNo);
}

export function listForCounsellor(counsellorId = DEMO_COUNSELLOR_ID): Request[] {
  return requests.filter(
    (request) =>
      request.departmentCode === department.code &&
      request.status === "PENDING_COUNSELLOR" &&
      (request.counsellorId ?? counsellorOf(request.studentRegNo)) === counsellorId,
  );
}

export function reassignCounsellor(id: string, counsellorId: string): Request {
  const request = requests.find((item) => item.id === id);
  if (!request) throw new Error("Request not found.");
  if (request.status !== "PENDING_COUNSELLOR") {
    throw new Error("Only requests pending counsellor review can be reassigned.");
  }
  if (!counsellorId.trim()) throw new Error("Choose a counsellor.");
  const updated = { ...request, counsellorId };
  publish(requests.map((item) => (item.id === id ? updated : item)));
  return updated;
}

export function listForHod(): Request[] {
  return requests.filter(
    (request) => request.departmentCode === department.code && request.status === "PENDING_HOD",
  );
}

export function listCounsellorHistory(): Request[] {
  return requests.filter((request) => request.counsellorDecision !== undefined);
}

export function listHodHistory(): Request[] {
  return requests.filter((request) => request.hodDecision !== undefined);
}

export function getRequestsSnapshot(): Request[] {
  return requests;
}

export function subscribeToRequests(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetRequests(): void {
  publish([]);
}
