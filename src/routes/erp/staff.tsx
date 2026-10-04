import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock3, MapPin, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, type LeaveRequest } from "@/api";
import { useApi } from "@/api/use-api";
import { EmptyState } from "@/components/erp/EmptyState";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { StatusChip } from "@/components/erp/StatusChip";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/auth-context";
import { getCurrentUser } from "@/lib/auth-session";
import { nextStatus } from "@/lib/leave-store";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/erp/staff")({
  beforeLoad: () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/erp", replace: true });
    if (user.role === "STUDENT") throw redirect({ to: "/erp/dashboard", replace: true });
    if (user.role === "HOD") throw redirect({ to: "/erp/hod", replace: true });
    if (user.role !== "COUNSELLOR") throw redirect({ to: "/erp", replace: true });
  },
  shouldReload: true,
  component: StaffApprovals,
  head: () => ({ meta: [{ title: "Approvals | Staff ERP" }] }),
});

const presetRemarks = ["Insufficient reason", "Please resubmit with details", "Other"] as const;

function StaffApprovals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queue = useApi(
    ["staff", "leave-queue", user?.identifier],
    () => api.getLeaveQueue(user?.identifier ?? ""),
    { enabled: Boolean(user?.identifier) },
  );
  const students = useApi(
    ["staff", "students", user?.identifier],
    () => api.getAssignedStudents(user?.identifier ?? ""),
    { enabled: Boolean(user?.identifier) },
  );
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [remark, setRemark] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [fadingIds, setFadingIds] = useState<Set<string>>(() => new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  if (queue.loading || students.loading) return <Skeleton rows={4} className="flex-1 p-4" />;
  if (queue.error || students.error || !queue.data || !students.data) {
    return (
      <div className="p-4">
        <ErrorState
          message={
            queue.error?.message ?? students.error?.message ?? "Approval data is unavailable."
          }
          onRetry={() => {
            queue.reload();
            students.reload();
          }}
        />
      </div>
    );
  }

  const attendanceByRegister = new Map(
    students.data.map((student) => [student.registerNo, student.attendancePercentage]),
  );
  const orderedQueue = [...queue.data].sort((a, b) =>
    (a.submittedAt ?? a.history[0]?.at ?? "").localeCompare(
      b.submittedAt ?? b.history[0]?.at ?? "",
    ),
  );

  const decide = async (request: LeaveRequest, decision: "APPROVE" | "REJECT", note?: string) => {
    if (decision === "REJECT" && !note?.trim()) return;
    setBusyId(request.id);
    setFadingIds((ids) => new Set(ids).add(request.id));
    try {
      const result = await api.decideLeaveRequest(request.id, decision, note);
      const status = nextStatus(request.status, decision);
      toast.success(
        status === "PENDING_HOD"
          ? "Request approved and forwarded to HOD."
          : `Request ${result.status === "REJECTED" ? "rejected" : "approved"}.`,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["staff", "leave-queue"] }),
        queryClient.invalidateQueries({ queryKey: ["staff", "history"] }),
        queryClient.invalidateQueries({ queryKey: ["staff", "students"] }),
      ]);
      setRejectTarget(null);
      setRemark("");
      setSelectedPreset(null);
    } catch (cause) {
      setFadingIds((ids) => {
        const next = new Set(ids);
        next.delete(request.id);
        return next;
      });
      toast.error(cause instanceof Error ? cause.message : "Could not update this request.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="staff-portal-page">
      <Toaster position="top-center" />
      <PageBanner
        title="Approvals"
        subtitle="Leave and on-duty requests assigned to you"
        icon={UserRound}
        chip={<span className="text-sm text-muted-foreground">{orderedQueue.length} pending</span>}
      />
      <section aria-label="Pending requests" className="staff-portal-list">
        {orderedQueue.length === 0 ? (
          <EmptyState title="No pending requests." />
        ) : (
          orderedQueue.map((request) => {
            const attendance = attendanceByRegister.get(request.registerNo) ?? 0;
            const days = inclusiveDays(request.fromDate, request.toDate);
            const submittedAt = request.submittedAt ?? request.history[0]?.at ?? "";
            return (
              <article
                key={request.id}
                className={`erp-surface staff-approval-card ${fadingIds.has(request.id) ? "is-fading" : ""}`}
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-foreground">
                      {request.studentName}
                    </h2>
                    <p className="text-sm text-muted-foreground">{request.registerNo}</p>
                  </div>
                  <span
                    className={`staff-request-chip ${request.type === "OD" ? "is-od" : "is-leave"}`}
                  >
                    {request.type === "OD" ? "OD" : "Leave"}
                  </span>
                </div>
                <div className="staff-approval-details">
                  <p className="flex items-center gap-2">
                    <CalendarDays aria-hidden="true" className="size-4 text-violet-300" />
                    {request.fromDate} – {request.toDate} · {days} {days === 1 ? "day" : "days"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Reason:</span> {request.reason}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-orange-300" />
                    <span>{request.residentialAddress}</span>
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 aria-hidden="true" className="size-4" />
                    Submitted {formatSubmittedAt(submittedAt)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    Attendance <strong className="text-foreground">{attendance.toFixed(1)}%</strong>
                  </span>
                  <StatusChip status={attendance >= 75 ? "Eligible" : "Low"} />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={busyId === request.id}
                    onClick={() => void decide(request, "APPROVE")}
                    className="min-h-14 flex-1 text-base font-semibold"
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busyId === request.id}
                    onClick={() => {
                      setRejectTarget(request);
                      setRemark("");
                      setSelectedPreset(null);
                    }}
                    className="min-h-14 flex-1 border-rose-300/20 text-rose-200"
                  >
                    Reject
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </section>

      <Sheet
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open && !busyId) setRejectTarget(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto grid w-full max-w-2xl gap-4 rounded-t-3xl border-white/10 bg-[#1A1024] p-5 pb-8 text-foreground"
        >
          <SheetTitle className="pr-14 font-display text-xl">Reject request</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Choose a suggested remark or enter a required note for the student.
          </SheetDescription>
          <div className="flex flex-wrap gap-2">
            {presetRemarks.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={selectedPreset === preset}
                onClick={() => {
                  setSelectedPreset(preset);
                  setRemark(preset === "Other" ? "" : preset);
                }}
                className={`min-h-14 rounded-xl border px-4 text-sm font-medium ${
                  selectedPreset === preset
                    ? "border-rose-300/30 bg-rose-400/10 text-rose-200"
                    : "border-white/10 bg-white/[0.04] text-foreground"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <label className="grid gap-2 text-sm font-medium">
            Remark <span className="sr-only">(required)</span>
            <textarea
              required
              value={remark}
              onChange={(event) => {
                setRemark(event.currentTarget.value);
                setSelectedPreset(null);
              }}
              rows={3}
              className="min-h-24 rounded-xl border border-white/10 bg-black/20 p-3 text-base text-foreground outline-none focus:border-rose-300/40"
              placeholder="Enter the reason for rejection"
            />
          </label>
          <Button
            type="button"
            disabled={!remark.trim() || busyId !== null || !rejectTarget}
            onClick={() => {
              if (rejectTarget) void decide(rejectTarget, "REJECT", remark);
            }}
            className="min-h-14 text-base font-semibold"
          >
            Confirm rejection
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function inclusiveDays(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 1;
  return Math.floor((end - start) / 86_400_000) + 1;
}

function formatSubmittedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "time unavailable"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
