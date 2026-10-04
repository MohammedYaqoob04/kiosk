import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Award, GraduationCap } from "lucide-react";

import { api } from "@/api";
import { useApi } from "@/api/use-api";
import { DataTable } from "@/components/erp/DataTable";
import { EmptyState } from "@/components/erp/EmptyState";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { StatCard } from "@/components/erp/StatCard";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/results")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: ResultsPage,
  head: () => ({ meta: [{ title: "University Examination Results | Student ERP" }] }),
});

function ResultsPage() {
  const { data, loading, error, reload } = useApi(["erp", "results"], api.getResults);
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  if (loading) return <Skeleton rows={4} className="flex-1 p-4" />;
  if (error || !data) {
    return (
      <div className="p-4">
        <ErrorState message={error?.message ?? "Results are unavailable."} onRetry={reload} />
      </div>
    );
  }

  if (!data.published) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        <PageBanner
          title="University Examination Results"
          subtitle="Semester-wise Academic Performance"
          icon={GraduationCap}
        />
        <EmptyState
          title="University results not published yet"
          description="Your examination results will appear here once they are published."
        />
      </div>
    );
  }

  const semesters = data.semesters;
  const activeSemester =
    semesters.find((semester) => semester.semester === selectedSemester) ?? semesters[0];

  if (!activeSemester) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        <PageBanner
          title="University Examination Results"
          subtitle="Semester-wise Academic Performance"
          icon={GraduationCap}
        />
        <EmptyState
          title="No semester results available"
          description="No published semester records are available for this account."
        />
      </div>
    );
  }

  const columns = [
    {
      key: "code",
      header: "Subject Code",
      cell: (subject: (typeof activeSemester.subjects)[number]) => subject.code,
    },
    {
      key: "name",
      header: "Subject Name",
      cell: (subject: (typeof activeSemester.subjects)[number]) => subject.name,
    },
    {
      key: "grade",
      header: "Grade",
      cell: (subject: (typeof activeSemester.subjects)[number]) => subject.grade,
    },
    {
      key: "result",
      header: "Result",
      cell: (subject: (typeof activeSemester.subjects)[number]) => subject.result,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 lg:overflow-hidden">
      <PageBanner
        title="University Examination Results"
        subtitle="Semester-wise Academic Performance"
        icon={GraduationCap}
        chip={<span className="text-sm text-muted-foreground">Sample data</span>}
      />
      <nav aria-label="Select semester" className="flex shrink-0 gap-2 overflow-x-auto">
        {semesters.map((semester) => (
          <button
            key={semester.semester}
            type="button"
            aria-pressed={activeSemester.semester === semester.semester}
            onClick={() => setSelectedSemester(semester.semester)}
            className={`min-h-14 min-w-24 rounded-xl border px-5 text-base font-semibold ${
              activeSemester.semester === semester.semester
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground active:bg-secondary"
            }`}
          >
            Semester {semester.semester}
          </button>
        ))}
      </nav>
      {activeSemester.gpa !== undefined && (
        <StatCard
          label={`Semester ${activeSemester.semester} GPA`}
          value={activeSemester.gpa.toFixed(2)}
          detail="Grade point average"
          icon={Award}
        />
      )}
      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <h2 className="shrink-0 text-lg font-semibold text-foreground">
          Semester {activeSemester.semester} subjects
        </h2>
        <DataTable
          label={`Semester ${activeSemester.semester} results`}
          columns={columns}
          rows={activeSemester.subjects}
          getRowKey={(subject) => subject.code}
          emptyMessage="No subject results are available for this semester."
        />
      </section>
    </div>
  );
}
