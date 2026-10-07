import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  UsersRound,
  UserX,
  UserCheck,
} from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { api } from "@/api";
import { useApi } from "@/api/use-api";
import type { HodStudent } from "@/api/types";

const approvalPath = "/erp/hod/approvals";

type YearFilter = "all" | 2 | 3 | 4;

function getStudentYear(s: HodStudent): number | null {
  if (typeof s.year === "number" && s.year >= 1 && s.year <= 4) {
    return s.year;
  }
  if (typeof s.semester === "number") {
    if (s.semester === 1 || s.semester === 2) return 1;
    if (s.semester === 3 || s.semester === 4) return 2;
    if (s.semester === 5 || s.semester === 6) return 3;
    if (s.semester === 7 || s.semester === 8) return 4;
  }
  return null;
}

export function HodDashboard() {
  const [selectedYear, setSelectedYear] = useState<YearFilter>("all");

  const overviewQuery = useApi(["hodOverview"], () => api.getHodOverview());
  const studentsQuery = useApi(["hodStudents"], () => api.getHodStudents());
  const counsellorsQuery = useApi(["hodCounsellors"], () => api.getHodCounsellors());

  const overview = overviewQuery.data;
  const allStudents = studentsQuery.data ?? [];
  const allCounsellors = counsellorsQuery.data ?? [];

  // Filter students strictly by actual year records
  const filteredStudents = useMemo(() => {
    if (selectedYear === "all") return allStudents;
    return allStudents.filter((s) => getStudentYear(s) === selectedYear);
  }, [allStudents, selectedYear]);

  // Calculations strictly from actual student records
  const { totalStudentsCount, presentCount, absentCount, averageAttendancePercent, sectionBreakdown } =
    useMemo(() => {
      const count = filteredStudents.length;
      if (count === 0) {
        return {
          totalStudentsCount: 0,
          presentCount: null,
          absentCount: null,
          averageAttendancePercent: null,
          sectionBreakdown: [],
        };
      }

      const withAttendance = filteredStudents.filter(
        (s) => s.attendancePercentage !== null && s.attendancePercentage !== undefined,
      );

      let present: number | null = null;
      let absent: number | null = null;
      let avg: number | null = null;

      if (withAttendance.length > 0) {
        present = withAttendance.filter((s) => (s.attendancePercentage ?? 0) >= 75).length;
        absent = withAttendance.filter((s) => (s.attendancePercentage ?? 0) < 75).length;
        const sum = withAttendance.reduce((acc, s) => acc + (s.attendancePercentage ?? 0), 0);
        avg = Math.round(sum / withAttendance.length);
      }

      // Group sections from actual students
      const sectionsMap = new Map<
        string,
        { section: string; students: number; withAtt: number[]; present: number; absent: number }
      >();

      for (const s of filteredStudents) {
        const sec = s.section ? `Section ${s.section}` : "Unassigned Section";
        const cur = sectionsMap.get(sec) ?? {
          section: sec,
          students: 0,
          withAtt: [],
          present: 0,
          absent: 0,
        };
        cur.students += 1;
        if (s.attendancePercentage !== null && s.attendancePercentage !== undefined) {
          cur.withAtt.push(s.attendancePercentage);
          if (s.attendancePercentage >= 75) cur.present += 1;
          else cur.absent += 1;
        }
        sectionsMap.set(sec, cur);
      }

      const breakdown = Array.from(sectionsMap.values())
        .sort((a, b) => a.section.localeCompare(b.section))
        .map((entry) => ({
          section: entry.section,
          students: entry.students,
          present: entry.withAtt.length > 0 ? entry.present : null,
          absent: entry.withAtt.length > 0 ? entry.absent : null,
          averagePercent:
            entry.withAtt.length > 0
              ? Math.round(entry.withAtt.reduce((a, b) => a + b, 0) / entry.withAtt.length)
              : null,
        }));

      return {
        totalStudentsCount: count,
        presentCount: present,
        absentCount: absent,
        averageAttendancePercent: avg,
        sectionBreakdown: breakdown,
      };
    }, [filteredStudents]);

  // Students below 75% for the current selection
  const belowMinStudents = useMemo(() => {
    return filteredStudents.filter(
      (s) => s.attendancePercentage !== null && s.attendancePercentage < 75,
    );
  }, [filteredStudents]);

  const pendingApprovalsList = overview?.pendingApprovals ?? [];
  const pendingApprovalsCount =
    overview?.cards.pendingApprovals ?? pendingApprovalsList.length;

  return (
    <div className="staff-portal-page flex flex-col gap-5 p-4 sm:p-6 overflow-y-auto">
      <PageBanner
        title="HOD Dashboard"
        subtitle="Department overview & real-time analytics"
        icon={GraduationCap}
      />

      {/* Year Filter Navigation (Touch-friendly tabs) */}
      <section className="flex flex-wrap items-center justify-between gap-3" aria-label="Year filtering">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Department Years">
          {(
            [
              ["all", "All Years"],
              [2, "Year 2"],
              [3, "Year 3"],
              [4, "Year 4"],
            ] as const
          ).map(([val, label]) => {
            const isActive = selectedYear === val;
            return (
              <button
                key={val}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedYear(val as YearFilter)}
                className={`inline-flex min-h-14 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? "border-accent bg-accent text-white shadow-xs"
                    : "border-border bg-surface text-foreground hover:bg-surface-2"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {selectedYear !== "all" && (
          <span className="text-xs font-semibold text-muted-foreground px-2">
            Showing records for Year {selectedYear}
          </span>
        )}
      </section>

      {/* Real Department KPIs / Analytics Cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {/* Total Students */}
        <article className="erp-surface grid min-h-28 content-between gap-2 p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-muted-foreground">Total Students</h2>
            <GraduationCap aria-hidden="true" className="size-4 text-accent" strokeWidth={1.5} />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {studentsQuery.loading
              ? "…"
              : totalStudentsCount > 0
                ? totalStudentsCount
                : selectedYear === "all"
                  ? overview?.cards.totalStudents ?? "0"
                  : "0"}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {selectedYear === "all" ? "Entire department" : `Year ${selectedYear} students`}
          </span>
        </article>

        {/* Faculty */}
        <article className="erp-surface grid min-h-28 content-between gap-2 p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-muted-foreground">Faculty</h2>
            <UsersRound aria-hidden="true" className="size-4 text-accent" strokeWidth={1.5} />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {counsellorsQuery.loading ? "…" : allCounsellors.length > 0 ? allCounsellors.length : "—"}
          </p>
          <span className="text-[11px] text-muted-foreground">Department counsellors</span>
        </article>

        {/* Attendance % */}
        <article className="erp-surface grid min-h-28 content-between gap-2 p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-muted-foreground">Attendance %</h2>
            <Activity aria-hidden="true" className="size-4 text-accent" strokeWidth={1.5} />
          </div>
          <p
            className={`text-2xl font-bold ${
              averageAttendancePercent === null
                ? "text-muted-foreground text-lg"
                : averageAttendancePercent >= 75
                  ? "text-ok"
                  : "text-danger"
            }`}
          >
            {studentsQuery.loading
              ? "…"
              : averageAttendancePercent !== null
                ? `${averageAttendancePercent}%`
                : "—"}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {averageAttendancePercent !== null ? "Calculated from records" : "No attendance data"}
          </span>
        </article>

        {/* Present */}
        <article className="erp-surface grid min-h-28 content-between gap-2 p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-muted-foreground">Present (&ge; 75%)</h2>
            <UserCheck aria-hidden="true" className="size-4 text-ok" strokeWidth={1.5} />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {studentsQuery.loading ? "…" : presentCount !== null ? presentCount : "—"}
          </p>
          <span className="text-[11px] text-muted-foreground">Eligible attendance</span>
        </article>

        {/* Absent */}
        <article className="erp-surface grid min-h-28 content-between gap-2 p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-muted-foreground">Absent (&lt; 75%)</h2>
            <UserX aria-hidden="true" className="size-4 text-danger" strokeWidth={1.5} />
          </div>
          <p
            className={`text-2xl font-bold ${
              absentCount !== null && absentCount > 0 ? "text-danger" : "text-foreground"
            }`}
          >
            {studentsQuery.loading ? "…" : absentCount !== null ? absentCount : "—"}
          </p>
          <span className="text-[11px] text-muted-foreground">Attendance shortage</span>
        </article>

        {/* Pass % (Rule 4: Pass % → Calculate only if sufficient real marks data exists, else show '—' or 'No data available') */}
        <article className="erp-surface grid min-h-28 content-between gap-2 p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-muted-foreground">Pass %</h2>
            <CheckCircle2 aria-hidden="true" className="size-4 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">No data available</p>
          <span className="text-[11px] text-muted-foreground">Exam results pending</span>
        </article>

        {/* Pending Approvals */}
        <article className="erp-surface grid min-h-28 content-between gap-2 p-4 rounded-xl border border-border shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-muted-foreground">Pending Approvals</h2>
            <CalendarDays aria-hidden="true" className="size-4 text-accent" strokeWidth={1.5} />
          </div>
          <p
            className={`text-2xl font-bold ${
              pendingApprovalsCount > 0 ? "text-accent" : "text-foreground"
            }`}
          >
            {overviewQuery.loading ? "…" : pendingApprovalsCount}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {pendingApprovalsCount > 0 ? "Waiting for HOD decision" : "No pending approvals"}
          </span>
        </article>
      </section>

      {/* Main Content Grid */}
      <section className="grid gap-5 xl:grid-cols-2">
        {/* Department Overview: Section Attendance Breakdown */}
        <article className="erp-surface flex flex-col p-5 rounded-xl border border-border shadow-xs min-h-[320px]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-display text-base font-bold text-foreground">
              Department Overview {selectedYear !== "all" ? `· Year ${selectedYear}` : ""}
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {sectionBreakdown.length} {sectionBreakdown.length === 1 ? "Section" : "Sections"}
            </span>
          </div>

          {totalStudentsCount === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg bg-surface-2/40">
              <p className="font-semibold text-foreground text-sm">
                No data available for Year {selectedYear}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                No student or attendance records exist for this year in the database.
              </p>
            </div>
          ) : sectionBreakdown.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg bg-surface-2/40">
              <p className="font-semibold text-foreground text-sm">No attendance data available</p>
              <p className="text-xs text-muted-foreground mt-1">
                No section attendance records are currently available.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Class / Section</th>
                    <th className="p-3">Total Students</th>
                    <th className="p-3">Present (&ge;75%)</th>
                    <th className="p-3">Absent (&lt;75%)</th>
                    <th className="p-3 rounded-r-lg">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sectionBreakdown.map((item) => (
                    <tr key={item.section} className="hover:bg-surface-2/30 transition-colors">
                      <td className="p-3 font-semibold text-foreground">{item.section}</td>
                      <td className="p-3 font-mono">{item.students}</td>
                      <td className="p-3 font-mono text-ok">
                        {item.present !== null ? item.present : "—"}
                      </td>
                      <td className="p-3 font-mono text-danger">
                        {item.absent !== null ? item.absent : "—"}
                      </td>
                      <td className="p-3">
                        {item.averagePercent !== null ? (
                          <span
                            className={`font-semibold ${
                              item.averagePercent >= 75 ? "text-ok" : "text-danger"
                            }`}
                          >
                            {item.averagePercent}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        {/* Students Below 75% Attendance List */}
        <article className="erp-surface flex flex-col p-5 rounded-xl border border-border shadow-xs min-h-[320px]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-display text-base font-bold text-foreground">
              Students Below 75% {selectedYear !== "all" ? `(Year ${selectedYear})` : ""}
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                belowMinStudents.length > 0
                  ? "bg-danger/10 text-danger border border-danger/30"
                  : "bg-ok/10 text-ok border border-ok/30"
              }`}
            >
              {belowMinStudents.length} {belowMinStudents.length === 1 ? "student" : "students"}
            </span>
          </div>

          {totalStudentsCount === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg bg-surface-2/40">
              <p className="font-semibold text-foreground text-sm">
                No students available for Year {selectedYear}
              </p>
            </div>
          ) : belowMinStudents.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg bg-surface-2/40">
              <CheckCircle2 className="size-6 text-ok mb-2" strokeWidth={1.5} />
              <p className="font-semibold text-foreground text-sm">No students below 75%</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All students meet the 75% examination eligibility requirement.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full max-h-[340px] overflow-y-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="sticky top-0 bg-surface-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="p-2.5">Student Name</th>
                    <th className="p-2.5">Register No</th>
                    <th className="p-2.5">Section</th>
                    <th className="p-2.5">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {belowMinStudents.map((student) => (
                    <tr key={student.registerNo} className="hover:bg-surface-2/30">
                      <td className="p-2.5 font-semibold text-foreground">{student.name}</td>
                      <td className="p-2.5 font-mono text-muted-foreground">{student.registerNo}</td>
                      <td className="p-2.5">{student.section ? `Sec ${student.section}` : "—"}</td>
                      <td className="p-2.5 font-bold text-danger">
                        {student.attendancePercentage !== null
                          ? `${student.attendancePercentage}%`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        {/* Pending Approvals Section */}
        <article className="erp-surface flex flex-col p-5 rounded-xl border border-border shadow-xs xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Pending Leave &amp; OD Approvals
              </h2>
              <p className="text-xs text-muted-foreground">
                Requests waiting for HOD final review and approval
              </p>
            </div>
            <Link
              to={approvalPath}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-xs font-semibold text-foreground hover:bg-surface-2 shadow-xs cursor-pointer"
            >
              <span>Open Approvals Desk</span>
              <span className="font-bold text-accent">({pendingApprovalsCount})</span>
            </Link>
          </div>

          {pendingApprovalsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg bg-surface-2/40">
              <CheckCircle2 className="size-6 text-ok mb-2" strokeWidth={1.5} />
              <p className="font-semibold text-foreground text-sm">No pending approvals</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All submitted leave and on-duty requests have been decided.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">From Date</th>
                    <th className="p-3">To Date</th>
                    <th className="p-3">Reason / Event</th>
                    <th className="p-3">Waiting Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingApprovalsList.slice(0, 8).map((req) => {
                    const daysWaiting = Math.max(
                      0,
                      Math.floor((Date.now() - Date.parse(req.createdAt)) / 86_400_000),
                    );
                    return (
                      <tr key={req.id} className="hover:bg-surface-2/30 transition-colors">
                        <td className="p-3 font-semibold text-foreground">
                          {req.studentName} ·{" "}
                          <span className="font-mono text-muted-foreground">{req.studentRegNo}</span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                              req.kind === "OD"
                                ? "bg-accent/10 text-accent border border-accent/20"
                                : "bg-surface-2 text-foreground border border-border"
                            }`}
                          >
                            {req.kind}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{req.fromDate}</td>
                        <td className="p-3 font-mono">{req.toDate}</td>
                        <td className="p-3 truncate max-w-xs">{req.reason || req.eventName || "—"}</td>
                        <td className="p-3 text-muted-foreground">
                          {daysWaiting === 0 ? "Today" : `${daysWaiting} day${daysWaiting > 1 ? "s" : ""}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
