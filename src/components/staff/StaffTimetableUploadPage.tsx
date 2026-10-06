import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Save,
  Upload,
  X,
} from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { useAuth } from "@/lib/auth-context";
import { useStaffClass, StaffClassSelector } from "@/lib/staff-class-context";
import {
  getClassTimetable,
  saveClassTimetable,
} from "@/lib/timetable-store";
import type { TimetableSlot, TimetableWeekDay } from "@/api/types";

export function StaffTimetableUploadPage() {
  const { user } = useAuth();
  const { activeClass } = useStaffClass();

  const [hall, setHall] = useState("C14");
  const [jsonInput, setJsonInput] = useState("");
  const [parsedDays, setParsedDays] = useState<TimetableWeekDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load sample template for active class
  const handleLoadSampleTemplate = () => {
    const current = getClassTimetable(activeClass);
    setHall(current.hall ?? "C14");
    const template = {
      className: activeClass,
      hall: current.hall ?? "C14",
      days: current.days ?? [],
    };
    setJsonInput(JSON.stringify(template, null, 2));
    setParsedDays(current.days ?? []);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setJsonInput(text);
        const parsed = JSON.parse(text);
        if (parsed.days && Array.isArray(parsed.days)) {
          setParsedDays(parsed.days);
          if (parsed.hall) setHall(parsed.hall);
          setError(null);
        } else {
          setError("Invalid format: JSON must contain a 'days' array with weekly schedules.");
        }
      } catch {
        setError("Failed to parse JSON file. Please ensure it is valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleValidateJson = () => {
    setError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.days && Array.isArray(parsed.days)) {
        setParsedDays(parsed.days);
        if (parsed.hall) setHall(parsed.hall);
      } else {
        setError("JSON must include a 'days' array containing Monday-Saturday entries.");
      }
    } catch {
      setError("Syntax error in JSON string.");
    }
  };

  const handleSaveAndPublish = () => {
    if (!parsedDays || parsedDays.length === 0) {
      setError("Please load or provide a valid weekly timetable before saving.");
      return;
    }

    try {
      saveClassTimetable(
        activeClass,
        hall.trim() || "C14",
        parsedDays,
        user?.name || "Dr. Kumar",
      );
      setSuccessMessage(
        `Successfully published timetable for Class ${activeClass}! All students enrolled in Class ${activeClass} will now see this schedule.`,
      );
      setError(null);
    } catch {
      setError("Failed to save timetable to authoritative store.");
    }
  };

  return (
    <div className="staff-portal-page flex flex-col gap-4 p-4">
      <PageBanner
        title={`Upload Timetable · Class ${activeClass}`}
        subtitle="Publish authoritative class schedule to all enrolled students"
        icon={FileSpreadsheet}
      />

      {/* Class Selector Bar */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
        <StaffClassSelector />
        <span className="text-xs text-muted-foreground">
          Select target class to upload/assign schedule
        </span>
      </section>

      {/* Explanatory Info Card (Requirement 5) */}
      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-5 shrink-0 text-accent" strokeWidth={1.5} />
          <div className="space-y-1 text-xs text-foreground">
            <h2 className="text-sm font-bold text-foreground">Automatic Student Synchronization</h2>
            <p className="text-muted-foreground leading-relaxed">
              When a timetable is published for <strong>Class {activeClass}</strong>, every student belonging to
              Class {activeClass} will automatically see this timetable in their Student Timetable page.
              No duplicate per-student copies are stored; one authoritative schedule serves the entire class.
            </p>
          </div>
        </div>
      </section>

      {/* Success Notification */}
      {successMessage && (
        <div className="rounded-xl border border-ok/30 bg-ok/10 p-4 text-sm font-semibold text-ok flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <div className="mt-1">
            <Link
              to="/erp/staff/timetable"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-ok px-4 text-xs font-bold text-white hover:opacity-90"
            >
              <span>View Published Schedule in Timetable Desk</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload Workspace */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Configuration & File Upload */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
          <h3 className="text-sm font-bold text-foreground">1. Choose File or Template</h3>

          <div>
            <label className="text-xs font-semibold block mb-1">Assigned Classroom / Lab Hall</label>
            <input
              type="text"
              value={hall}
              onChange={(e) => setHall(e.target.value)}
              placeholder="e.g. C14 or Lab 2"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="inline-flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border bg-surface-2 p-4 text-center hover:bg-surface">
              <Upload className="size-5 text-accent" strokeWidth={1.5} />
              <span className="text-xs font-semibold text-foreground">
                Click to select JSON timetable file
              </span>
              <span className="text-[11px] text-muted-foreground">(.json format)</span>
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">or load pre-configured template:</span>
              <button
                type="button"
                onClick={handleLoadSampleTemplate}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs font-semibold text-accent hover:bg-surface-2"
              >
                <span>Load Sample Template for {activeClass}</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold">Timetable Data (JSON)</label>
              {jsonInput && (
                <button
                  type="button"
                  onClick={handleValidateJson}
                  className="text-xs text-accent font-semibold hover:underline"
                >
                  Verify Data
                </button>
              )}
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"className": "II-A", "hall": "C14", "days": [...]}'
              className="w-full h-56 rounded-md border border-border bg-surface p-3 font-mono text-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveAndPublish}
            disabled={!parsedDays || parsedDays.length === 0}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            <Save className="size-4" />
            <span>Publish Timetable to Class {activeClass}</span>
          </button>
        </div>

        {/* Right: Parsed Schedule Preview */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="text-sm font-bold text-foreground">2. Schedule Preview Before Publish</h3>
            {parsedDays && (
              <span className="rounded-md border border-ok/20 bg-ok/10 px-2 py-0.5 text-xs font-bold text-ok">
                {parsedDays.length} Days Validated
              </span>
            )}
          </div>

          {!parsedDays || parsedDays.length === 0 ? (
            <div className="grid min-h-64 place-items-center text-center text-xs text-muted-foreground">
              <p>Load a template or upload a file on the left to preview the schedule.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[550px] overflow-y-auto">
              {parsedDays.map((day) => (
                <div key={day.dayName} className="rounded-lg border border-border bg-surface-2 p-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-foreground mb-1.5">
                    <span>{day.dayName}</span>
                    <span className="text-muted-foreground font-normal">
                      {day.hours.length} Periods Scheduled
                    </span>
                  </div>
                  {day.hours.length === 0 ? (
                    <span className="text-muted-foreground">No classes scheduled</span>
                  ) : (
                    <div className="space-y-1">
                      {day.hours.map((h) => (
                        <div key={h.period ?? h.hour} className="flex items-center justify-between text-muted-foreground">
                          <span>
                            P{h.period ?? h.hour}: <strong className="text-foreground">{h.subjectCode}</strong> ({h.subjectName})
                          </span>
                          <span className="font-mono text-[11px]">{h.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
