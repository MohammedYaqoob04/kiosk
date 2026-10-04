import { useMemo, useState, useSyncExternalStore } from "react";
import { FileText, History, Inbox } from "lucide-react";

import { TouchTextInput } from "@/components/TouchTextInput";
import { RequestStudentContext } from "@/components/staff/RequestStudentContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  counsellorApprove,
  counsellorReject,
  getRequestsSnapshot,
  hodApprove,
  hodReject,
  listForCounsellor,
  reassignCounsellor,
  subscribeToRequests,
} from "@/lib/leaveStore";
import { useAuth } from "@/lib/auth-context";
import { counsellors, counsellorOf, getStudentSummary } from "@/lib/staffData";
import type { Request } from "@/types/leave";

type DeskRole = "COUNSELLOR" | "HOD";
type DeskTab = "pending" | "history";

interface LeaveApprovalDeskProps {
  role: DeskRole;
  initialTab?: DeskTab;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function LeaveApprovalDesk({ role, initialTab = "pending" }: LeaveApprovalDeskProps) {
  const { user } = useAuth();
  const requests = useSyncExternalStore(
    subscribeToRequests,
    getRequestsSnapshot,
    getRequestsSnapshot,
  );
  const [tab, setTab] = useState<DeskTab>(initialTab);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const [letterOpen, setLetterOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [reassignError, setReassignError] = useState("");

  const pending = useMemo(
    () =>
      (role === "COUNSELLOR"
        ? listForCounsellor(user?.id ?? "")
        : requests.filter(
            (request) =>
              request.status === "PENDING_HOD" || request.status === "PENDING_COUNSELLOR",
          )
      ).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
    [role, requests, user?.id],
  );
  const history = requests.filter((request) =>
    role === "COUNSELLOR"
      ? request.counsellorDecision !== undefined &&
        (request.counsellorId ?? counsellorOf(request.studentRegNo)) === user?.id
      : request.hodDecision !== undefined,
  );
  const items = tab === "pending" ? pending : history;
  const selected = items.find((request) => request.id === selectedId) ?? items[0] ?? null;
  const approver = user?.name ?? (role === "COUNSELLOR" ? "Counsellor Demo" : "HOD Demo");
  const canDecide =
    selected !== null &&
    (role === "COUNSELLOR"
      ? selected.status === "PENDING_COUNSELLOR"
      : selected.status === "PENDING_HOD");

  const reassign = (counsellorId: string) => {
    if (!selected || role !== "HOD") return;
    try {
      reassignCounsellor(selected.id, counsellorId);
      setReassignError("");
    } catch (cause) {
      setReassignError(
        cause instanceof Error ? cause.message : "The request could not be reassigned.",
      );
    }
  };

  const approve = () => {
    if (!selected) return;
    try {
      if (role === "COUNSELLOR") counsellorApprove(selected.id, approver);
      else hodApprove(selected.id, approver);
      setActionError("");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "The request could not be approved.");
    }
  };

  const reject = () => {
    if (!selected || remark.trim().length < 10) return;
    try {
      if (role === "COUNSELLOR") counsellorReject(selected.id, approver, remark);
      else hodReject(selected.id, approver, remark);
      setRejectOpen(false);
      setRemark("");
      setActionError("");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "The request could not be rejected.");
    }
  };

