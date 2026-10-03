import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ClipboardCheck, UserRound } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { demoCoeExamSchedule } from "@/mock/coe";
import { demoStudent } from "@/mock/erp";

export const Route = createFileRoute("/coe/portal")({
  component: CoePortalPage,
  head: () => ({ meta: [{ title: "Student Exam Portal | Arunai" }] }),
});

function CoePortalPage() {
  return (
    <div className="mx-auto grid w-full max-w-screen-2xl gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <PageHeader
          eyebrow="Student examination portal · Demo"
          title="Exam Portal"
          description="Examination information for the sample student account."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/coe/results"
            className="flex min-h-32 items-center gap-4 rounded-xl border border-border bg-secondary p-5 text-foreground active:bg-accent"
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-border bg-card text-icon">
              <ClipboardCheck aria-hidden="true" className="size-6" />
            </span>
            <span>
              <span className="block text-lg font-semibold">Results</span>
              <span className="mt-1 block text-lg text-muted-foreground">View semester marks</span>
            </span>
          </Link>
          <article className="flex min-h-32 items-center gap-4 rounded-xl border border-border bg-secondary p-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-border bg-card text-icon">
              <UserRound aria-hidden="true" className="size-6" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-semibold text-foreground">Student Profile</span>
              <span className="mt-1 block truncate text-lg text-muted-foreground">
                {demoStudent.name}
              </span>
              <span className="block text-base text-muted-foreground">
                {demoStudent.registerNumber}
              </span>
            </span>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-icon">
            <CalendarDays aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-lg text-muted-foreground">Examination schedule</p>
            <h2 className="font-display text-2xl font-semibold text-foreground">Exam Timetable</h2>
          </div>
        </div>
        <div className="grid gap-3">
          {demoCoeExamSchedule.map((exam) => (
            <article key={exam.id} className="rounded-xl border border-border bg-secondary p-4">
              <h3 className="text-lg font-semibold text-foreground">{exam.title}</h3>
              <p className="mt-1 text-lg text-muted-foreground">{exam.date}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
