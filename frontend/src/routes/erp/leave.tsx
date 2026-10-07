import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, FileText, Loader2 } from "lucide-react";

import { api } from "@/api";
import { ApiError } from "@/api/http";
import { useApi } from "@/api/use-api";
import { ErrorState } from "@/components/erp/ErrorState";
import { Skeleton } from "@/components/erp/Skeleton";
import { TouchTextInput } from "@/components/TouchTextInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
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
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
      new Date(`${date}T00:00:00`),
    );
  } catch {
    return date;
  }
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return dateStr;
  }
}

function formatServerError(err: unknown): string {
  if (err instanceof ApiError) {
    return err.code ? `[${err.code}] ${err.message}` : err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "An unexpected error occurred.";
}

function StudentLeavePage() {
  const { user } = useAuth();
  const myLeavesQuery = useApi(["erp", "leave", "mine"], api.getMyLeaves, {
    enabled: Boolean(user),
  });
  const requests = myLeavesQuery.data ?? [];

  const [kind, setKind] = useState<RequestKind>("LEAVE");
  const [leaveCategory, setLeaveCategory] = useState<LeaveCategory | "">("");
  const [odCategory, setOdCategory] = useState<OdCategory | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [address, setAddress] = useState("");
  const [eventName, setEventName] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [venue, setVenue] = useState("");
  const [letter, setLetter] = useState<LeaveLetterInput | null>(null);
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  // OD Letter Dialog state
  const [letterOpen, setLetterOpen] = useState(false);
  const [activeLetterUrl, setActiveLetterUrl] = useState<string | null>(null);
  const [activeLetterName, setActiveLetterName] = useState<string>("");
  const [activeLetterType, setActiveLetterType] = useState<string>("application/pdf");
  const [letterLoadingId, setLetterLoadingId] = useState<string | null>(null);

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
          fileObject &&
          fileObject.size <= 2 * 1024 * 1024,
        ));

  const uploadLetter = (file: File | undefined) => {
    if (!file) return;
    setLetter(null);
    setFileObject(null);
    const letterType = file.type.toLowerCase();
    const isPdf = letterType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isJpg =
      letterType === "image/jpeg" ||
      letterType === "image/jpg" ||
      file.name.toLowerCase().endsWith(".jpg") ||
      file.name.toLowerCase().endsWith(".jpeg");
    const isPng = letterType === "image/png" || file.name.toLowerCase().endsWith(".png");

    if (!isPdf && !isJpg && !isPng) {
      setError("OD letter must be a PDF, JPG, or PNG file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("OD letter must be no larger than 2 MB.");
      return;
    }
    setFileObject(file);
    setLetter({
      name: file.name,
      type: isPdf ? "application/pdf" : isPng ? "image/png" : "image/jpeg",
      size: file.size,
      dataUrl: "",
    });
    setError("");
    setSent(false);
  };

  const submit = async () => {
    if (!user || !canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    setSent(false);
    try {
      const formData = new FormData();
      formData.append("kind", kind);
      formData.append("category", kind === "LEAVE" ? leaveCategory : odCategory);
      formData.append("fromDate", fromDate);
      formData.append("toDate", toDate);
      if (kind === "LEAVE") {
        formData.append("reason", reason.trim());
        if (address.trim()) {
          formData.append("residentialAddress", address.trim());
          formData.append("address", address.trim());
        }
      } else {
        formData.append("eventName", eventName.trim());
        formData.append("organizer", organizer.trim());
        formData.append("venue", venue.trim());
        if (fileObject) {
          formData.append("letter", fileObject);
        }
      }

      await api.submitLeave(formData);
      await myLeavesQuery.reload();

      setFromDate("");
      setToDate("");
      setReason("");
      setAddress("");
      setEventName("");
      setOrganizer("");
      setVenue("");
      setLetter(null);
      setFileObject(null);
      setLeaveCategory("");
      setOdCategory("");
      const fileInput = document.getElementById("od-letter") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      setSent(true);
    } catch (cause) {
      setError(formatServerError(cause));
    } finally {
      setSubmitting(false);
    }
  };

  const openLetter = async (request: Request) => {
    if (!request.letter) return;
    setLetterLoadingId(request.id);
    setError("");
    try {
      const blob = await api.getLeaveLetterBlob(request.id);
      const url = URL.createObjectURL(blob);
      if (activeLetterUrl) {
        URL.revokeObjectURL(activeLetterUrl);
      }
      setActiveLetterUrl(url);
      setActiveLetterName(request.letter.name || "OD-Letter");
      const mime = request.letter.type || blob.type || "application/pdf";
      setActiveLetterType(mime);
      setLetterOpen(true);
    } catch (err) {
      setError(formatServerError(err));
    } finally {
      setLetterLoadingId(null);
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
            <>
              <TouchTextInput
                label="Reason"
                value={reason}
                onChange={onTextChange(setReason)}
                placeholder="Enter the reason for leave (at least 10 characters)"
                maxLength={300}
              />
              <TouchTextInput
                label="Address while on leave"
                value={address}
                onChange={onTextChange(setAddress)}
                placeholder="Enter residential or contact address"
                maxLength={200}
              />
            </>
          ) : (
            <div className="grid gap-2">
              <label htmlFor="od-letter" className="font-semibold text-foreground">
                Upload official OD letter (PDF, JPG, or PNG, max 2 MB)
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
                    onClick={() => {
                      setLetter(null);
                      setFileObject(null);
                      const inputEl = document.getElementById("od-letter") as HTMLInputElement | null;
                      if (inputEl) inputEl.value = "";
                    }}
                    className="min-h-12 px-3 font-semibold text-foreground underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          {sent && (
            <p role="status" className="font-semibold text-ok">
              Leave/OD request submitted successfully.
            </p>
          )}
          <Button
            type="button"
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="w-full min-h-14 text-base font-semibold"
          >
            {submitting ? "Submitting request…" : "Submit request"}
          </Button>
        </section>

        <section className="leave-history-panel">
          <h2 className="shrink-0 font-display text-xl font-semibold text-foreground">
            My requests
          </h2>
          {myLeavesQuery.loading ? (
            <Skeleton rows={3} className="py-2" />
          ) : myLeavesQuery.error ? (
            <ErrorState
              message={formatServerError(myLeavesQuery.error)}
              onRetry={myLeavesQuery.reload}
            />
          ) : requests.length === 0 ? (
            <p className="py-4 text-base text-muted-foreground">No requests submitted yet.</p>
          ) : (
            <div className="leave-history-list">
              {requests.map((request) => {
                const isRejected =
                  request.status === "REJECTED_BY_COUNSELLOR" ||
                  request.status === "REJECTED_BY_HOD";
                const isApproved = request.status === "APPROVED";

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
                          {request.days ? ` (${request.days} ${request.days === 1 ? "day" : "days"})` : ""}
                        </p>
                      </div>
                      <span
                        className={`inline-flex min-h-10 items-center rounded-full px-3 text-xs font-semibold ${
                          isApproved
                            ? "border border-ok/40 bg-ok/10 text-ok"
                            : isRejected
                              ? "border border-destructive/40 bg-destructive/10 text-destructive"
                              : "border border-border bg-surface-2 text-foreground"
                        }`}
                      >
                        {statusLabels[request.status]}
                      </span>
                    </div>

                    {request.kind === "OD" && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{request.eventName}</span>
                        {request.organizer ? ` · ${request.organizer}` : ""}
                        {request.venue ? ` · ${request.venue}` : ""}
                      </p>
                    )}

                    {request.kind === "LEAVE" && request.reason && (
                      <p className="mt-2 text-sm text-muted-foreground">{request.reason}</p>
                    )}

                    {/* OD Letter Action */}
                    {request.kind === "OD" && request.letter && (
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={letterLoadingId === request.id}
                          onClick={() => openLetter(request)}
                          className="min-h-10 gap-2 text-xs font-semibold"
                        >
                          {letterLoadingId === request.id ? (
                            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                          ) : (
                            <FileText aria-hidden="true" className="size-4" />
                          )}
                          {letterLoadingId === request.id
                            ? "Loading letter…"
                            : `View Letter (${request.letter.name})`}
                        </Button>
                      </div>
                    )}

                    {/* Counsellor Decision */}
                    {request.counsellorDecision && (
                      <div className="mt-3 rounded-lg border border-border bg-surface-2/60 p-2.5 text-xs text-foreground">
                        <div className="flex items-center justify-between gap-2 font-semibold">
                          <span>Counsellor Decision</span>
                          {request.counsellorDecision.at && (
                            <span className="text-[11px] font-normal text-muted-foreground">
                              {formatDateTime(request.counsellorDecision.at)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-muted-foreground">
                          <span className="font-medium text-foreground">By:</span>{" "}
                          {request.counsellorDecision.by}
                        </p>
                        {request.counsellorDecision.remark && (
                          <p className="mt-1 text-muted-foreground">
                            <span className="font-medium text-foreground">Remark:</span> &ldquo;
                            {request.counsellorDecision.remark}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {/* HOD Decision */}
                    {request.hodDecision && (
                      <div className="mt-2 rounded-lg border border-border bg-surface-2/60 p-2.5 text-xs text-foreground">
                        <div className="flex items-center justify-between gap-2 font-semibold">
                          <span>HOD Decision</span>
                          {request.hodDecision.at && (
                            <span className="text-[11px] font-normal text-muted-foreground">
                              {formatDateTime(request.hodDecision.at)}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-muted-foreground">
                          <span className="font-medium text-foreground">By:</span>{" "}
                          {request.hodDecision.by}
                        </p>
                        {request.hodDecision.remark && (
                          <p className="mt-1 text-muted-foreground">
                            <span className="font-medium text-foreground">Remark:</span> &ldquo;
                            {request.hodDecision.remark}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {request.rejectionReason && (
                      <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs text-destructive">
                        <span className="font-semibold">Rejection reason:</span>{" "}
                        {request.rejectionReason}
                      </div>
                    )}

                    {/* Pending Guidance */}
                    {request.status === "PENDING_COUNSELLOR" && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Waiting for assigned counsellor verification.
                      </p>
                    )}
                    {request.status === "PENDING_HOD" && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Verified by Counsellor, awaiting Head of Department approval.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* OD Letter Preview Dialog */}
      <Dialog
        open={letterOpen}
        onOpenChange={(open) => {
          setLetterOpen(open);
          if (!open && activeLetterUrl) {
            URL.revokeObjectURL(activeLetterUrl);
            setActiveLetterUrl(null);
          }
        }}
      >
        <DialogContent className="max-h-[90svh] max-w-3xl overflow-y-auto border-border bg-surface text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Official OD Letter</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground truncate">
              {activeLetterName}
            </DialogDescription>
          </DialogHeader>

          {activeLetterUrl ? (
            <div className="grid gap-3">
              {activeLetterType === "application/pdf" ? (
                <iframe
                  title={`OD letter: ${activeLetterName}`}
                  src={activeLetterUrl}
                  className="h-[60svh] w-full rounded-lg border border-border bg-background"
                />
              ) : (
                <img
                  src={activeLetterUrl}
                  alt={`OD letter: ${activeLetterName}`}
                  className="max-h-[60svh] w-auto max-w-full rounded-lg object-contain mx-auto"
                />
              )}
              <div className="flex justify-end gap-2 pt-2">
                <a
                  href={activeLetterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground active:bg-secondary"
                >
                  <ExternalLink aria-hidden="true" className="size-4" />
                  Open in New Tab
                </a>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLetterOpen(false)}
                  className="min-h-11"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No letter to display.</p>
          )}
        </DialogContent>
      </Dialog>
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
