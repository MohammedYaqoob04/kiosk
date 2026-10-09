import { useMemo, useState } from "react";
import { Activity } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { useAuth } from "@/lib/auth-context";
import { api, formatServerError } from "@/api";
import { useApi } from "@/api/use-api";
import type { AuditAction } from "@/api/types";

const actions: Array<AuditAction | "ALL"> = [
  "ALL",
  "REQUEST_SUBMIT",
  "COUNSELLOR_APPROVE",
  "COUNSELLOR_REJECT",
  "HOD_APPROVE",
  "HOD_REJECT",
  "COUNSELLOR_REASSIGN",
  "STUDENT_ASSIGN",
  "STUDENT_UNASSIGN",
  "NOTICE_CREATE",
  "NOTICE_WITHDRAW",
];

function formatAuditTime(time: string): string {
  const d = new Date(time);
  return Number.isNaN(d.getTime())
    ? time
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function ActivityLogPage({ role }: { role: "COUNSELLOR" | "HOD" }) {
  const { user } = useAuth();
  const [action, setAction] = useState<AuditAction | "ALL">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const auditQuery = useApi(
    ["auditLog", action, fromDate, toDate],
    () =>
      api.getAuditLog({
        ...(action !== "ALL" ? { action } : {}),
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
      }),
  );

  const filtered = useMemo(() => {
    const list = auditQuery.data ?? [];
    return list
      .filter((entry) => {
        if (role === "HOD") return true;
        const userName = user?.name || "";
        return entry.actor === userName || entry.role === "COUNSELLOR";
      })
      .sort((a, b) => Date.parse(b.time) - Date.parse(a.time));
  }, [auditQuery.data, role, user]);

  return (
    <div className="staff-portal-page flex flex-col gap-5 p-4 sm:p-6 overflow-y-auto">
      <PageBanner title="Activity Vlog" subtitle="Official department activity vlog" icon={Activity} />
      <section className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">
          Action
          <select
            value={action}
            onChange={(event) => setAction(event.target.value as AuditAction | "ALL")}
            className="min-h-14 rounded-lg border border-border bg-surface px-3"
          >
            {actions.map((value) => (
              <option key={value} value={value}>
                {value === "ALL" ? "All actions" : value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          From date
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="min-h-14 rounded-lg border border-border bg-surface px-3 font-normal"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          To date
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="min-h-14 rounded-lg border border-border bg-surface px-3 font-normal"
          />
        </label>
      </section>
      <section className="erp-surface min-h-0 flex-1 overflow-auto">
        {auditQuery.loading ? (
          <p className="p-6 text-center text-muted-foreground">Loading activity log...</p>
        ) : auditQuery.error ? (
          <p className="p-6 text-center text-destructive">{formatServerError(auditQuery.error)}</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground font-medium">No activities available</p>
        ) : (
          <table className="w-full min-w-[760px] text-left">
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                {["Time", "Actor", "Role", "Action", "Target", "Reason"].map((heading) => (
                  <th key={heading} className="border-b border-border p-3">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border">
                  <td className="p-3">{formatAuditTime(entry.time)}</td>
                  <td className="p-3">{entry.actor}</td>
                  <td className="p-3">{entry.role}</td>
                  <td className="p-3">{entry.action.replaceAll("_", " ")}</td>
                  <td className="p-3">{entry.targetId}</td>
                  <td className="p-3">{entry.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
