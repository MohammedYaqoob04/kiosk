import { useState, useSyncExternalStore } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { TouchTextInput } from "@/components/TouchTextInput";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getRequestsSnapshot, submitRequest, subscribeToRequests } from "@/lib/leaveStore";
import { requireAuth } from "@/lib/require-auth";
import type {
  LeaveCategory,
  LeaveLetterInput,
  OdCategory,
  Request,
  RequestKind,
  Status,
} from "@/types/leave";

const leaveCategories: LeaveCategory[] = ["Medical", "Personal", "Family Function", "Other"];
const odCategories: OdCategory[] = [
  "Sports",
  "Hackathon",
  "Paper Presentation",
  "Workshop/Training",
  "Technical Symposium",
  "Cultural",
  "NCC/NSS",
  "Other",
];
function isSupportedLetterType(type: string): type is LeaveLetterInput["type"] {
  return type === "application/pdf" || type === "image/jpeg" || type === "image/png";
}

const statusLabels: Record<Status, string> = {
  PENDING_COUNSELLOR: "Pending Counsellor",
  REJECTED_BY_COUNSELLOR: "Rejected by Counsellor",
  PENDING_HOD: "Pending HOD",
  APPROVED: "Approved",
  REJECTED_BY_HOD: "Rejected by HOD",
};

export const Route = createFileRoute("/erp/leave")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: StudentLeavePage,
  head: () => ({ meta: [{ title: "Leave and OD | Student ERP" }] }),
});

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(`${date}T00:00:00`),
  );
}

function rejectionInfo(request: Request): { authority: string; reason: string } | null {
  if (request.status === "REJECTED_BY_COUNSELLOR") {
    return {
      authority: "Counsellor",
      reason: request.counsellorDecision?.remark ?? "",
    };
  }
  if (request.status === "REJECTED_BY_HOD") {
    return { authority: "HOD", reason: request.hodDecision?.remark ?? "" };
  }
  return null;
}

