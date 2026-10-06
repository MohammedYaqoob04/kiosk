import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { useStaffClass, StaffClassSelector } from "@/lib/staff-class-context";
import {
  getClassTimetable,
  hasCustomTimetable,
  resetClassTimetable,
  saveClassTimetable,
  subscribeToTimetableUpdates,
} from "@/lib/timetable-store";
import type { TimetableSlot, TimetableWeekDay } from "@/api/types";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export function StaffTimetablePage() {
  const { activeClass } = useStaffClass();
  const [selectedDay, setSelectedDay] = useState<string>("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to timetable updates
  useEffect(() => {
    return subscribeToTimetableUpdates(() => {
      setRefreshKey((k) => k + 1);
    });
  }, []);

  // Authoritative timetable for active class
  const timetableData = useMemo(() => {
    return getClassTimetable(activeClass);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClass, refreshKey]);

  const isCustom = useMemo(() => hasCustomTimetable(activeClass), [activeClass, refreshKey]);

  // Edit period modal state
  const [editingSlot, setEditingSlot] = useState<{
    dayName: string;
    periodIndex: number;
    slot: TimetableSlot;
    isNew?: boolean;
  } | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleReset = () => {
    if (window.confirm(`Revert Class ${activeClass} timetable to system default?`)) {
      resetClassTimetable(activeClass);
      setRefreshKey((k) => k + 1);
      showToast(`Class ${activeClass} timetable reset to default.`);
    }
  };

  const handleSaveSlot = (
    dayName: string,
    periodIndex: number,
    updatedSlot: TimetableSlot,
    isNew = false,
  ) => {
    const currentDays = structuredClone(timetableData.days ?? []);
    const targetDay = currentDays.find((d) => d.dayName.toLowerCase() === dayName.toLowerCase());

    if (!targetDay) return;

    if (isNew) {
      targetDay.hours.push(updatedSlot);
      targetDay.hours.sort((a, b) => (a.period ?? a.hour) - (b.period ?? b.hour));
    } else {
      targetDay.hours[periodIndex] = updatedSlot;
    }

    saveClassTimetable(activeClass, timetableData.hall ?? "C14", currentDays);
    setEditingSlot(null);
    setRefreshKey((k) => k + 1);
    showToast(`Saved period for ${dayName}.`);
  };

  const handleDeleteSlot = (dayName: string, periodIndex: number) => {
    const currentDays = structuredClone(timetableData.days ?? []);
    const targetDay = currentDays.find((d) => d.dayName.toLowerCase() === dayName.toLowerCase());
    if (!targetDay) return;

    targetDay.hours.splice(periodIndex, 1);
    saveClassTimetable(activeClass, timetableData.hall ?? "C14", currentDays);
    setEditingSlot(null);
    setRefreshKey((k) => k + 1);
    showToast(`Removed period from ${dayName}.`);
  };

  const allWeekDays = timetableData.days ?? [];
  const visibleDays =
    selectedDay === "ALL"
      ? allWeekDays
      : allWeekDays.filter((d) => d.dayName.toLowerCase() === selectedDay.toLowerCase());

  return (
    <div className="staff-portal-page flex flex-col gap-4 p-4">
      {/* Banner */}
      <PageBanner
        title={`Class Timetable · ${activeClass}`}
        subtitle={`Authoritative weekly timetable schedule for Class ${activeClass}`}
        icon={CalendarDays}
        chip={
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground">
            Room: {timetableData.hall ?? "C14"}
          </span>
        }
      />

      {/* Class Selector & Timetable Status */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
        <StaffClassSelector />

        <div className="flex flex-wrap items-center gap-2">
          {isCustom ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/10 px-3 py-1 text-xs font-semibold text-ok">
              <CheckCircle2 className="size-3.5" />
              <span>Custom Uploaded Timetable</span>
            </span>
          ) : (
            <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-muted-foreground">
              Standard Default Schedule
            </span>
          )}

          {isCustom && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs text-danger hover:underline"
            >
              <RotateCcw className="size-3" />
              <span>Reset to Default</span>
            </button>
          )}

          <Link
            to="/erp/staff/timetable-upload"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 text-xs font-semibold text-foreground hover:bg-surface"
          >
            <Upload className="size-3.5 text-accent" />
            <span>Upload New Timetable</span>
          </Link>
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div className="rounded-lg bg-text p-3 text-sm font-semibold text-surface flex items-center justify-between">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} className="text-surface/80 hover:text-surface">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Day Filter Buttons */}
      <div
        role="tablist"
        aria-label="Filter by day"
        className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedDay === "ALL"}
          onClick={() => setSelectedDay("ALL")}
          className={`inline-flex min-h-12 min-w-[70px] items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors ${
            selectedDay === "ALL"
              ? "bg-accent text-white"
              : "border border-border bg-surface text-foreground hover:bg-surface-2"
          }`}
        >
          Full Week
        </button>
        {WEEKDAYS.map((dayName) => (
          <button
            key={dayName}
            type="button"
            role="tab"
            aria-selected={selectedDay === dayName}
            onClick={() => setSelectedDay(dayName)}
            className={`inline-flex min-h-12 items-center justify-center rounded-lg px-3.5 text-sm font-semibold transition-colors ${
              selectedDay === dayName
                ? "bg-accent text-white"
                : "border border-border bg-surface text-foreground hover:bg-surface-2"
            }`}
          >
            {dayName}
          </button>
        ))}
      </div>

      {/* Weekday Schedule Cards */}
      <div className="grid gap-4 overflow-y-auto max-h-[700px]">
        {visibleDays.map((day) => (
          <div
            key={day.dayName}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs"
          >
            {/* Day Header */}
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">{day.dayName}</span>
                <span className="text-xs text-muted-foreground">({day.hours.length} Periods)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingSlot({
                    dayName: day.dayName,
                    periodIndex: day.hours.length,
                    isNew: true,
                    slot: {
                      hour: day.hours.length + 1,
                      period: day.hours.length + 1,
                      time: "15:30 - 16:20",
                      startTime: "15:30",
                      endTime: "16:20",
                      subjectCode: "",
                      subjectName: "",
                      staffName: "",
                      room: timetableData.hall ?? "C14",
                    },
                  })
                }
                className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border bg-surface px-2.5 text-xs font-semibold text-foreground hover:bg-surface-2"
              >
                <Plus className="size-3 text-accent" />
                <span>Add Period</span>
              </button>
            </div>

            {/* Periods Grid */}
            {day.hours.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No classes scheduled for {day.dayName}.
              </p>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {day.hours.map((slot, pIdx) => (
                  <div
                    key={`${day.dayName}-${slot.period ?? slot.hour}-${pIdx}`}
                    className="flex flex-col justify-between rounded-lg border border-border bg-surface-2 p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-accent">
                          Period {slot.period ?? slot.hour}
                        </span>
                        <span className="font-mono text-muted-foreground">{slot.time}</span>
                      </div>
                      <p className="mt-1 font-bold text-foreground text-sm">
                        {slot.subjectCode ? `${slot.subjectCode} · ${slot.subjectName}` : "Free Period"}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        Faculty: {slot.staffName || "Unassigned"}
                      </p>
                      <p className="text-muted-foreground">Room: {slot.room || timetableData.hall || "C14"}</p>
                    </div>

                    <div className="mt-2.5 flex justify-end border-t border-border/60 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingSlot({
                            dayName: day.dayName,
                            periodIndex: pIdx,
                            slot: structuredClone(slot),
                            isNew: false,
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                      >
                        <Edit2 className="size-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit / Add Period Modal */}
      {editingSlot && (
        <EditPeriodModal
          editing={editingSlot}
          onSave={handleSaveSlot}
          onDelete={handleDeleteSlot}
          onClose={() => setEditingSlot(null)}
        />
      )}
    </div>
  );
}

function EditPeriodModal({
  editing,
  onSave,
  onDelete,
  onClose,
}: {
  editing: {
    dayName: string;
    periodIndex: number;
    slot: TimetableSlot;
    isNew?: boolean;
  };
  onSave: (dayName: string, periodIndex: number, slot: TimetableSlot, isNew?: boolean) => void;
  onDelete: (dayName: string, periodIndex: number) => void;
  onClose: () => void;
}) {
  const [subjectCode, setSubjectCode] = useState(editing.slot.subjectCode ?? "");
  const [subjectName, setSubjectName] = useState(editing.slot.subjectName ?? "");
  const [staffName, setStaffName] = useState(editing.slot.staffName ?? "");
  const [time, setTime] = useState(editing.slot.time ?? "09:20 - 10:10");
  const [period, setPeriod] = useState(editing.slot.period ?? editing.slot.hour ?? 1);
  const [room, setRoom] = useState(editing.slot.room ?? "C14");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-base font-bold text-foreground">
            {editing.isNew ? "Add Period" : "Edit Period"} · {editing.dayName}
          </h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold block mb-1">Period Number</label>
            <input
              type="number"
              min={1}
              max={8}
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Time Slot (e.g. 09:20 - 10:10)</label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Subject Code</label>
            <input
              type="text"
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
              placeholder="e.g. GE3752"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Subject Name</label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Total Quality Management"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Faculty Name</label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="e.g. Mr. R. Senthil"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Room / Hall</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          {!editing.isNew ? (
            <button
              type="button"
              onClick={() => onDelete(editing.dayName, editing.periodIndex)}
              className="inline-flex items-center gap-1 text-xs text-danger hover:underline"
            >
              <Trash2 className="size-3.5" />
              <span>Delete Period</span>
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(
                  editing.dayName,
                  editing.periodIndex,
                  {
                    hour: period,
                    period,
                    time,
                    startTime: time.split("-")[0]?.trim() ?? "09:20",
                    endTime: time.split("-")[1]?.trim() ?? "10:10",
                    subjectCode,
                    subjectName,
                    staffName,
                    room,
                  },
                  editing.isNew,
                );
              }}
              className="rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover"
            >
              Save Period
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
