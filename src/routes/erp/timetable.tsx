import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

import { api } from "@/api";
import { useApi } from "@/api/use-api";
import { EmptyState } from "@/components/erp/EmptyState";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { requireAuth } from "@/lib/require-auth";
import { useAuth } from "@/lib/auth-context";
import { subscribeToTimetableUpdates } from "@/lib/timetable-store";
import type { TimetableWeekDay } from "@/api/types";

export const Route = createFileRoute("/erp/timetable")({
  beforeLoad: requireAuth,
  component: TimetablePage,
  head: () => ({ meta: [{ title: "Weekly Timetable | Student ERP" }] }),
});

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function TimetablePage() {
  const { user } = useAuth();
  const studentClass =
    user?.year === "4" || user?.year === "IV"
      ? "IV-A"
      : user?.year === "2" || user?.year === "II"
        ? "II-A"
        : "III-A";

  const { data, loading, error, reload } = useApi(
    ["erp", "timetable", studentClass],
    () => api.getTimetable(undefined, studentClass),
  );

  useEffect(() => {
    return subscribeToTimetableUpdates(() => {
      void reload();
    });
  }, [reload]);
  const [selectedDay, setSelectedDay] = useState<string>("ALL");

  if (loading) return <Skeleton rows={5} className="flex-1 p-4" />;
  if (error || !data) {
    return (
      <div className="p-4">
        <ErrorState
          message={error?.message ?? "Timetable is unavailable."}
          onRetry={reload}
        />
      </div>
    );
  }

  // Ensure we have full week data Monday to Saturday
  const fullWeekDays: TimetableWeekDay[] =
    data.days && data.days.length > 0
      ? data.days
      : WEEKDAY_NAMES.map((name, index) => ({
          dayName: name,
          weekday: index,
          hall: data.hall ?? null,
          hours: data.hours,
        }));

  const hasAnySchedule = fullWeekDays.some((d) => d.hours.some((h) => !h.isFree));

  if (!hasAnySchedule) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
        <PageBanner
          title="Weekly Timetable"
          subtitle="Complete weekly schedule (Monday to Saturday)"
          icon={CalendarDays}
        />
        <div className="grid flex-1 place-items-center rounded-xl border border-border bg-surface p-8 text-center text-muted-foreground">
          <EmptyState
            title="No timetable available."
            description={`No timetable has been published for Class ${studentClass}.`}
          />
        </div>
      </div>
    );
  }

  const visibleDays =
    selectedDay === "ALL"
      ? fullWeekDays
      : fullWeekDays.filter((d) => d.dayName.toLowerCase() === selectedDay.toLowerCase());

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
      <PageBanner
        title="Weekly Timetable"
        subtitle="Complete weekly schedule (Monday to Saturday)"
        icon={CalendarDays}
        chip={
          data.hall ? (
            <span className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground">
              Room / Lab: {data.hall}
            </span>
          ) : undefined
        }
      />

      {/* Day Filter Tabs - Touch Friendly (>= 56px min hit area) */}
      <div
        role="tablist"
        aria-label="Filter by day"
        className="erp-surface flex shrink-0 flex-wrap items-center gap-2 p-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedDay === "ALL"}
          onClick={() => setSelectedDay("ALL")}
          className={`inline-flex min-h-14 min-w-[70px] items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors ${
            selectedDay === "ALL"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-foreground hover:bg-surface-2"
          }`}
        >
          Full Week
        </button>
        {WEEKDAY_NAMES.map((dayName) => (
          <button
            key={dayName}
            type="button"
            role="tab"
            aria-selected={selectedDay === dayName}
            onClick={() => setSelectedDay(dayName)}
            className={`inline-flex min-h-14 min-w-[90px] items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors ${
              selectedDay === dayName
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground hover:bg-surface-2"
            }`}
          >
            {dayName}
          </button>
        ))}
      </div>

      {/* Schedule Container */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {visibleDays.map((day) => {
          const activeSlots = day.hours.filter((h) => !h.isFree);
          return (
            <section
              key={day.dayName}
              className="erp-surface shrink-0 p-4"
              aria-label={`${day.dayName} schedule`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-foreground">{day.dayName}</h2>
                  {(day.hall || data.hall) && (
                    <span className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs font-medium text-foreground">
                      Room / Lab: {day.hall || data.hall}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {activeSlots.length} {activeSlots.length === 1 ? "Period" : "Periods"} Scheduled
                </span>
              </div>

              {activeSlots.length === 0 ? (
                <div className="py-6 text-center">
                  <EmptyState
                    title={`No Classes on ${day.dayName}`}
                    description={`There are no scheduled classes for ${day.dayName}.`}
                  />
                </div>
              ) : (
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {activeSlots.map((entry) => {
                    const timeRange =
                      entry.time ||
                      (entry.startTime && entry.endTime
                        ? `${entry.startTime} - ${entry.endTime}`
                        : "");
                    const roomInfo = entry.room || day.hall || data.hall;

                    return (
                      <li
                        key={`${day.dayName}-hour-${entry.hour}`}
                        className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                            <span>PERIOD {entry.hour}</span>
                            {timeRange && (
                              <span className="font-mono text-foreground">{timeRange}</span>
                            )}
                          </div>
                          <p className="mt-2 text-base font-semibold text-foreground">
                            {entry.subjectName || entry.subjectCode || "Class"}
                          </p>
                          {entry.subjectCode && (
                            <p className="mt-0.5 text-xs font-mono text-muted-foreground">
                              {entry.subjectCode}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Faculty: </span>
                            <span className="font-medium text-foreground">
                              {entry.staffName || "Not assigned"}
                            </span>
                          </div>
                          {roomInfo && (
                            <div>
                              <span className="text-muted-foreground">Room/Lab: </span>
                              <span className="font-medium text-foreground">{roomInfo}</span>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
