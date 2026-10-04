import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { demoTimetable } from "@/mock/erp";
import { requireAuth } from "@/lib/require-auth";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const periods = [1, 2, 3, 4, 5, 6, 7] as const;

export const Route = createFileRoute("/erp/timetable")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: TimetablePage,
  head: () => ({ meta: [{ title: "Timetable | Student ERP" }] }),
});

function TimetablePage() {
  const [selectedDay, setSelectedDay] = useState<(typeof weekdays)[number]>("Monday");
  const selectedEntries = demoTimetable.filter((entry) => entry.day === selectedDay);

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader title="Timetable" description="Weekly schedule · Sample data" />

      <section
        aria-label="Weekly timetable"
        className="hidden overflow-x-auto rounded-2xl border border-border bg-card p-5 lg:block lg:p-7"
      >
        <table className="w-full min-w-[900px] table-fixed border-collapse text-left">
          <thead>
            <tr>
              <th
                scope="col"
                className="w-28 border-b border-border p-3 text-lg font-semibold text-muted-foreground"
              >
                Day
              </th>
              {periods.map((period) => (
                <th
                  key={period}
                  scope="col"
                  className="border-b border-border p-3 text-lg font-semibold text-foreground"
                >
                  Period {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekdays.map((day) => (
              <tr key={day}>
                <th
                  scope="row"
                  className="border-b border-border p-3 text-lg font-semibold text-foreground"
                >
                  {day}
                </th>
                {periods.map((period) => {
                  const entry = demoTimetable.find(
                    (item) => item.day === day && item.period === period,
                  );
                  return (
                    <td key={period} className="border-b border-border p-3 align-top">
                      {entry ? (
                        <div className="min-h-24 rounded-xl border border-border bg-secondary p-3">
                          <p className="text-lg font-semibold text-foreground">{entry.subject}</p>
                          <p className="mt-1 text-lg text-muted-foreground">{entry.room}</p>
                        </div>
                      ) : (
                        <span className="text-lg text-muted-foreground">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 lg:hidden sm:p-6">
        <h2 className="mb-3 font-display text-xl font-semibold text-foreground">Choose a day</h2>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
          {weekdays.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              aria-pressed={selectedDay === day}
              className={`min-h-14 shrink-0 rounded-xl border px-4 text-lg font-medium ${
                selectedDay === day
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-foreground active:bg-accent"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <h3 className="mb-3 font-display text-xl font-semibold text-foreground">{selectedDay}</h3>
        <ol className="grid gap-3">
          {periods.map((period) => {
            const entry = selectedEntries.find((item) => item.period === period);
            return (
              <li
                key={`${selectedDay}-${period}`}
                className="flex min-h-24 gap-4 rounded-xl border border-border bg-secondary p-4"
              >
                <div className="min-w-28">
                  <p className="text-lg font-semibold text-foreground">Period {period}</p>
                </div>
                <div className="border-l border-border pl-4">
                  <p className="text-lg font-semibold text-foreground">
                    {entry?.subject ?? "No class listed"}
                  </p>
                  {entry && <p className="mt-1 text-lg text-muted-foreground">{entry.room}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
