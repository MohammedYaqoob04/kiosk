import { useSyncExternalStore } from "react";

import { getRequestsSnapshot, subscribeToRequests } from "@/lib/leaveStore";
import { getStudentSummary } from "@/lib/staffData";
import type { Request } from "@/types/leave";

function formatStatus(request: Request): string {
  return request.status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function RequestStudentContext({ selected }: { selected: Request }) {
  const requests = useSyncExternalStore(
    subscribeToRequests,
    getRequestsSnapshot,
    getRequestsSnapshot,
  );
  const student = getStudentSummary(selected.studentRegNo);
  const previousRequests = requests
    .filter(
      (request) => request.studentRegNo === selected.studentRegNo && request.id !== selected.id,
    )
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 3);

  return (
    <section className="grid gap-3 rounded-xl border border-border bg-surface p-3">
      <div>
        <h3 className="font-semibold text-foreground">Student context</h3>
        <p className="text-sm text-muted-foreground">
          Attendance: {student ? `${student.attendancePercentage}%` : "Unavailable"}
        </p>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">Last 3 previous requests</h4>
        {previousRequests.length ? (
          <ul className="mt-2 grid gap-2">
            {previousRequests.map((request) => (
              <li key={request.id} className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-foreground">
                  {request.kind} · {request.fromDate} – {request.toDate}
                </span>
                <span className="text-muted-foreground">{formatStatus(request)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">No previous requests.</p>
        )}
      </div>
    </section>
  );
}
