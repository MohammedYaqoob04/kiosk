import { useMemo, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { getRequestsSnapshot, subscribeToRequests } from "@/lib/leaveStore";
import { ATTENDANCE_MIN, listAllStudents } from "@/lib/staffData";
import type { Status } from "@/types/leave";

type ReportType = "leave-log" | "attendance-shortage";

const statuses: Array<Status | "ALL"> = [
  "ALL",
  "PENDING_COUNSELLOR",
  "REJECTED_BY_COUNSELLOR",
  "PENDING_HOD",
  "APPROVED",
  "REJECTED_BY_HOD",
];

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>): void {
  const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function HodReportsPage() {
  const requests = useSyncExternalStore(
    subscribeToRequests,
    getRequestsSnapshot,
    getRequestsSnapshot,
  );
  const [report, setReport] = useState<ReportType>("leave-log");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const students = useMemo(() => listAllStudents(), []);

  const exportReport = () => {
    if (report === "attendance-shortage") {
      downloadCsv("attendance-shortage.csv", [
        ["Reg No", "Name", "Section", "Attendance %", "Department"],
        ...students
          .filter((student) => student.attendancePercentage < ATTENDANCE_MIN)
          .map((student) => [
            student.regNo,
            student.name,
            student.section,
            student.attendancePercentage,
            student.departmentCode,
          ]),
      ]);
      return;
    }
    const filtered = requests.filter((request) => {
      const date = request.createdAt.slice(0, 10);
      return (
        (!fromDate || date >= fromDate) &&
        (!toDate || date <= toDate) &&
        (status === "ALL" || request.status === status)
      );
    });
    downloadCsv("leave-od-log.csv", [
      ["Date", "Request ID", "Reg No", "Student", "Kind", "Category", "From", "To", "Status", "Counsellor", "HOD"],
      ...filtered.map((request) => [
        request.createdAt.slice(0, 10),
        request.id,
        request.studentRegNo,
        request.studentName,
        request.kind,
        request.category,
        request.fromDate,
        request.toDate,
        request.status,
        request.counsellorDecision?.by ?? "",
        request.hodDecision?.by ?? "",
      ]),
    ]);
  };

  return (
    <div className="staff-portal-page">
      <PageBanner title="Reports" subtitle="Export department leave and attendance data" icon={Download} />
      <section className="erp-surface grid gap-4 p-4 lg:grid-cols-2">
        <label className="grid gap-2 font-semibold">
          Report
          <select
            value={report}
            onChange={(event) => setReport(event.target.value as ReportType)}
            className="min-h-14 rounded-lg border border-border bg-surface px-3"
          >
            <option value="leave-log">Leave/OD log</option>
            <option value="attendance-shortage">Attendance shortage list</option>
          </select>
        </label>
        {report === "leave-log" && (
          <>
            <label className="grid gap-2 font-semibold">
              From date
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="min-h-14 rounded-lg border border-border bg-surface px-3 font-normal"
              />
            </label>
            <label className="grid gap-2 font-semibold">
              To date
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="min-h-14 rounded-lg border border-border bg-surface px-3 font-normal"
              />
            </label>
            <label className="grid gap-2 font-semibold">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as Status | "ALL")}
                className="min-h-14 rounded-lg border border-border bg-surface px-3"
              >
                {statuses.map((value) => (
                  <option key={value} value={value}>{value === "ALL" ? "All statuses" : value.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
          </>
        )}
        <button
          type="button"
          onClick={exportReport}
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground"
        >
          <Download aria-hidden="true" className="size-5" strokeWidth={1.5} />
          Download CSV
        </button>
      </section>
    </div>
  );
}
