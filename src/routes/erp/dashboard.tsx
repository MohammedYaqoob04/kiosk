import { createFileRoute } from "@tanstack/react-router";

import { useAuth } from "@/lib/auth-context";
import {
  demoAttendanceSummary,
  demoDashboardSubjectMarks,
  demoStudentDashboardDetails,
  demoTodayAttendance,
} from "@/mock/erp";

export const Route = createFileRoute("/erp/dashboard")({
  component: StudentDashboard,
  head: () => ({ meta: [{ title: "Dashboard | Arunai ERP" }] }),
});

function StudentDashboard() {
  const { user } = useAuth();

  const informationCards = [
    { label: "ROLL NUMBER", value: user?.identifier ?? "—", detail: "Student identity" },
    { label: "BATCH", value: demoStudentDashboardDetails.batch, detail: "Academic batch" },
    {
      label: "DEPARTMENT",
      value: demoStudentDashboardDetails.department,
      detail: "Current program",
    },
    {
      label: "ATTENDANCE",
      value: demoStudentDashboardDetails.attendancePercentage,
      detail: demoStudentDashboardDetails.attendanceStatus,
    },
  ];

  return (
    <div className="erp-dashboard min-w-0 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card p-5 shadow-card sm:p-7">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-base font-semibold uppercase tracking-[0.14em] text-primary">
              Student dashboard · Sample data
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
              Welcome, {user?.name ?? "Student"}
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Arunai Engineering College (Autonomous)
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-secondary p-4">
            <div
              role="img"
              aria-label={`Attendance ${demoAttendanceSummary.percentage}%`}
              className="grid size-20 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(var(--primary) 0 ${demoAttendanceSummary.percentage}%, var(--border) ${demoAttendanceSummary.percentage}% 100%)`,
              }}
            >
              <span className="grid size-16 place-items-center rounded-full bg-card font-display text-sm font-bold text-foreground">
                {demoAttendanceSummary.percentage}%
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Attendance</p>
              <p className="text-lg text-primary">{demoStudentDashboardDetails.attendanceStatus}</p>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Student information"
        className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4"
      >
        {informationCards.map(({ label, value, detail }) => (
          <article
            key={label}
            className="relative min-h-36 overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <span className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-primary" />
            <p className="text-lg font-semibold tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-3 break-words font-display text-2xl font-bold text-primary">{value}</p>
            {detail && <p className="mt-1 text-base font-medium text-foreground">{detail}</p>}
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Today&apos;s Attendance
          </h2>
          <p className="text-lg font-medium text-muted-foreground">
            {demoStudentDashboardDetails.attendanceDate}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
          {demoTodayAttendance.map(({ hour, value }) => (
            <article
              key={hour}
              className="flex min-h-28 flex-col justify-center rounded-xl border border-border bg-background p-4 text-center shadow-sm"
            >
              <h3 className="text-lg font-semibold text-muted-foreground">HOUR {hour}</h3>
              <p className="mt-2 font-display text-2xl font-bold text-primary">{value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <h2 className="mb-5 font-display text-2xl font-bold text-foreground">
          Subject Wise Marks Report
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="bg-secondary text-lg font-semibold text-foreground">
                <th scope="col" className="px-4 py-4">
                  SUBJECT CODE
                </th>
                <th scope="col" className="px-4 py-4">
                  SUBJECT NAME
                </th>
                <th scope="col" className="px-4 py-4">
                  CIA - I
                </th>
                <th scope="col" className="px-4 py-4">
                  ASMT - 1
                </th>
                <th scope="col" className="px-4 py-4">
                  CIA - II
                </th>
                <th scope="col" className="px-4 py-4">
                  ASMT - 2
                </th>
                <th scope="col" className="px-4 py-4">
                  MODEL
                </th>
              </tr>
            </thead>
            <tbody>
              {demoDashboardSubjectMarks.map((subject) => (
                <tr key={subject.code} className="border-t border-border even:bg-background/60">
                  <td className="px-4 py-4 text-lg font-semibold text-primary">{subject.code}</td>
                  <td className="px-4 py-4 text-lg text-foreground">{subject.subject}</td>
                  <td className="px-4 py-4 text-lg text-foreground">{subject.cia1}</td>
                  <td className="px-4 py-4 text-lg text-foreground">{subject.asmt1}</td>
                  <td className="px-4 py-4 text-lg text-foreground">{subject.cia2}</td>
                  <td className="px-4 py-4 text-lg text-foreground">{subject.asmt2}</td>
                  <td className="px-4 py-4 text-lg text-foreground">{subject.model}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
