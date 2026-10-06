import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Search, UserCheck } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { TouchTextInput } from "@/components/TouchTextInput";
import { useStaffClass, StaffClassSelector } from "@/lib/staff-class-context";
import { demoAssignedStudents } from "@/mock/staff-dashboard";

const ATTENDANCE_MIN = 75;

export function StaffAttendancePage() {
  const { activeClass } = useStaffClass();
  const [search, setSearch] = useState("");
  const [belowOnly, setBelowOnly] = useState(false);

  // Filter students for active class
  const classStudents = useMemo(() => {
    return demoAssignedStudents.filter((s) => {
      const cls = s.className ?? `${s.year === 2 ? "II" : s.year === 3 ? "III" : "IV"}-${s.section}`;
      return cls === activeClass;
    });
  }, [activeClass]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredStudents = useMemo(() => {
    return classStudents.filter((s) => {
      const matchesSearch =
        !normalizedSearch ||
        s.name.toLowerCase().includes(normalizedSearch) ||
        s.registerNo.includes(normalizedSearch);
      const matchesBelow = !belowOnly || s.attendancePercentage < ATTENDANCE_MIN;
      return matchesSearch && matchesBelow;
    });
  }, [classStudents, normalizedSearch, belowOnly]);

  const avgAttendance = useMemo(() => {
    if (classStudents.length === 0) return 0;
    const sum = classStudents.reduce((acc, s) => acc + s.attendancePercentage, 0);
    return Number((sum / classStudents.length).toFixed(1));
  }, [classStudents]);

  const shortageCount = useMemo(
    () => classStudents.filter((s) => s.attendancePercentage < ATTENDANCE_MIN).length,
    [classStudents],
  );

  return (
    <div className="staff-portal-page flex flex-col gap-4 p-4">
      <PageBanner
        title={`Class Attendance Register · Class ${activeClass}`}
        subtitle={`Live attendance statistics and student register for Class ${activeClass}`}
        icon={UserCheck}
        chip={
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground">
            {classStudents.length} Students
          </span>
        }
      />

      {/* Class Selector Bar */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
        <StaffClassSelector />

        <div className="flex items-center gap-3 text-xs">
          <div className="rounded-md border border-border bg-surface-2 px-3 py-1 font-semibold">
            Class Average: <strong className="text-accent">{avgAttendance}%</strong>
          </div>
          {shortageCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-danger/30 bg-danger/10 px-2.5 py-1 font-semibold text-danger">
              <AlertTriangle className="size-3" />
              <span>{shortageCount} with shortage (&lt; 75%)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border border-ok/30 bg-ok/10 px-2.5 py-1 font-semibold text-ok">
              <CheckCircle2 className="size-3" />
              <span>Zero shortages</span>
            </span>
          )}
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <TouchTextInput
          label="Search register by student name or register number"
          value={search}
          onChange={setSearch}
          placeholder="Tap to search..."
          maxLength={40}
        />
        <button
          type="button"
          aria-pressed={belowOnly}
          onClick={() => setBelowOnly((current) => !current)}
          className={`inline-flex min-h-14 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors ${
            belowOnly
              ? "border border-danger bg-danger text-white"
              : "border border-border bg-surface text-foreground hover:bg-surface-2"
          }`}
        >
          {belowOnly ? "Showing < 75% Only" : "Filter Shortage (< 75%) Only"}
        </button>
      </section>

      {/* Attendance Table */}
      <section className="flex-1 overflow-auto rounded-xl border border-border bg-surface shadow-xs">
        <table className="w-full min-w-[700px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-surface-2 text-foreground font-semibold">
            <tr>
              <th className="border-b border-border px-4 py-3">Register No</th>
              <th className="border-b border-border px-4 py-3">Student Name</th>
              <th className="border-b border-border px-4 py-3">Section</th>
              <th className="border-b border-border px-4 py-3 text-center">Attendance %</th>
              <th className="border-b border-border px-4 py-3 text-center">Eligibility Status</th>
              <th className="border-b border-border px-4 py-3 text-right">Student Phone</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => {
              const isShortage = student.attendancePercentage < ATTENDANCE_MIN;
              return (
                <tr key={student.registerNo} className="border-b border-border last:border-b-0 hover:bg-surface-2/60">
                  <td className="px-4 py-3 font-mono font-semibold text-foreground">
                    {student.registerNo}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {student.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Sec {student.section}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold font-mono ${isShortage ? "text-danger" : "text-ok"}`}>
                      {student.attendancePercentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isShortage ? (
                      <span className="rounded-full border border-danger/30 bg-danger/10 px-2.5 py-0.5 font-semibold text-danger text-[11px]">
                        Shortage
                      </span>
                    ) : (
                      <span className="rounded-full border border-ok/30 bg-ok/10 px-2.5 py-0.5 font-semibold text-ok text-[11px]">
                        Eligible
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                    {student.mobile || "—"}
                  </td>
                </tr>
              );
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No students found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
