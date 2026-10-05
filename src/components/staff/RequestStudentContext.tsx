import { api } from "@/api";
import { useApi } from "@/api/use-api";
import type { Request } from "@/types/leave";

function formatStatus(status: string): string {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function RequestStudentContext({ selected }: { selected: Request }) {
  const summaryQuery = useApi(["staffStudentSummary", selected.studentRegNo], () =>
    api.getStaffStudentSummary(selected.studentRegNo),
  );
  const student = summaryQuery.data;
  const previousRequests = (student?.recentRequests ?? [])
    .filter((request) => String(request.id) !== String(selected.id))
    .slice(0, 3);

  return (
    <section className="grid gap-3 rounded-xl border border-border bg-surface p-3">
      <div>
        <h3 className="font-semibold text-foreground">Student context</h3>
        <p className="text-sm text-muted-foreground">
          Attendance:{" "}
          {student && student.attendancePercentage !== null
            ? `${student.attendancePercentage}%`
            : summaryQuery.loading
              ? "Loading..."
              : "Unavailable"}
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
                <span className="text-muted-foreground">{formatStatus(request.status)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            {summaryQuery.loading ? "Loading requests..." : "No previous requests."}
          </p>
        )}
      </div>
    </section>
  );
}
