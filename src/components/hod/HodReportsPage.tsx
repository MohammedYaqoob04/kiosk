import { useState } from "react";
import { Download } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import type { Status } from "@/types/leave";
import { api, formatServerError } from "@/api";

type ReportType = "leave-log" | "attendance-shortage";

const statuses: Array<Status | "ALL"> = [
  "ALL",
  "PENDING_COUNSELLOR",
  "REJECTED_BY_COUNSELLOR",
  "PENDING_HOD",
  "APPROVED",
  "REJECTED_BY_HOD",
];

export function HodReportsPage() {
  const [report, setReport] = useState<ReportType>("leave-log");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState<Status | "ALL">("ALL");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const exportReport = async () => {
    setDownloading(true);
    setError("");
    try {
      let blob: Blob;
      let filename: string;
      if (report === "attendance-shortage") {
        blob = await api.getHodShortageReportBlob();
        filename = "attendance-shortage.csv";
      } else {
        blob = await api.getHodLeaveReportBlob({
          ...(fromDate ? { from: fromDate } : {}),
          ...(toDate ? { to: toDate } : {}),
          ...(status !== "ALL" ? { status } : {}),
        });
        filename = "leave-od-log.csv";
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(formatServerError(err, "Failed to download report."));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="staff-portal-page">
      <PageBanner
        title="Reports"
        subtitle="Export department leave and attendance data"
        icon={Download}
      />
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
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={downloading}
            onClick={() => void exportReport()}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Download aria-hidden="true" className="size-5" strokeWidth={1.5} />
            {downloading ? "Downloading..." : "Download CSV"}
          </button>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
