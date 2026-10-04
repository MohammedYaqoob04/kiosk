import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { decideLeaveRequest, useLeaveRequests } from "@/lib/leave-store";
import type { LeaveDecision } from "@/types/leave";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/staff/leave")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: StaffLeaveQueue,
  head: () => ({ meta: [{ title: "Leave requests | Staff ERP" }] }),
});

function StaffLeaveQueue() {
  const { user } = useAuth();
  const requests = useLeaveRequests();
  const queue =
    user?.role === "COUNSELLOR"
      ? requests.filter(
          (request) =>
            request.status === "PENDING_COUNSELLOR" &&
            request.assignedCounsellorId === user.identifier,
        )
      : user?.role === "HOD"
        ? requests.filter(
            (request) => request.status === "PENDING_HOD" && request.department === user.department,
          )
        : [];

  const actOnRequest = (id: string, decision: LeaveDecision) => {
    const updated = decideLeaveRequest(id, decision);
    if (!updated) {
      toast.error("That request could not be found.");
      return;
    }
    const verb = decision === "APPROVE" ? "approved" : "rejected";
    toast.success(
      updated.status === "PENDING_HOD"
        ? `Request ${verb} by counsellor. Forwarded to HOD.`
        : `Request ${verb}.`,
    );
  };

  if (user?.role !== "COUNSELLOR" && user?.role !== "HOD") {
    return (
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-8">
        <PageHeader title="Leave requests" />
        <p className="text-lg text-muted-foreground">
          This queue is available to counsellors and HODs.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-8 sm:py-8">
      <Toaster position="top-center" />
      <PageHeader
        title="Leave / OD requests"
        description={
          user.role === "COUNSELLOR"
            ? "Requests assigned to you and awaiting counsellor review."
            : `Requests awaiting HOD review · ${user.department}`
        }
      />
      {queue.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card p-6">
          <p className="text-lg text-muted-foreground">No requests are waiting in your queue.</p>
        </section>
      ) : (
        <div className="grid gap-4">
          {queue.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-primary">
                    {request.type === "LEAVE" ? "Leave request" : "On Duty request"}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">
                    {request.studentName}
                  </h2>
                </div>
                <span className="inline-flex min-h-10 items-center rounded-full border border-border bg-secondary px-4 text-lg font-medium text-foreground">
                  {request.status.replaceAll("_", " ")}
                </span>
              </div>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Register number", request.registerNo],
                  ["Department", request.department],
                  ["Dates", `${request.fromDate} – ${request.toDate}`],
                  ["Reason", request.reason],
                  ["Residential address", request.residentialAddress],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="min-h-20 rounded-xl border border-border bg-background p-4"
                  >
                    <dt className="text-lg text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-words text-lg font-medium text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => actOnRequest(request.id, "APPROVE")}
                  className="min-h-14 flex-1 text-lg font-semibold"
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => actOnRequest(request.id, "REJECT")}
                  className="min-h-14 flex-1 text-lg font-semibold"
                >
                  Reject
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
