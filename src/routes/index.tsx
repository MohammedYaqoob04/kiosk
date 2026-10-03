import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ClipboardCheck,
  GraduationCap,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/use-reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arunai Engineering College | KIOSK" },
      {
        name: "description",
        content: "Attendance, marks, leave approvals and examination services in one place.",
      },
      { property: "og:title", content: "Arunai Engineering College | KIOSK" },
      {
        property: "og:description",
        content: "Attendance, marks, leave approvals and examination services in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const studentSearch = { role: "student" } as const;
const staffSearch = { role: "staff" } as const;

function PreviewCluster({ idle }: { idle: boolean }) {
  const idleClass = idle ? "preview-idle" : "";

  return (
    <div className="preview-stage" aria-label="Sample student portal preview">
      <article className={`preview-card attendance-card ${idleClass}`}>
        <div className="flex items-center gap-4">
          <div className="attendance-ring" aria-label="87 percent attendance">
            <span>87%</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">Attendance</p>
            <p className="mt-1 text-base text-muted-foreground">This semester</p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-base">
          <span className="text-muted-foreground">Overall status</span>
          <span className="font-semibold text-foreground">Good standing</span>
        </div>
      </article>

      <article className={`preview-card leave-card ${idleClass}`}>
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-secondary text-icon">
            <ClipboardCheck className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg font-semibold text-foreground">Leave request</p>
            <p className="text-base text-muted-foreground">Sample request · 2 days</p>
          </div>
        </div>
        <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-secondary px-3 text-base font-medium text-foreground">
          <Check className="size-4 text-primary" aria-hidden="true" />
          Approved by HOD
        </span>
      </article>

      <article className={`preview-card timetable-card ${idleClass}`}>
        <div className="mb-4 flex items-center gap-3">
          <CalendarDays className="size-6 text-icon" aria-hidden="true" />
          <p className="text-lg font-semibold text-foreground">Today&apos;s timetable</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["09:00 · CSE", "10:00 · Maths", "11:15 · Lab"].map((period) => (
            <span
              key={period}
              className="inline-flex min-h-10 items-center rounded-md border border-border bg-secondary px-3 text-base text-muted-foreground"
            >
              {period}
            </span>
          ))}
        </div>
      </article>

      <p className="preview-caption">Sample data</p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon: Icon,
  features,
  to,
  search,
}: {
  title: string;
  description: string;
  icon: typeof BookOpen;
  features: readonly string[];
  to: "/erp/login" | "/coe";
  search?: typeof studentSearch;
}) {
  return (
    <Link
      to={to}
      {...(search ? { search } : {})}
      className="feature-card group block rounded-3xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-14 place-items-center rounded-xl border border-border bg-secondary text-icon">
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <span className="grid size-14 place-items-center rounded-full border border-border text-muted-foreground active:bg-secondary">
          <ArrowRight className="size-6" aria-hidden="true" />
        </span>
      </div>
      <h3 className="mt-6 font-display text-2xl font-semibold text-foreground sm:text-3xl">
        {title}
      </h3>
      <p className="mt-2 text-lg text-muted-foreground">{description}</p>
      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex min-h-8 items-center gap-3 text-lg text-foreground">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>
    </Link>
  );
}

function Index() {
  const [idle, setIdle] = useState(false);
  const featureReveal = useReveal<HTMLElement>();
  const processReveal = useReveal<HTMLElement>();

  useEffect(() => {
    let timer: number;
    const resetIdleTimer = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), 60_000);
    };

    resetIdleTimer();
    window.addEventListener("touchstart", resetIdleTimer, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("touchstart", resetIdleTimer);
    };
  }, []);

  return (
    <div className="w-full">
      <section className="mx-auto grid min-h-[80vh] max-w-screen-2xl items-center gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 lg:py-16">
        <div className="hero-copy">
          <p className="entrance entrance-delay-1 font-display text-base font-semibold uppercase tracking-[0.16em] text-primary sm:text-lg">
            Arunai Engineering College · Tiruvannamalai
          </p>
          <h1 className="entrance entrance-delay-2 mt-4 bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text font-display text-6xl font-extrabold leading-none tracking-tight text-transparent sm:text-7xl lg:text-8xl">
            KIOSK
          </h1>
          <p className="entrance entrance-delay-3 mt-6 max-w-xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            Attendance, marks, leave approvals and exam services. One touch away.
          </p>
          <div className="entrance entrance-delay-4 mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="min-h-[72px] justify-between gap-6 px-6 text-lg">
              <Link to="/erp/login" search={studentSearch}>
                Student Login <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="min-h-[72px] justify-between gap-6 px-6 text-lg"
            >
              <Link to="/erp/login" search={staffSearch}>
                Staff / HOD Login <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="entrance entrance-delay-3 flex items-center justify-center">
          <PreviewCluster idle={idle} />
        </div>
      </section>

      <section
        ref={featureReveal.ref}
        data-revealed={featureReveal.revealed}
        className="reveal-on-scroll mx-auto max-w-screen-2xl px-5 pb-16 sm:px-8 sm:pb-20"
      >
        <div className="mb-8 max-w-2xl">
          <p className="font-display text-base font-semibold uppercase tracking-[0.16em] text-primary">
            Services
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Everything you need, in one place
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="reveal-on-scroll" data-revealed={featureReveal.revealed}>
            <FeatureCard
              title="Student ERP"
              description="Everyday academic services, all together."
              icon={GraduationCap}
              features={["Attendance and marks", "Timetable and course details", "Leave and OD requests"]}
              to="/erp/login"
              search={studentSearch}
            />
          </div>
          <div
            className="reveal-on-scroll reveal-delay-2"
            data-revealed={featureReveal.revealed}
          >
            <FeatureCard
              title="Controller of Examinations"
              description="Exam information and services in one place."
              icon={BookOpen}
              features={["Examination notices", "Results and updates", "Examination portal"]}
              to="/coe"
            />
          </div>
        </div>
      </section>

      <section
        ref={processReveal.ref}
        data-revealed={processReveal.revealed}
        className="reveal-on-scroll mx-auto max-w-screen-2xl px-5 pb-20 sm:px-8 sm:pb-24"
      >
        <div className="mb-8 max-w-2xl">
          <p className="font-display text-base font-semibold uppercase tracking-[0.16em] text-primary">
            Clear at every step
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Leave approval, tracked live
          </h2>
        </div>
        <ol className="process-track" data-revealed={processReveal.revealed}>
          {["Submitted", "Counsellor", "HOD", "Approved"].map((step, index) => (
            <li className={`process-step process-step-${index + 1}`} key={step}>
              <span className="process-dot">
                <span>
                  {index === 3 ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                </span>
              </span>
              <span className="text-lg font-medium text-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
