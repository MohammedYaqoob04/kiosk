export const AUDIT_LOG_STORAGE_KEY = "arunai-erp-audit-log";

export type AuditRole = "STUDENT" | "COUNSELLOR" | "HOD";
export type AuditAction =
  | "REQUEST_SUBMIT"
  | "COUNSELLOR_APPROVE"
  | "COUNSELLOR_REJECT"
  | "HOD_APPROVE"
  | "HOD_REJECT"
  | "COUNSELLOR_REASSIGN"
  | "STUDENT_ASSIGN"
  | "STUDENT_UNASSIGN"
  | "NOTICE_CREATE"
  | "NOTICE_WITHDRAW";

export interface AuditEntry {
  id: string;
  actor: string;
  role: AuditRole;
  action: AuditAction;
  targetId: string;
  time: string;
  reason?: string;
}

const listeners = new Set<() => void>();

function isAuditEntry(value: unknown): value is AuditEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry["id"] === "string" &&
    typeof entry["actor"] === "string" &&
    (entry["role"] === "STUDENT" ||
      entry["role"] === "COUNSELLOR" ||
      entry["role"] === "HOD") &&
    typeof entry["action"] === "string" &&
    typeof entry["targetId"] === "string" &&
    typeof entry["time"] === "string"
  );
}

function readEntries(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isAuditEntry)) {
      throw new Error("Saved activity log has an invalid format.");
    }
    return parsed;
  } catch (error) {
    console.error("Unable to read the activity log.", error);
    return [];
  }
}

let entries = readEntries();

function publish(next: AuditEntry[]): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Unable to write to the activity log.", error);
      throw new Error("The activity could not be recorded.");
    }
  }
  entries = next;
  listeners.forEach((listener) => listener());
}

export function appendAudit(
  input: Omit<AuditEntry, "id" | "time"> & { time?: string },
): AuditEntry {
  const entry: AuditEntry = {
    ...input,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time: input.time ?? new Date().toISOString(),
  };
  publish([...entries, entry]);
  return entry;
}

export function getAuditSnapshot(): AuditEntry[] {
  return entries;
}

export function subscribeToAudit(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
