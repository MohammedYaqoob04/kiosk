import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

import { api } from "@/api";
import { useApi } from "@/api/use-api";
import { EmptyState } from "@/components/erp/EmptyState";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/timetable")({
  beforeLoad: requireAuth,
  component: TimetablePage,
  head: () => ({ meta: [{ title: "Today's Timetable | Student ERP" }] }),
});

function TimetablePage() {
  const { user } = useAuth();
  const profile = useApi(["erp", "profile"], api.getProfile);
  const { data, loading, error, reload } = useApi(["erp", "timetable"], () => api.getTimetable());

  if (profile.loading || loading) return <Skeleton rows={5} className="flex-1 p-4" />;
  if (profile.error || error || !profile.data || !data) {
    return (
      <div className="p-4">
        <ErrorState
          message={profile.error?.message ?? error?.message ?? "Timetable is unavailable."}
          onRetry={() => {
            profile.reload();
            reload();
          }}
        />
      </div>
    );
  }

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${data.date}T00:00:00`));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
      <PageBanner
        title="Today's Timetable"
        subtitle="View your hour-wise class schedule"
        icon={CalendarDays}
        chip={
          <span className="rounded-full border border-border px-3 py-2 text-sm">
            {data.dayName}
          </span>
        }
      />
      <section className="erp-surface shrink-0 p-4">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Student Information</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Info label="STUDENT" value={user?.name ?? profile.data.name} />
          <Info label="ROLL NO" value={profile.data.registerNo} />
          <Info label="DEPARTMENT" value={profile.data.department} />
          <Info label="COURSE" value={profile.data.course} />
          <Info label="YEAR" value={String(profile.data.year)} />
          <Info label="SEMESTER" value={String(profile.data.semester)} />
          <Info label="SECTION" value={profile.data.section} />
          <Info label="ACADEMIC YEAR" value={profile.data.academicYear} />
        </dl>
      </section>
      <section className="erp-surface flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{data.dayName}</h2>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <span className="rounded-full border border-border px-3 py-2 text-sm text-foreground">
            {data.hours.length} Hours
          </span>
        </div>
        <h3 className="mb-2 text-base font-semibold text-foreground">Hour-wise Schedule</h3>
        {data.hours.length === 0 ? (
          <div className="grid flex-1 place-items-center">
            <EmptyState
              title="No Classes Scheduled"
              description="There is no timetable entry for your section today."
            />
          </div>
        ) : (
          <ol className="grid min-h-0 gap-2 overflow-y-auto sm:grid-cols-2">
            {data.hours.map((entry) => (
              <li key={entry.hour} className="rounded-xl border border-border bg-surface p-4">
                <p className="font-semibold text-muted-foreground">HOUR {entry.hour}</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{entry.subjectName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{entry.subjectCode}</p>
                {entry.staffName && (
                  <p className="mt-1 text-sm text-muted-foreground">{entry.staffName}</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground">{value}</dd>
    </div>
  );
}
