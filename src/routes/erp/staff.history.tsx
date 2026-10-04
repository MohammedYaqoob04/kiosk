import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { History } from "lucide-react";

import { api, type StaffHistoryFilter } from "@/api";
import { useApi } from "@/api/use-api";
import { DataTable } from "@/components/erp/DataTable";
import { EmptyState } from "@/components/erp/EmptyState";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { getCurrentUser } from "@/lib/auth-session";

export const Route = createFileRoute("/erp/staff/history")({
  beforeLoad: () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/erp", replace: true });
    if (user.role === "STUDENT") throw redirect({ to: "/erp/dashboard", replace: true });
    if (user.role === "HOD") throw redirect({ to: "/erp/hod", replace: true });
    if (user.role !== "COUNSELLOR") throw redirect({ to: "/erp", replace: true });
  },
  shouldReload: true,
  component: StaffHistory,
  head: () => ({ meta: [{ title: "Approval History | Staff ERP" }] }),
});

function StaffHistory() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<StaffHistoryFilter>("ALL");
  const history = useApi(
    ["staff", "history", user?.identifier, filter],
    () => api.getLeaveHistory(user?.identifier ?? "", filter),
    { enabled: Boolean(user?.identifier) },
  );

  if (history.loading) return <Skeleton rows={4} className="flex-1 p-4" />;
  if (history.error || !history.data) {
    return (
      <div className="p-4">
        <ErrorState
          message={history.error?.message ?? "Approval history is unavailable."}
          onRetry={history.reload}
        />
      </div>
    );
  }

  const columns = [
    {
      key: "student",
      header: "Student",
      cell: (row: (typeof history.data)[number]) => (
        <span>
          <span className="block font-semibold">{row.request.studentName}</span>
          <span className="text-sm text-muted-foreground">{row.request.registerNo}</span>
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (row: (typeof history.data)[number]) => (row.request.type === "OD" ? "OD" : "Leave"),
    },
    {
      key: "dates",
      header: "Dates",
      cell: (row: (typeof history.data)[number]) =>
        `${row.request.fromDate} – ${row.request.toDate}`,
    },
    {
      key: "decision",
      header: "Decision",
      cell: (row: (typeof history.data)[number]) => (
        <span
          className={`inline-flex min-h-8 items-center rounded-full border px-3 text-sm font-semibold ${
            row.decision === "APPROVED"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-rose-400/20 bg-rose-400/10 text-rose-300"
          }`}
        >
          {row.decision === "APPROVED" ? "Approved" : "Rejected"}
        </span>
      ),
    },
    {
      key: "remark",
      header: "Remark",
      cell: (row: (typeof history.data)[number]) => row.remark,
    },
    {
      key: "decidedAt",
      header: "Decided",
      cell: (row: (typeof history.data)[number]) =>
        new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
          new Date(row.decidedAt),
        ),
    },
  ];

  return (
    <div className="staff-portal-page">
      <PageBanner title="History" subtitle="Your previous leave and OD decisions" icon={History} />
      <div className="flex shrink-0 gap-2" role="group" aria-label="Filter decisions">
        {(
          [
            ["ALL", "All"],
            ["APPROVED", "Approved"],
            ["REJECTED", "Rejected"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`min-h-14 rounded-xl border px-5 text-base font-semibold ${
              filter === value
                ? "border-violet-300/30 bg-violet-400/10 text-violet-200"
                : "border-white/10 bg-white/[0.04] text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <section className="staff-portal-list">
        {history.data.length === 0 ? (
          <EmptyState title="No past decisions." />
        ) : (
          <DataTable
            label="Past approval decisions"
            columns={columns}
            rows={history.data}
            getRowKey={(row) => row.id}
          />
        )}
      </section>
    </div>
  );
}
