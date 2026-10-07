import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import { api } from "@/api";
import { useApi } from "@/api/use-api";
import { DataTable } from "@/components/erp/DataTable";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { requireAuth } from "@/lib/require-auth";
import type { RegisteredSubject } from "@/api/types";

export const Route = createFileRoute("/erp/subjects")({
  beforeLoad: requireAuth,
  component: RegisteredSubjectsPage,
  head: () => ({ meta: [{ title: "Registered Subjects | Student ERP" }] }),
});

function RegisteredSubjectsPage() {
  const { data, loading, error, reload } = useApi(
    ["erp", "registered-subjects"],
    api.getRegisteredSubjects,
  );

  if (loading) return <Skeleton rows={6} className="flex-1 p-4" />;

  if (error || !data) {
    return (
      <div className="p-4">
        <ErrorState
          message={error?.message ?? "Registered subjects are unavailable."}
          onRetry={reload}
        />
      </div>
    );
  }

  const columns = [
    {
      key: "code",
      header: "Code",
      cell: (subject: RegisteredSubject) => (
        <span className="font-semibold text-foreground">{subject.code}</span>
      ),
    },
    {
      key: "title",
      header: "Title",
      cell: (subject: RegisteredSubject) => (
        <span className="text-foreground">{subject.title}</span>
      ),
    },
    {
      key: "credits",
      header: "Credits",
      cell: (subject: RegisteredSubject) => (
        <span className="text-foreground">{subject.credits}</span>
      ),
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
      <PageBanner
        title="Registered Subjects"
        subtitle="Course registrations for the current academic semester"
        icon={BookOpen}
        chip={
          <span className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground">
            {data.totalSubjects} Subjects · {data.totalCredits} Credits
          </span>
        }
      />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DataTable
          label="Registered subjects list"
          columns={columns}
          rows={data.subjects}
          getRowKey={(subject) => subject.code}
          emptyMessage="No registered subjects found."
          className="flex-1"
        />

        <div className="erp-surface mt-3 flex flex-wrap items-center justify-between gap-4 p-4 text-base">
          <div>
            <span className="text-muted-foreground">Total Registered Subjects: </span>
            <span className="font-semibold text-foreground">{data.totalSubjects}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Credits: </span>
            <span className="font-semibold text-foreground">{data.totalCredits}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
