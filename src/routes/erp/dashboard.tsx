import { createFileRoute } from "@tanstack/react-router";
import { Activity, CalendarDays, ClipboardCheck, GraduationCap } from "lucide-react";

import { DataTable } from "@/components/erp/DataTable";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { StatCard } from "@/components/erp/StatCard";
import { StatusChip } from "@/components/erp/StatusChip";
import { api } from "@/api";
import { useApi } from "@/api/use-api";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/dashboard")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: StudentDashboard,
  head: () => ({ meta: [{ title: "Dashboard | Arunai ERP" }] }),
});

function StudentDashboard() {
  const { data, loading, error, reload } = useApi(["erp", "dashboard"], api.getDashboard);

  if (loading) return <Skeleton rows={4} className="p-4" />;
  if (error || !data) {
    return (
      <div className="p-4">
        <ErrorState message={error?.message ?? "Dashboard data is unavailable."} onRetry={reload} />
      </div>
    );
  }

  const attendanceColumns = [
    { key: "hour", header: "Hour", cell: (row: (typeof data.today.hours)[number]) => row.hour },
    {
      key: "subject",
      header: "Subject",
      cell: (row: (typeof data.today.hours)[number]) => row.subjectName,
    },
    {
      key: "status",
      header: "Status",
      cell: (row: (typeof data.today.hours)[number]) =>
        row.status ? (
          <StatusChip
            status={row.status === "OD" ? "OD" : row.status === "PRESENT" ? "Present" : "Absent"}
          />
        ) : null,
    },
  ];
  const marksColumns = [
    { key: "code", header: "Code", cell: (row: (typeof data.marks)[number]) => row.code },
    { key: "name", header: "Subject", cell: (row: (typeof data.marks)[number]) => row.name },
    { key: "cia1", header: "CIA 1", cell: (row: (typeof data.marks)[number]) => row.cia1 },
    { key: "asmt1", header: "Asmt 1", cell: (row: (typeof data.marks)[number]) => row.asmt1 },
    { key: "cia2", header: "CIA 2", cell: (row: (typeof data.marks)[number]) => row.cia2 },
    { key: "asmt2", header: "Asmt 2", cell: (row: (typeof data.marks)[number]) => row.asmt2 },
    { key: "model", header: "Model", cell: (row: (typeof data.marks)[number]) => row.model },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
      <PageBanner
        title="Dashboard"
        subtitle={`Today · ${data.today.date}`}
        icon={GraduationCap}
        chip={
          <span className="rounded-full bg-violet-400/10 px-3 py-1 text-sm text-violet-300">
            Sample data
          </span>
        }
      />
      <section aria-label="Student overview" className="grid shrink-0 gap-3 sm:grid-cols-3">
        <StatCard
          label="Overall attendance"
          value={`${data.attendance.overallPercent}%`}
          detail={`Required: ${data.attendance.thresholdPercent}%`}
          icon={Activity}
          accent="emerald"
        />
        <StatCard
          label="Attendance status"
          value={data.attendance.eligible ? "Eligible" : "Low"}
          detail="Based on sample attendance"
          icon={ClipboardCheck}
          accent={data.attendance.eligible ? "emerald" : "rose"}
        />
        <StatCard
          label="Classes today"
          value={data.today.hours.filter((hour) => hour.subjectName).length}
          detail="Seven timetable periods"
          icon={CalendarDays}
          accent="orange"
        />
      </section>
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
        <section className="flex min-h-0 flex-col gap-2">
          <h2 className="shrink-0 text-lg font-semibold text-foreground">
            Today&apos;s attendance
          </h2>
          <DataTable
            label="Today's attendance"
            columns={attendanceColumns}
            rows={data.today.hours}
            getRowKey={(row) => row.hour}
          />
        </section>
        <section className="flex min-h-0 flex-col gap-2">
          <h2 className="shrink-0 text-lg font-semibold text-foreground">Internal marks</h2>
          <DataTable
            label="Internal marks"
            columns={marksColumns}
            rows={data.marks}
            getRowKey={(row) => row.code}
          />
        </section>
      </div>
    </div>
  );
}
