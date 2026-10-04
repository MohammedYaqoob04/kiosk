import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";

import { TouchTextInput } from "@/components/TouchTextInput";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { createLeaveRequest, useLeaveRequests } from "@/lib/leave-store";
import { requireAuth } from "@/lib/require-auth";
import type { LeaveRequestType } from "@/types/leave";

const reasonChoices = ["Medical", "Family function", "Other"] as const;
const timelineStages = ["Submitted", "Counsellor", "HOD", "Final"] as const;

export const Route = createFileRoute("/erp/leave")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: StudentLeavePage,
  head: () => ({ meta: [{ title: "Leave and OD | Student ERP" }] }),
});

function formatDate(date: string): string {
  if (!date) return "Awaiting";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(`${date}T00:00:00`),
  );
}

function StudentLeavePage() {
  const { user } = useAuth();
  const requests = useLeaveRequests().filter((request) => request.registerNo === user?.identifier);
  const [type, setType] = useState<LeaveRequestType>("LEAVE");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reasonChoice, setReasonChoice] = useState<(typeof reasonChoices)[number] | "">("");
  const [otherReason, setOtherReason] = useState("");
  const [address, setAddress] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const reason = reasonChoice === "Other" ? otherReason.trim() : reasonChoice;
  const canSubmit = Boolean(
    user && fromDate && toDate && fromDate <= toDate && reason && address.trim(),
  );

  const submit = () => {
    if (!user || !canSubmit) {
      setError("Complete the date range, reason and residential address.");
      return;
    }
    createLeaveRequest({
      type,
      studentName: user.name,
      registerNo: user.identifier,
      department: user.department,
      fromDate,
      toDate,
      reason,
      residentialAddress: address.trim(),
      assignedCounsellorId: "9999900101",
    });
    setFromDate("");
    setToDate("");
    setReasonChoice("");
    setOtherReason("");
    setAddress("");
    setError("");
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Leave / OD requests"
        description="Submit a request and track its approval stages."
      />

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
        <h2 className="font-display text-2xl font-semibold text-foreground">New request</h2>
        <div className="mt-5 flex flex-wrap gap-3" role="group" aria-label="Request type">
          {(["LEAVE", "OD"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              aria-pressed={type === option}
              className={`min-h-14 min-w-32 rounded-xl border px-5 text-lg font-semibold ${
                type === option
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-foreground active:bg-accent"
              }`}
            >
              {option === "LEAVE" ? "Leave" : "On Duty (OD)"}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-lg font-medium text-foreground">
            From date
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.currentTarget.value)}
              className="min-h-14 rounded-xl border border-input bg-background px-4 text-lg text-foreground [color-scheme:dark]"
            />
          </label>
          <label className="grid gap-2 text-lg font-medium text-foreground">
            To date
            <input
              type="date"
              min={fromDate || undefined}
              value={toDate}
              onChange={(event) => setToDate(event.currentTarget.value)}
              className="min-h-14 rounded-xl border border-input bg-background px-4 text-lg text-foreground [color-scheme:dark]"
            />
          </label>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-3 text-lg font-medium text-foreground">Reason</legend>
          <div className="flex flex-wrap gap-3">
            {reasonChoices.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => {
                  setReasonChoice(choice);
                  setError("");
                }}
                aria-pressed={reasonChoice === choice}
                className={`min-h-14 rounded-full border px-5 text-lg font-medium ${
                  reasonChoice === choice
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-foreground active:bg-accent"
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
        </fieldset>
        {reasonChoice === "Other" && (
          <div className="mt-4">
            <TouchTextInput
              label="Other reason"
              value={otherReason}
              onChange={setOtherReason}
              placeholder="Enter a short reason"
              maxLength={80}
            />
          </div>
        )}
        <div className="mt-4">
          <TouchTextInput
            label="Residential address"
            value={address}
            onChange={setAddress}
            placeholder="Enter your residential address"
            maxLength={160}
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 text-lg text-destructive">
            {error}
          </p>
        )}
        <Button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="mt-5 min-h-14 w-full text-lg font-semibold sm:w-auto sm:px-8"
        >
          Submit request
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
        <h2 className="mb-4 font-display text-2xl font-semibold text-foreground">Your requests</h2>
        {requests.length === 0 ? (
          <p className="text-lg text-muted-foreground">No leave or OD requests yet.</p>
        ) : (
          <div className="grid gap-3">
            {requests.map((request) => {
              const expanded = expandedId === request.id;
              return (
                <article key={request.id} className="rounded-xl border border-border bg-background">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpandedId(expanded ? null : request.id)}
                    className="flex min-h-16 w-full items-center justify-between gap-4 p-4 text-left active:bg-secondary"
                  >
                    <span>
                      <span className="block text-lg font-semibold text-foreground">
                        {request.type === "LEAVE" ? "Leave" : "On Duty"} · {request.reason}
                      </span>
                      <span className="mt-1 block text-lg text-muted-foreground">
                        {formatDate(request.fromDate)} – {formatDate(request.toDate)}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-lg font-semibold text-primary">
                      {request.status.replaceAll("_", " ")}
                      {expanded ? (
                        <ChevronUp aria-hidden="true" />
                      ) : (
                        <ChevronDown aria-hidden="true" />
                      )}
                    </span>
                  </button>
                  {expanded && (
                    <div className="border-t border-border p-4">
                      <p className="text-lg text-muted-foreground">
                        Residential address:{" "}
                        <span className="text-foreground">{request.residentialAddress}</span>
                      </p>
                      <ol className="mt-4 grid gap-3 sm:grid-cols-4">
                        {timelineStages.map((stage) => {
                          const event = request.history.find((entry) => entry.stage === stage);
                          const isCurrent =
                            !event &&
                            ((stage === "Counsellor" && request.status === "PENDING_COUNSELLOR") ||
                              (stage === "HOD" && request.status === "PENDING_HOD"));
                          return (
                            <li
                              key={stage}
                              className="min-h-20 rounded-xl border border-border bg-card p-3"
                            >
                              <p className="text-lg font-semibold text-foreground">{stage}</p>
                              <p className="mt-1 text-lg text-muted-foreground">
                                {event
                                  ? `${event.decision} · ${formatDate(event.at.slice(0, 10))}`
                                  : isCurrent
                                    ? "Pending"
                                    : "Awaiting"}
                              </p>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
