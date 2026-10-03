import { useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, ClipboardList } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { demoCoeExamSchedule, demoCoeNotices } from "@/mock/coe";
import type { CoeNoticeCategory } from "@/types/coe";

export const Route = createFileRoute("/coe")({
  component: CoeLayout,
  head: () => ({ meta: [{ title: "Controller of Examinations | Arunai" }] }),
});

const categories: Array<"All" | CoeNoticeCategory> = ["All", "Exams", "Results", "Circulars"];

function CoeLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isHome = pathname === "/coe";
  const isResults = pathname === "/coe/results";
  const isExamPortal = pathname === "/coe/login" || pathname === "/coe/portal";

  return (
    <>
      <section className="mx-auto w-full max-w-screen-2xl px-4 pt-5 sm:px-8 sm:pt-8">
        <p className="text-lg text-muted-foreground">Arunai Engineering College (Autonomous)</p>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Controller of Examinations
        </h1>
        <nav
          aria-label="COE sections"
          className="mt-4 flex min-h-14 gap-2 overflow-x-auto border-b border-border"
        >
          <Link
            to="/coe"
            activeOptions={{ exact: true }}
            className={`flex min-h-14 shrink-0 items-center border-b-2 px-4 text-lg font-medium ${
              isHome ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            Home
          </Link>
          <Link
            to="/coe/results"
            className={`flex min-h-14 shrink-0 items-center border-b-2 px-4 text-lg font-medium ${
              isResults
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Results
          </Link>
          <Link
            to="/coe/login"
            className={`flex min-h-14 shrink-0 items-center border-b-2 px-4 text-lg font-medium ${
              isExamPortal
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Exam Portal
          </Link>
        </nav>
      </section>
      {isHome ? <CoeHome /> : <Outlet />}
    </>
  );
}

function CoeHome() {
  const [selectedCategory, setSelectedCategory] = useState<"All" | CoeNoticeCategory>("All");
  const notices =
    selectedCategory === "All"
      ? demoCoeNotices
      : demoCoeNotices.filter((notice) => notice.category === selectedCategory);

  return (
    <div className="mx-auto grid w-full max-w-screen-2xl gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
      <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <PageHeader
          eyebrow="Controller of Examinations"
          title="Notices & Circulars"
          description="Sample updates from the examination office."
        />
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2" aria-label="Filter notices">
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              variant={selectedCategory === category ? "default" : "outline"}
              aria-pressed={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
              className="shrink-0"
            >
              {category}
            </Button>
          ))}
        </div>
        <div className="grid gap-3">
          {notices.map((notice) => (
            <article
              key={notice.id}
              className="flex min-h-24 flex-col gap-3 rounded-xl border border-border bg-secondary p-4 sm:flex-row sm:items-center"
            >
              <time className="inline-flex min-h-14 shrink-0 items-center rounded-lg border border-border bg-card px-4 text-lg font-semibold text-primary">
                {notice.date}
              </time>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground">{notice.title}</h2>
                <p className="mt-1 text-lg text-muted-foreground">{notice.description}</p>
              </div>
              <span className="inline-flex min-h-10 w-fit items-center rounded-full border border-border px-3 text-base text-muted-foreground">
                {notice.category}
              </span>
            </article>
          ))}
        </div>
      </section>

      <aside className="grid content-start gap-6">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-14 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-icon">
              <CalendarDays aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-lg text-muted-foreground">Examination schedule</p>
              <h2 className="font-display text-xl font-semibold text-foreground">Exam Timetable</h2>
            </div>
          </div>
          <div className="grid gap-3">
            {demoCoeExamSchedule.map((exam) => (
              <article key={exam.id} className="rounded-xl border border-border bg-secondary p-4">
                <p className="text-lg font-semibold text-foreground">{exam.title}</p>
                <p className="mt-1 text-lg text-muted-foreground">{exam.date}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-base text-muted-foreground">
            Official dates will be published by the COE.
          </p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <span className="grid size-14 place-items-center rounded-xl border border-border bg-secondary text-icon">
            <ClipboardList aria-hidden="true" className="size-6" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
            Student Exam Portal
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Sign in to view examination results and student details.
          </p>
          <Button asChild className="mt-5 w-full">
            <Link to="/coe/login">
              Open Exam Portal <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </section>
      </aside>
    </div>
  );
}
