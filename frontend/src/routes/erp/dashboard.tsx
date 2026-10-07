import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

import { api } from "@/api";
import { useApi } from "@/api/use-api";
import { DataTable } from "@/components/erp/DataTable";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { StatusChip } from "@/components/erp/StatusChip";
import { department } from "@/config/department";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/dashboard")({
  beforeLoad: requireAuth,
  component: StudentDashboard,
  head: () => ({ meta: [{ title: "Dashboard | Arunai ERP" }] }),
});

function StudentDashboard() {
  const { data, loading, error, reload } = useApi(["erp", "dashboard"], api.getDashboard);
  const profile = useApi(["erp", "profile"], api.getProfile);

  if (loading || profile.loading) return <Skeleton rows={4} className="p-4" />;
  if (error || !data || profile.error || !profile.data) {
    return (
      <div className="p-4">
        <ErrorState
          message={error?.message ?? profile.error?.message ?? "Dashboard data is unavailable."}
          onRetry={() => {
            reload();
            profile.reload();
          }}
        />
      </div>
    );
  }

  const attendanceDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(new Date(`${data.today.date}T00:00:00`))
    .replace(/\//g, "-");
  const marksColumns = [
    {
      key: "code",
      header: "SUBJECT CODE",
      cell: (row: (typeof data.marks)[number]) => row.code,
    },
    {
      key: "name",
      header: "SUBJECT NAME",
      cell: (row: (typeof data.marks)[number]) => row.name,
    },
    {
      key: "cia1",
      header: "CIA - I",
      cell: (row: (typeof data.marks)[number]) => row.cia1,
    },
    {
      key: "asmt1",
      header: "ASMT - 1",
      cell: (row: (typeof data.marks)[number]) => row.asmt1,
    },
    {
      key: "cia2",
      header: "CIA - II",
      cell: (row: (typeof data.marks)[number]) => row.cia2,
    },
    {
      key: "asmt2",
      header: "ASMT - 2",
      cell: (row: (typeof data.marks)[number]) => row.asmt2,
    },
    {
      key: "model",
      header: "MODEL",
      cell: (row: (typeof data.marks)[number]) => row.model,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
      <PageBanner title={`Welcome, ${profile.data.name}`} icon={GraduationCap} />
      <section
        aria-label="Student overview"
        className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <InfoCard label="ROLL NUMBER" value={profile.data.registerNo} />
        <InfoCard label="BATCH" value={profile.data.batch} />
        <InfoCard label="DEPARTMENT" value={`${department.code} / A`} />
        <article className="erp-surface min-w-0 p-4">
          <p className="text-sm font-semibold text-muted-foreground">ATTENDANCE</p>
          <p className="mt-2 font-display text-2xl font-semibold text-foreground">
            {data.attendance.overallPercent}%
          </p>
          <StatusChip status={data.attendance.eligible ? "Eligible" : "Low"} />
        </article>
      </section>
      <section className="shrink-0">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-foreground">Today&apos;s Attendance</h2>
          <p className="text-sm text-muted-foreground">Date : {attendanceDate}</p>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {data.today.hours.map((hour) => (
            <article
              key={hour.hour}
              className="erp-surface grid min-h-20 place-items-center p-2 text-center"
            >
              <span className="text-xs font-semibold text-muted-foreground">HOUR {hour.hour}</span>
              <span className="text-lg font-semibold text-foreground">{hour.status ?? "---"}</span>
            </article>
          ))}
        </div>
      </section>
      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <h2 className="shrink-0 text-lg font-semibold text-foreground">
          Subject Wise Marks Report
        </h2>
        <DataTable
          label="Subject Wise Marks Report"
          columns={marksColumns}
          rows={data.marks}
          getRowKey={(row) => row.code}
          className="min-h-0 flex-1"
        />
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="erp-surface min-w-0 p-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-2 truncate font-display text-2xl font-semibold text-foreground">{value}</p>
    </article>
  );
}