function StudentLeavePage() {
  const { user } = useAuth();
  const allRequests = useSyncExternalStore(
    subscribeToRequests,
    getRequestsSnapshot,
    getRequestsSnapshot,
  );
  const requests = allRequests.filter((request) => request.studentRegNo === user?.identifier);
  const [kind, setKind] = useState<RequestKind>("LEAVE");
  const [leaveCategory, setLeaveCategory] = useState<LeaveCategory | "">("");
  const [odCategory, setOdCategory] = useState<OdCategory | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [eventName, setEventName] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [venue, setVenue] = useState("");
  const [letter, setLetter] = useState<LeaveLetterInput | null>(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const onTextChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setError("");
    setSent(false);
  };
  const dateRangeValid = Boolean(fromDate && toDate && toDate >= fromDate);
  const canSubmit =
    Boolean(user) &&
    dateRangeValid &&
    (kind === "LEAVE"
      ? Boolean(leaveCategory && reason.trim().length >= 10)
      : Boolean(
          odCategory &&
          eventName.trim() &&
          organizer.trim() &&
          venue.trim() &&
          letter &&
          letter.size > 0 &&
          letter.size <= 2 * 1024 * 1024,
        ));

  const uploadLetter = (file: File | undefined) => {
    if (!file) return;
    setLetter(null);
    const letterType = file.type;
    if (!isSupportedLetterType(letterType)) {
      setError("OD letter must be a PDF, JPG, or PNG file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("OD letter must be no larger than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setError("OD letter could not be read. Please upload it again.");
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("OD letter could not be read. Please upload it again.");
        return;
      }
      setLetter({
        name: file.name,
        type: letterType,
        size: file.size,
        dataUrl: reader.result,
      });
      setError("");
      setSent(false);
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!user || !canSubmit) return;
    try {
      if (kind === "LEAVE") {
        if (!leaveCategory) return;
        submitRequest({
          kind,
          category: leaveCategory,
          studentRegNo: user.identifier,
          studentName: user.name,
          fromDate,
          toDate,
          reason,
        });
      } else if (letter && odCategory) {
        submitRequest({
          kind,
          category: odCategory,
          studentRegNo: user.identifier,
          studentName: user.name,
          fromDate,
          toDate,
          eventName,
          organizer,
          venue,
          letter,
        });
      }
      setFromDate("");
      setToDate("");
      setReason("");
      setEventName("");
      setOrganizer("");
      setVenue("");
      setLetter(null);
      setLeaveCategory("");
      setOdCategory("");
      setError("");
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your request could not be submitted.");
    }
  };

  return (
    <div className="leave-page-container">
      <div className="leave-workspace">
        <section className="leave-form-panel">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">Leave / OD</h1>
            <p className="text-base text-muted-foreground">Submit a request for approval.</p>
            <span className="mt-2 inline-flex min-h-10 items-center rounded-full border border-border px-3 text-sm font-medium text-foreground">
              2-tier verification: Counsellor -&gt; HOD
            </span>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Request type">
            {(
              [
                ["LEAVE", "Apply Leave"],
                ["OD", "Apply OD"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                onClick={() => {
                  setKind(value);
                  setError("");
                  setSent(false);
                }}
                className={`min-h-14 rounded-lg border px-5 text-base font-semibold ${
                  kind === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground active:bg-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {kind === "LEAVE" ? (
            <fieldset>
              <legend className="mb-2 font-semibold text-foreground">Leave category</legend>
              <div className="flex flex-wrap gap-2">
                {leaveCategories.map((category) => (
                  <CategoryButton
                    key={category}
                    label={category}
                    selected={leaveCategory === category}
                    onClick={() => {
                      setLeaveCategory(category);
                      setSent(false);
                    }}
                  />
                ))}
              </div>
            </fieldset>
          ) : (
            <>
              <fieldset>
                <legend className="mb-2 font-semibold text-foreground">OD category</legend>
                <div className="flex flex-wrap gap-2">
                  {odCategories.map((category) => (
                    <CategoryButton
                      key={category}
                      label={category}
                      selected={odCategory === category}
                      onClick={() => {
                        setOdCategory(category);
                        setSent(false);
                      }}
                    />
                  ))}
                </div>
              </fieldset>
              {odCategory === "Sports" && (
                <p className="text-sm text-muted-foreground">
                  Sports: Attach the sports department/organizer letter
                </p>
              )}
              {odCategory === "Hackathon" && (
                <p className="text-sm text-muted-foreground">
                  Hackathon: Attach the organizer&apos;s invitation/registration letter
                </p>
              )}
              <TouchTextInput
                label="Event name"
                value={eventName}
                onChange={onTextChange(setEventName)}
                placeholder="Tap to enter event name"
                maxLength={100}
              />
              <TouchTextInput
                label="Organizer"
                value={organizer}
                onChange={onTextChange(setOrganizer)}
                placeholder="Tap to enter organizer"
                maxLength={100}
              />
              <TouchTextInput
                label="Venue"
                value={venue}
                onChange={onTextChange(setVenue)}
                placeholder="Tap to enter venue"
                maxLength={100}
              />
            </>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 font-semibold text-foreground">
              From
              <input
                type="date"
                value={fromDate}
                onChange={(event) => onTextChange(setFromDate)(event.currentTarget.value)}
                className="min-h-14 rounded-lg border border-input bg-background px-4 text-base text-foreground"
              />
            </label>
            <label className="grid gap-2 font-semibold text-foreground">
              To
              <input
                type="date"
                min={fromDate || undefined}
                value={toDate}
                onChange={(event) => onTextChange(setToDate)(event.currentTarget.value)}
                className="min-h-14 rounded-lg border border-input bg-background px-4 text-base text-foreground"
              />
            </label>
          </div>

          {kind === "LEAVE" ? (
            <TouchTextInput
              label="Reason"
              value={reason}
              onChange={onTextChange(setReason)}
              placeholder="Enter the reason for leave (at least 10 characters)"
              maxLength={300}
            />
          ) : (
            <div className="grid gap-2">
              <label htmlFor="od-letter" className="font-semibold text-foreground">
                Upload official OD letter
              </label>
              <input
                id="od-letter"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) => uploadLetter(event.currentTarget.files?.[0])}
                className="min-h-14 w-full rounded-lg border border-border bg-surface px-3 py-3 text-base text-foreground"
              />
              {letter && (
                <div className="flex min-h-14 items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3">
                  <span className="min-w-0 truncate text-sm text-foreground">{letter.name}</span>
                  <button
                    type="button"
                    onClick={() => setLetter(null)}
                    className="min-h-12 px-3 font-semibold text-foreground underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {sent && (
            <p role="status" className="font-semibold text-foreground">
              Sent to Counsellor
            </p>
          )}
          <Button type="button" onClick={submit} disabled={!canSubmit} className="w-full">
            Submit request
          </Button>
        </section>

        <section className="leave-history-panel">
          <h2 className="shrink-0 font-display text-xl font-semibold text-foreground">
            My requests
          </h2>
          {requests.length === 0 ? (
            <p className="py-4 text-base text-muted-foreground">No requests submitted yet.</p>
          ) : (
            <div className="leave-history-list">
              {requests.map((request) => {
                const rejection = rejectionInfo(request);
                return (
                  <article
                    key={request.id}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {request.kind} · {request.category}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDate(request.fromDate)} – {formatDate(request.toDate)}
                        </p>
                      </div>
                      <span className="inline-flex min-h-10 items-center rounded-full border border-border px-3 text-sm font-medium text-foreground">
                        {statusLabels[request.status]}
                      </span>
                    </div>
                    {request.kind === "OD" && (
                      <p className="mt-2 text-sm text-muted-foreground">{request.eventName}</p>
                    )}
                    {rejection && (
                      <p className="mt-2 text-sm text-foreground">
                        Rejected by {rejection.authority}: {rejection.reason}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CategoryButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-14 rounded-lg border px-4 text-sm font-medium ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-foreground active:bg-secondary"
      }`}
    >
      {label}
    </button>
  );
}
