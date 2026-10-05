import { getRequestsSnapshot, subscribeToRequests } from "@/lib/leaveStore";
import { appendAudit } from "@/lib/auditLog";
import type { Request } from "@/types/leave";
import { isMockApi } from "@/api";

let stopObserving: (() => void) | null = null;

function decisionAction(request: Request): {
  actor: string;
  role: "COUNSELLOR" | "HOD";
  action: "COUNSELLOR_APPROVE" | "COUNSELLOR_REJECT" | "HOD_APPROVE" | "HOD_REJECT";
  reason?: string;
} | null {
  if (request.status === "REJECTED_BY_COUNSELLOR" && request.counsellorDecision) {
    return {
      actor: request.counsellorDecision.by,
      role: "COUNSELLOR",
      action: "COUNSELLOR_REJECT",
      ...(request.counsellorDecision.remark
        ? { reason: request.counsellorDecision.remark }
        : {}),
    };
  }
  if (request.status === "PENDING_HOD" && request.counsellorDecision) {
    return {
      actor: request.counsellorDecision.by,
      role: "COUNSELLOR",
      action: "COUNSELLOR_APPROVE",
      ...(request.counsellorDecision.remark ? { reason: request.counsellorDecision.remark } : {}),
    };
  }
  if (request.status === "REJECTED_BY_HOD" && request.hodDecision) {
    return {
      actor: request.hodDecision.by,
      role: "HOD",
      action: "HOD_REJECT",
      ...(request.hodDecision.remark ? { reason: request.hodDecision.remark } : {}),
    };
  }
  if (request.status === "APPROVED" && request.hodDecision) {
    return {
      actor: request.hodDecision.by,
      role: "HOD",
      action: "HOD_APPROVE",
      ...(request.hodDecision.remark ? { reason: request.hodDecision.remark } : {}),
    };
  }
  return null;
}

export function initializeRequestAuditObserver(): void {
  if (stopObserving || !isMockApi) return;
  let previous = new Map(getRequestsSnapshot().map((request) => [request.id, request]));
  stopObserving = subscribeToRequests(() => {
    const next = getRequestsSnapshot();
    const current = new Map(next.map((request) => [request.id, request]));
    for (const request of next) {
      const oldRequest = previous.get(request.id);
      if (!oldRequest) {
        appendAudit({
          actor: request.studentName,
          role: "STUDENT",
          action: "REQUEST_SUBMIT",
          targetId: request.id,
          reason: `${request.kind} submitted.`,
          time: request.createdAt,
        });
        continue;
      }
      const decision = decisionAction(request);
      if (request.status !== oldRequest.status && decision) {
        appendAudit({
          actor: decision.actor,
          role: decision.role,
          action: decision.action,
          targetId: request.id,
          ...(decision.reason ? { reason: decision.reason } : {}),
        });
      } else if (request.counsellorId !== oldRequest.counsellorId) {
        appendAudit({
          actor: "HOD Demo",
          role: "HOD",
          action: "COUNSELLOR_REASSIGN",
          targetId: request.id,
          reason: `Assigned to ${request.counsellorId ?? "unassigned"}.`,
        });
      }
    }
    previous = current;
  });
}
