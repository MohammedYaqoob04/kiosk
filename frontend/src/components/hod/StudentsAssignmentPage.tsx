import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Phone,
  Search,
  Upload,
  UserCheck,
  UsersRound,
  UserX,
} from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { TouchTextInput } from "@/components/TouchTextInput";
import { Skeleton } from "@/components/erp/Skeleton";
import { api, formatServerError } from "@/api";
import { useApi } from "@/api/use-api";
import type { HodStudent } from "@/api/types";

type ViewTab = "cards" | "assign";
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

export function StudentsAssignmentPage() {
  const [tab, setTab] = useState<ViewTab>("cards");
  const [selectedYear, setSelectedYear] = useState<YearFilter>("all");
  const [search, setSearch] = useState("");
  const [shortageOnly, setShortageOnly] = useState(false);
  const [selectedSection, setSelectedSection] = useState("all");
  const [activeRegNo, setActiveRegNo] = useState<string | null>(null);

  const [revision, setRevision] = useState(0);
  const [selectedCounsellor, setSelectedCounsellor] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const refresh = () => setRevision((v) => v + 1);

  const counsellorsQuery = useApi(["hodCounsellors"], () => api.getHodCounsellors());
  const studentsQuery = useApi(["hodStudents", revision], () => api.getHodStudents());

  const summaryQuery = useApi(
    ["hodStudentSummary", activeRegNo],
    async () => {
      if (!activeRegNo) return null;
      try {
        return await api.getStaffStudentSummary(activeRegNo);
      } catch (err) {
        console.warn("Could not fetch student summary:", err);
        return null;
      }
    },
    { enabled: Boolean(activeRegNo) },
  );

  const counsellorsList = counsellorsQuery.data ?? [];
  const allStudents = studentsQuery.data ?? [];

  const currentCounsellorId =
    selectedCounsellor || counsellorsList[0]?.staffId || counsellorsList[0]?.id || "";

  // Available sections dynamically from actual students
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    for (const s of allStudents) {
      if (s.section) set.add(s.section);
    }
    return Array.from(set).sort();
  }, [allStudents]);

  // Filter students by Year, Search, Section, Shortage
  const filteredStudents = useMemo(() => {
    return allStudents.filter((s) => {
      if (selectedYear !== "all") {
        const y = getStudentYear(s);
        if (y !== selectedYear) return false;
      }

      if (selectedSection !== "all" && s.section !== selectedSection) {
        return false;
      }

      if (shortageOnly) {
        if (s.attendancePercentage === null || s.attendancePercentage >= 75) {
          return false;
        }
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesReg = s.registerNo.toLowerCase().includes(q);
        if (!matchesName && !matchesReg) return false;
      }

      return true;
    });
  }, [allStudents, selectedYear, selectedSection, shortageOnly, search]);

  // Actions
  const onAssignSection = async (sec: string) => {
    if (!currentCounsellorId) return;
    try {
      const res = await api.assignSection(currentCounsellorId, sec);
      setActionMessage(`Section ${sec} assigned (${res.updated} students).`);
      refresh();
    } catch (cause) {
      setActionMessage(formatServerError(cause, "Assignment failed."));
    }
  };

  const onAssignStudent = async (student: HodStudent) => {
    if (!currentCounsellorId) return;
    try {
      await api.assignStudents(currentCounsellorId, [student.registerNo]);
      setActionMessage(`${student.name} assigned.`);
      refresh();
    } catch (cause) {
      setActionMessage(formatServerError(cause, "Assignment failed."));
    }
  };

  const onUnassignStudent = async (student: HodStudent) => {
    try {
      await api.unassignStudent(student.registerNo);
      setActionMessage(`${student.name} unassigned.`);
      refresh();
    } catch (cause) {
      setActionMessage(formatServerError(cause, "Unassignment failed."));
    }
  };

  // --- Detailed Student Profile Showcase View ---
  if (activeRegNo) {
    if (studentsQuery.loading) {
      return (
        <div className="staff-portal-page flex flex-col gap-4 p-4 sm:p-6 overflow-y-auto">
          <PageBanner title="Student Profile" subtitle="Loading profile records..." icon={UsersRound} />
          <Skeleton rows={6} className="w-full" />
        </div>
      );
    }

    const studentInList = allStudents.find((s) => s.registerNo === activeRegNo);
    const summary = summaryQuery.data;

    if (!studentInList && !summary) {
      return (
        <div className="staff-portal-page flex flex-col gap-4 p-4 sm:p-6 overflow-y-auto">
          <PageBanner title="Student Profile" subtitle="Student not found" icon={UsersRound} />
          <section className="erp-surface grid min-h-40 place-items-center p-6 text-center text-lg text-foreground rounded-xl border border-border">
            This student could not be found in the database.
          </section>
          <button
            type="button"
            onClick={() => setActiveRegNo(null)}
            className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-surface px-5 text-base font-semibold text-foreground hover:bg-surface-2 cursor-pointer w-fit"
          >
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
            <span>Back to Student Cards</span>
          </button>
        </div>
      );
    }

    const studentName = studentInList?.name || summary?.name || "—";
    const regNo = studentInList?.registerNo || summary?.registerNo || activeRegNo;
    const programme = studentInList?.programme || "B.Tech";
    const course = studentInList?.course || studentInList?.department || "Artificial Intelligence and Data Science";
    const deptCode = studentInList?.departmentCode || "AI&DS";
    const batch = studentInList?.batch || summary?.batch || "—";
    const semester = studentInList?.semester ?? summary?.semester ?? "—";
    const year = studentInList ? getStudentYear(studentInList) ?? "—" : "—";
    const section = studentInList?.section ?? summary?.section ?? "—";
    const gender = studentInList?.gender || "—";
    const mobile = studentInList?.mobile || "—";
    const parentMobile =
      studentInList?.parentMobile ||
      studentInList?.fatherMobile ||
      studentInList?.motherMobile ||
      "—";
    const attendance =
      studentInList?.attendancePercentage ?? summary?.attendancePercentage ?? null;
    const isShortage = attendance !== null && attendance < 75;
    const counsellorName = studentInList?.counsellor?.name || "No counsellor assigned";
    const recentRequests = summary?.recentRequests ?? [];

    const initials =
      studentName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "ST";

    return (
      <div className="staff-portal-page flex flex-col gap-5 p-4 sm:p-6 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveRegNo(null)}
            className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-surface px-5 text-base font-semibold text-foreground hover:bg-surface-2 shadow-xs cursor-pointer"
          >
            <ArrowLeft aria-hidden="true" className="size-5 text-accent" strokeWidth={1.5} />
            <span>Back to Student Cards</span>
          </button>

          <span className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
            HOD Student Showcase · {deptCode}
          </span>
        </div>

        {/* Hero Showcase Card */}
        <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div
              aria-label={`${studentName} initials`}
              className="grid size-20 sm:size-24 shrink-0 place-items-center rounded-full border-2 border-border bg-surface-2 text-2xl sm:text-3xl font-semibold text-accent"
            >
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground truncate">
                  {studentName}
                </h1>
                <span className="rounded-md border border-border bg-surface-2 px-2.5 py-0.5 font-mono text-xs font-bold text-accent">
                  {regNo}
                </span>
              </div>

              <p className="mt-1 text-sm text-muted-foreground font-medium">
                {programme} · {course} ({deptCode})
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-foreground">
                  Section: {section}
                </span>
                <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-foreground">
                  Year {year} · Sem {semester}
                </span>
                <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-foreground">
                  Batch: {batch}
                </span>
                <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-foreground">
                  Gender: {gender}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Key KPI Stats Grid */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground block mb-1">
              Attendance Record
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-bold ${
                  attendance === null
                    ? "text-muted-foreground"
                    : isShortage
                      ? "text-danger"
                      : "text-ok"
                }`}
              >
                {attendance !== null ? `${attendance}%` : "—"}
              </span>
              {attendance !== null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    isShortage
                      ? "bg-danger/10 text-danger border border-danger/30"
                      : "bg-ok/10 text-ok border border-ok/30"
                  }`}
                >
                  {isShortage ? "Shortage (< 75%)" : "Eligible"}
                </span>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              75% required for examination
            </span>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
              <Phone className="size-3.5 text-accent" />
              <span>Student Phone</span>
            </span>
            <p className="font-mono text-lg font-bold text-foreground truncate">{mobile}</p>
            <span className="text-[11px] text-muted-foreground mt-1 block">Direct phone contact</span>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
              <Phone className="size-3.5 text-muted-foreground" />
              <span>Parent / Guardian Phone</span>
            </span>
            <p className="font-mono text-lg font-bold text-foreground truncate">{parentMobile}</p>
            <span className="text-[11px] text-muted-foreground mt-1 block">Guardian emergency phone</span>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
              <UsersRound className="size-3.5 text-accent" />
              <span>Assigned Counsellor</span>
            </span>
            <p className="text-base font-bold text-foreground truncate">{counsellorName}</p>
            <span className="text-[11px] text-muted-foreground mt-1 block">Faculty mentee advisor</span>
          </div>
        </section>

        {/* Leave & OD Requests History */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-display text-base font-bold text-foreground">
              Leave &amp; On-Duty History
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {recentRequests.length} {recentRequests.length === 1 ? "record" : "records"}
            </span>
          </div>

          {recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 bg-surface-2/40 rounded-lg text-center">
              No leave or OD requests submitted by this student.
            </p>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Dates</th>
                    <th className="p-3">Reason / Event</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="p-3 font-semibold">{req.kind}</td>
                      <td className="p-3 font-mono">
                        {req.fromDate} → {req.toDate}
                      </td>
                      <td className="p-3 truncate max-w-xs">{req.reason || req.eventName || "—"}</td>
                      <td className="p-3">
                        <span className="rounded px-2 py-0.5 text-xs font-bold bg-surface-2 border border-border">
                          {req.status.replaceAll("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="staff-portal-page flex flex-col gap-5 p-4 sm:p-6 overflow-y-auto">
      <PageBanner
        title="Students &amp; Assignment"
        subtitle="Department student profiles and counsellor assignments"
        icon={UsersRound}
      />

      {/* View Switcher Tabs (Student Details vs Counsellor Assignment) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Students Views">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "cards"}
            onClick={() => setTab("cards")}
            className={`inline-flex min-h-14 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-colors cursor-pointer ${
              tab === "cards"
                ? "border-accent bg-accent text-white shadow-xs"
                : "border-border bg-surface text-foreground hover:bg-surface-2"
            }`}
          >
            <GraduationCap className="size-4 mr-2" strokeWidth={1.5} />
            <span>Student Details ({filteredStudents.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={tab === "assign"}
            onClick={() => setTab("assign")}
            className={`inline-flex min-h-14 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-colors cursor-pointer ${
              tab === "assign"
                ? "border-accent bg-accent text-white shadow-xs"
                : "border-border bg-surface text-foreground hover:bg-surface-2"
            }`}
          >
            <UsersRound className="size-4 mr-2" strokeWidth={1.5} />
            <span>Counsellor Assignment</span>
          </button>
        </div>

        <Link
          to="/erp/hod/students/upload"
          className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 font-semibold text-foreground hover:bg-surface-2 shadow-xs cursor-pointer"
        >
          <Upload className="size-4 text-accent" strokeWidth={1.5} />
          <span>Upload Student Sheet</span>
        </Link>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm font-medium text-foreground flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage("")}
            className="text-xs text-muted-foreground hover:underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: STUDENT DETAILS (CARDS VIEW) */}
      {tab === "cards" && (
        <>
          {/* Filters Bar: Search, Year 2/3/4, Section, Shortage */}
          <section className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="size-4 absolute left-3.5 top-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or register number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-14 pl-10 pr-3 rounded-xl border border-border bg-surface text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Year Filters */}
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Year filters">
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
                    onClick={() => setSelectedYear(val as YearFilter)}
                    className={`inline-flex min-h-14 items-center justify-center rounded-xl border px-4 text-xs font-semibold cursor-pointer ${
                      isActive
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-surface text-foreground hover:bg-surface-2"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Section Filter */}
            {availableSections.length > 0 && (
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="min-h-14 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-foreground"
              >
                <option value="all">All Sections</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            )}

            {/* Shortage Toggle */}
            <button
              type="button"
              onClick={() => setShortageOnly((v) => !v)}
              className={`inline-flex min-h-14 items-center gap-2 rounded-xl border px-4 text-xs font-semibold cursor-pointer ${
                shortageOnly
                  ? "border-danger bg-danger/10 text-danger"
                  : "border-border bg-surface text-foreground hover:bg-surface-2"
              }`}
            >
              <AlertTriangle className="size-3.5" />
              <span>Below 75% Only</span>
            </button>
          </section>

          {/* Cards Grid */}
          {studentsQuery.loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="min-h-40 rounded-xl border border-border bg-surface p-4">
                  <Skeleton rows={3} />
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-xl bg-surface-2/40 min-h-60">
              <UsersRound className="size-8 text-muted-foreground mb-2" strokeWidth={1.5} />
              <p className="font-bold text-foreground text-base">
                {selectedYear !== "all"
                  ? `No students available for Year ${selectedYear}`
                  : "No students available"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedYear !== "all"
                  ? "No student records for this year exist in the database."
                  : "No students matching your filter criteria were found."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredStudents.map((student) => {
                const att = student.attendancePercentage;
                const isShort = att !== null && att < 75;
                const y = getStudentYear(student);
                const counsellorName = student.counsellor?.name || "No counsellor assigned";

                return (
                  <article
                    key={student.registerNo}
                    className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-xs hover:border-accent/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-sm truncate">{student.name}</h3>
                          <span className="font-mono text-xs text-muted-foreground block mt-0.5">
                            {student.registerNo}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold shrink-0 ${
                            att === null
                              ? "bg-surface-2 text-muted-foreground border border-border"
                              : isShort
                                ? "bg-danger/10 text-danger border border-danger/30"
                                : "bg-ok/10 text-ok border border-ok/30"
                          }`}
                        >
                          {att !== null ? `${att}%` : "—"}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-muted-foreground">
                        {y && (
                          <span className="rounded bg-surface-2 px-2 py-0.5 text-foreground">
                            Year {y}
                          </span>
                        )}
                        {student.section && (
                          <span className="rounded bg-surface-2 px-2 py-0.5 text-foreground">
                            Sec {student.section}
                          </span>
                        )}
                        {student.semester && (
                          <span className="rounded bg-surface-2 px-2 py-0.5">Sem {student.semester}</span>
                        )}
                      </div>

                      <div className="mt-2.5 text-xs">
                        <span className="text-muted-foreground">Counsellor: </span>
                        <span
                          className={
                            student.counsellor
                              ? "font-semibold text-foreground"
                              : "text-muted-foreground italic"
                          }
                        >
                          {counsellorName}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveRegNo(student.registerNo)}
                        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-surface-2 hover:bg-surface-2/80 px-3 text-xs font-bold text-foreground cursor-pointer"
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: COUNSELLOR ASSIGNMENT TABLE */}
      {tab === "assign" && (
        <>
          <section className="erp-surface flex flex-wrap items-end gap-3 p-4 rounded-xl border border-border shadow-xs">
            <label className="grid min-w-64 flex-1 gap-2 text-sm font-semibold">
              Select Counsellor
              <select
                value={currentCounsellorId}
                onChange={(event) => setSelectedCounsellor(event.target.value)}
                className="min-h-14 rounded-lg border border-border bg-surface px-3 text-sm"
              >
                {counsellorsList.length === 0 ? (
                  <option value="">No faculty data available</option>
                ) : (
                  counsellorsList.map((counsellor) => {
                    const cid = counsellor.staffId || counsellor.id;
                    return (
                      <option key={cid} value={cid}>
                        {counsellor.name} ({counsellor.studentCount} assigned)
                      </option>
                    );
                  })
                )}
              </select>
            </label>

            {/* Dynamic Section buttons from actual students */}
            {availableSections.map((sec) => (
              <button
                key={sec}
                type="button"
                disabled={!currentCounsellorId}
                onClick={() => void onAssignSection(sec)}
                className="inline-flex min-h-14 items-center justify-center rounded-lg border border-border bg-surface px-4 text-xs font-bold text-foreground hover:bg-surface-2 disabled:opacity-50 cursor-pointer"
              >
                Assign Section {sec}
              </button>
            ))}
          </section>

          <section className="erp-surface min-h-0 flex-1 overflow-x-auto rounded-xl border border-border shadow-xs">
            {allStudents.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground font-semibold">
                No students available
              </div>
            ) : (
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="sticky top-0 bg-surface-2 text-xs font-semibold text-muted-foreground uppercase">
                  <tr>
                    <th className="border-b border-border p-3">Reg No</th>
                    <th className="border-b border-border p-3">Name</th>
                    <th className="border-b border-border p-3">Section</th>
                    <th className="border-b border-border p-3">Attendance</th>
                    <th className="border-b border-border p-3">Counsellor</th>
                    <th className="border-b border-border p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allStudents.map((student) => {
                    const assignedCounsellor = student.counsellor;
                    const counsellorText = assignedCounsellor
                      ? assignedCounsellor.name
                      : "No counsellor assigned";

                    return (
                      <tr key={student.registerNo} className="hover:bg-surface-2/30">
                        <td className="p-3 font-mono">{student.registerNo}</td>
                        <td className="p-3 font-semibold text-foreground">{student.name}</td>
                        <td className="p-3">{student.section ? `Sec ${student.section}` : "—"}</td>
                        <td className="p-3">
                          {student.attendancePercentage !== null
                            ? `${student.attendancePercentage}%`
                            : "—"}
                        </td>
                        <td className="p-3">
                          <span
                            className={
                              assignedCounsellor
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground italic"
                            }
                          >
                            {counsellorText}
                          </span>
                        </td>
                        <td className="p-2">
                          {assignedCounsellor ? (
                            <button
                              type="button"
                              onClick={() => void onUnassignStudent(student)}
                              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-danger hover:bg-danger/10 cursor-pointer"
                            >
                              Unassign
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!currentCounsellorId}
                              onClick={() => void onAssignStudent(student)}
                              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-2 disabled:opacity-50 cursor-pointer"
                            >
                              Assign
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