  return (
    <div className="approval-desk">
      <div className="approval-desk-heading">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {role === "COUNSELLOR" ? "Counsellor Desk" : "HOD Office"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === "COUNSELLOR"
              ? "Review student requests before forwarding them to the HOD."
              : "Review requests approved by the counsellor."}
          </p>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Request view">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "pending"}
            onClick={() => {
              setTab("pending");
              setActionError("");
            }}
            className={`min-h-14 rounded-lg border px-4 font-medium ${
              tab === "pending"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground"
            }`}
          >
            Pending <span className="ml-1">{pending.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "history"}
            onClick={() => {
              setTab("history");
              setActionError("");
            }}
            className={`min-h-14 rounded-lg border px-4 font-medium ${
              tab === "history"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground"
            }`}
          >
            History
          </button>
        </div>
      </div>

      <div className="approval-desk-columns">
        <section
          className="approval-request-list"
          aria-label={tab === "pending" ? "Pending requests" : "Request history"}
        >
          {items.length === 0 ? (
            <div className="grid min-h-40 place-items-center rounded-xl border border-border bg-surface p-6 text-center text-muted-foreground">
              <span className="grid justify-items-center gap-2">
                {tab === "pending" ? <Inbox aria-hidden="true" /> : <History aria-hidden="true" />}
                {tab === "pending" ? "No requests are waiting for review." : "No decisions yet."}
              </span>
            </div>
          ) : (
            items.map((request) => (
              <button
                key={request.id}
                type="button"
                aria-pressed={selected?.id === request.id}
                onClick={() => {
                  setSelectedId(request.id);
                  setActionError("");
                }}
                className={`approval-request-row ${
                  selected?.id === request.id ? "is-selected" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">
                    {request.studentName}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {request.kind} · {request.category} · {request.fromDate}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {tab === "history"
                    ? "Decision"
                    : role === "HOD" && request.status === "PENDING_COUNSELLOR"
                      ? "Reassignment"
                      : "Review"}
                </span>
              </button>
            ))
          )}
        </section>

        {selected ? (
          <section className="approval-request-detail" aria-label="Request details">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {selected.studentName}
                </h2>
                <p className="text-sm text-muted-foreground">{selected.studentRegNo}</p>
              </div>
              <span className="rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground">
                {selected.kind} · {selected.category}
              </span>
            </div>

            <dl className="approval-request-fields">
              <Detail label="Dates" value={`${selected.fromDate} – ${selected.toDate}`} />
              <Detail label="Submitted" value={formatDateTime(selected.createdAt)} />
              {selected.kind === "LEAVE" ? (
                <Detail label="Reason" value={selected.reason} wide />
              ) : (
                <>
                  <Detail label="Event" value={selected.eventName} />
                  <Detail label="Organizer" value={selected.organizer} />
                  <Detail label="Venue" value={selected.venue} />
                  <div className="approval-detail-field">
                    <dt>Official OD letter</dt>
                    <dd>
                      <button
                        type="button"
                        onClick={() => setLetterOpen(true)}
                        className="inline-flex min-h-12 items-center gap-2 font-semibold text-accent underline"
                      >
                        <FileText aria-hidden="true" className="size-5" strokeWidth={1.5} />
                        Preview {selected.letter.name}
                      </button>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {(selected.letter.size / 1024).toFixed(0)} KB
                      </span>
                    </dd>
                  </div>
                </>
              )}
              {role === "HOD" && selected.counsellorDecision && (
                <Detail
                  label="Counsellor approval"
                  value={`${selected.counsellorDecision.by} · ${formatDateTime(selected.counsellorDecision.at)}`}
                  wide
                />
              )}
              {tab === "history" && (
                <>
                  <Detail
                    label="Decision"
                    value={
                      role === "COUNSELLOR"
                        ? selected.status === "REJECTED_BY_COUNSELLOR"
                          ? `Rejected by ${selected.counsellorDecision?.by ?? "Counsellor"}`
                          : `Approved by ${selected.counsellorDecision?.by ?? "Counsellor"}`
                        : selected.status === "REJECTED_BY_HOD"
                          ? `Rejected by ${selected.hodDecision?.by ?? "HOD"}`
                          : `Approved by ${selected.hodDecision?.by ?? "HOD"}`
                    }
                  />
                  <Detail
                    label="Decision time"
                    value={formatDateTime(
                      role === "COUNSELLOR"
                        ? (selected.counsellorDecision?.at ?? "")
                        : (selected.hodDecision?.at ?? ""),
                    )}
                  />
                  {selected.counsellorDecision?.remark && (
                    <Detail
                      label="Counsellor reason"
                      value={selected.counsellorDecision.remark}
                      wide
                    />
                  )}
                  {selected.hodDecision?.remark && (
                    <Detail label="HOD reason" value={selected.hodDecision.remark} wide />
                  )}
                </>
              )}
            </dl>

            <RequestStudentContext selected={selected} />
            {role === "HOD" && (
              <div className="rounded-xl border border-border bg-surface p-3">
                <h3 className="font-semibold text-foreground">Counsellor remark</h3>
                <p className="text-sm text-foreground">
                  {selected.counsellorDecision?.remark || "No remark recorded."}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.counsellorDecision
                    ? formatDateTime(selected.counsellorDecision.at)
                    : "Decision time unavailable"}
                </p>
                {selected.status === "PENDING_HOD" && (
                  <p className="mt-1 text-sm font-medium text-foreground">
                    Waiting {Math.max(0, Math.floor((Date.now() - Date.parse(selected.createdAt)) / 86_400_000))} days
                  </p>
                )}
              </div>
            )}

            {role === "HOD" && selected.status === "PENDING_COUNSELLOR" && (
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Reassign counsellor
                <select
                  value={selected.counsellorId ?? counsellorOf(selected.studentRegNo) ?? ""}
                  onChange={(event) => reassign(event.target.value)}
                  className="min-h-14 rounded-lg border border-border bg-surface px-3"
                >
                  <option value="" disabled>
                    Choose a counsellor
                  </option>
                  {counsellors.map((counsellor) => (
                    <option key={counsellor.id} value={counsellor.id}>
                      {counsellor.name}
                    </option>
                  ))}
                </select>
                {reassignError && <span role="alert">{reassignError}</span>}
              </label>
            )}

            {actionError && (
              <p role="alert" className="text-sm text-destructive">
                {actionError}
              </p>
            )}
            {tab === "pending" && canDecide && (
              <div className="mt-auto flex flex-wrap gap-3">
                <Button type="button" onClick={approve} className="flex-1">
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRemark("");
                    setRejectOpen(true);
                    setActionError("");
                  }}
                  className="flex-1"
                >
                  Reject
                </Button>
              </div>
            )}
          </section>
        ) : (
          <section className="approval-request-detail grid place-items-center text-muted-foreground">
            Select a request to review its details.
          </section>
        )}
      </div>

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) setRemark("");
        }}
      >
        <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl">Reject request</DialogTitle>
            <DialogDescription>
              Enter the reason for rejection. Use at least 10 characters.
            </DialogDescription>
          </DialogHeader>
          <TouchTextInput
            label="Rejection reason"
            value={remark}
            onChange={setRemark}
            placeholder="Tap to enter the reason"
            maxLength={500}
            multiline
          />
          <p className="text-right text-sm text-muted-foreground">
            {remark.trim().length}/10 minimum
          </p>
          <Button type="button" onClick={reject} disabled={remark.trim().length < 10}>
            Confirm rejection
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={letterOpen} onOpenChange={setLetterOpen}>
        <DialogContent className="max-h-[90svh] max-w-5xl overflow-y-auto border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle>OD official letter</DialogTitle>
            <DialogDescription>
              {selected?.kind === "OD" ? selected.letter.name : ""}
            </DialogDescription>
          </DialogHeader>
          {selected?.kind === "OD" &&
            (selected.letter.type === "application/pdf" ? (
              <iframe
                title={`OD letter: ${selected.letter.name}`}
                src={selected.letter.dataUrl}
                className="h-[70svh] w-full rounded-lg border border-border"
              />
            ) : (
              <img
                src={selected.letter.dataUrl}
                alt={`OD letter: ${selected.letter.name}`}
                className="max-h-[70svh] max-w-full justify-self-center object-contain"
              />
            ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`approval-detail-field ${wide ? "is-wide" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
