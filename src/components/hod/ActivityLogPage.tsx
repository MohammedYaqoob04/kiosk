import { useMemo, useState, useSyncExternalStore } from "react";
import { Activity } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { useAuth } from "@/lib/auth-context";
import { getAuditSnapshot, subscribeToAudit, type AuditAction } from "@/lib/auditLog";

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

export function ActivityLogPage({ role }: { role: "COUNSELLOR" | "HOD" }) {
  const { user } = useAuth();
  const entries = useSyncExternalStore(subscribeToAudit, getAuditSnapshot, getAuditSnapshot);
  const [action, setAction] = useState<AuditAction | "ALL">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const filtered = useMemo(
    () =>
      entries
        .filter((entry) => (role === "HOD" || entry.actor === user?.name))
        .filter((entry) => action === "ALL" || entry.action === action)
        .filter((entry) => {
          const date = entry.time.slice(0, 10);
          return (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
        })
        .sort((a, b) => Date.parse(b.time) - Date.parse(a.time)),
    [entries, role, user?.name, action, fromDate, toDate],
  );

  return (
    <div className="staff-portal-page">
      <PageBanner title="Activity Log" subtitle="Append-only portal activity" icon={Activity} />
      <section className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">
          Action
          <select value={action} onChange={(event) => setAction(event.target.value as AuditAction | "ALL")} className="min-h-14 rounded-lg border border-border bg-surface px-3">
            {actions.map((value) => <option key={value} value={value}>{value === "ALL" ? "All actions" : value.replaceAll("_", " ")}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          From date
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="min-h-14 rounded-lg border border-border bg-surface px-3 font-normal" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          To date
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="min-h-14 rounded-lg border border-border bg-surface px-3 font-normal" />
        </label>
      </section>
      <section className="erp-surface min-h-0 flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">No activity recorded.</p>
        ) : (
          <table className="w-full min-w-[760px] text-left">
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                {["Time", "Actor", "Role", "Action", "Target", "Reason"].map((heading) => <th key={heading} className="border-b border-border p-3">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border">
                  <td className="p-3">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.time))}</td>
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
