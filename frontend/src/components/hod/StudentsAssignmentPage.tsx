import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Phone,
  Search,
  UsersRound,
} from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { api, formatServerError } from "@/api";
import { useApi } from "@/api/use-api";
import type { HodClassItem, HodStudent } from "@/api/types";

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
  const [assignTargetClass, setAssignTargetClass] = useState<string>("");
  const [selectedCounsellor, setSelectedCounsellor] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => setRevision((v) => v + 1);

  const counsellorsQuery = useApi(["hodCounsellors", revision], () => api.getHodCounsellors());
  const studentsQuery = useApi(["hodStudents", revision], () => api.getHodStudents());
  const classesQuery = useApi(["hodClasses", revision], () => api.getHodClasses());

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
  const classesList = classesQuery.data ?? [];

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

  // Class assignment action
  const onAssignClassSubmit = async (year: number, section: string, counsellorId: string) => {
    if (!counsellorId || submitting) return;
    setSubmitting(true);
    setActionMessage("");
    try {
      const res = await api.assignClass(counsellorId, year, section);
      setActionMessage(
        `Assigned ${res.className} to ${res.counsellor} (${res.updated} students updated).`,
      );
      refresh();
    } catch (cause) {
      setActionMessage(formatServerError(cause, "Class assignment failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const onUnassignClassSubmit = async (year: number, section: string) => {
    if (submitting) return;
    setSubmitting(true);
    setActionMessage("");
    try {
      const res = await api.unassignClass(year, section);
      setActionMessage(`Unassigned ${res.className} (${res.updated} students updated).`);
      refresh();
    } catch (cause) {
      setActionMessage(formatServerError(cause, "Class unassignment failed."));
    } finally {
      setSubmitting(false);
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

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-md bg-surface-2 px-2.5 py-1 text-foreground border border-border">
                  Year {year} · Sem {semester}
                </span>
                <span className="rounded-md bg-surface-2 px-2.5 py-1 text-foreground border border-border">
                  Section {section}
                </span>
                <span className="rounded-md bg-surface-2 px-2.5 py-1 text-foreground border border-border">
                  Batch {batch}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Key Metrics Grid */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground block">
              Attendance Status
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold ${
                  attendance === null ? "text-muted-foreground" : isShortage ? "text-danger" : "text-ok"
                }`}
              >
                {attendance !== null ? `${attendance}%` : "—"}
              </span>
              {attendance !== null && (
                <span
                  className={`text-xs font-semibold ${isShortage ? "text-danger" : "text-ok"}`}
                >
                  {isShortage ? "Shortage (< 75%)" : "Eligible"}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground block">
              Assigned Counsellor
            </span>
            <p className="mt-2 text-base font-bold text-foreground truncate">{counsellorName}</p>
            <span className="text-xs text-muted-foreground block mt-0.5">Faculty In-Charge</span>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground block">Student Phone</span>
            <p className="mt-2 text-base font-mono font-bold text-foreground truncate">{mobile}</p>
            <span className="text-xs text-muted-foreground block mt-0.5">Primary Contact</span>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground block">Parent Phone</span>
            <p className="mt-2 text-base font-mono font-bold text-foreground truncate">
              {parentMobile}
            </p>
            <span className="text-xs text-muted-foreground block mt-0.5">Emergency Contact</span>
          </div>
        </section>

        {/* Recent Leave / OD Requests */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="size-5 text-accent" strokeWidth={1.5} />
              <h2 className="text-base font-bold text-foreground">Recent Leave &amp; OD Requests</h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {recentRequests.length} Record{recentRequests.length === 1 ? "" : "s"}
            </span>
          </div>

          {recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No leave or on-duty requests recorded for this student.
            </p>
          ) : (
            <div className="overflow-x-auto">
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
        subtitle="Department student profiles and class counsellor assignments"
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
            <span>Class-Wise Counsellor Assignment</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm font-medium text-foreground flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage("")}
            className="text-xs text-muted-foreground hover:underline ml-3 cursor-pointer"
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredStudents.map((student) => {
                const att = student.attendancePercentage;
                const isShort = att !== null && att < 75;
                const y = getStudentYear(student);
                const counsellorName = student.counsellor?.name || "Unassigned";
                const parentPhone =
                  student.parentMobile ||
                  student.fatherMobile ||
                  student.motherMobile ||
                  "—";

                return (
                  <article
                    key={student.registerNo}
                    className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-xs hover:border-accent/40 transition-colors"
                  >
                    <div>
                      {/* Top: Name & Reg No */}
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveRegNo(student.registerNo)}
                          className="min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer flex-1"
                        >
                          <h3 className="truncate text-base font-bold text-foreground">
                            {student.name || "—"}
                          </h3>
                          <p className="font-mono text-xs font-semibold text-muted-foreground">
                            {student.registerNo}
                          </p>
                        </button>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                            att === null
                              ? "bg-surface-2 text-muted-foreground border-border"
                              : isShort
                                ? "bg-danger/10 text-danger border-danger/30"
                                : "bg-ok/10 text-ok border-ok/30"
                          }`}
                        >
                          {att !== null ? `${att}%` : "—"}
                        </span>
                      </div>

                      {/* Department & Year / Section */}
                      <p className="mt-1.5 text-xs text-muted-foreground truncate">
                        {student.department || "Artificial Intelligence and Data Science"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-muted-foreground">
                        {y && (
                          <span className="rounded bg-surface-2 px-2 py-0.5 text-foreground border border-border">
                            Year {y}
                          </span>
                        )}
                        {student.section && (
                          <span className="rounded bg-surface-2 px-2 py-0.5 text-foreground border border-border">
                            Sec {student.section}
                          </span>
                        )}
                        {student.semester && (
                          <span className="rounded bg-surface-2 px-2 py-0.5 text-muted-foreground border border-border">
                            Sem {student.semester}
                          </span>
                        )}
                      </div>

                      {/* Contact Info Block */}
                      <div className="mt-3.5 space-y-2 rounded-lg border border-border bg-surface-2/60 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                            <Phone className="size-3 text-muted-foreground" />
                            <span>Student Phone:</span>
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {student.mobile || "—"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5">
                          <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                            <Phone className="size-3 text-muted-foreground" />
                            <span>Parent Phone:</span>
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {parentPhone}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5">
                          <span className="font-medium text-muted-foreground">Counsellor:</span>
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

      {/* TAB 2: CLASS-WISE COUNSELLOR ASSIGNMENT */}
      {tab === "assign" && (
        <div className="flex flex-col gap-6">
          {/* Class-wise Assignment Form */}
          <section className="erp-surface p-5 rounded-xl border border-border shadow-xs">
            <h2 className="text-base font-bold text-foreground mb-1">
              Assign Class to Counsellor
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Select an entire class and assign a faculty member as counsellor. All students in the class
              will automatically be assigned to the selected counsellor.
            </p>

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 items-end">
              <label className="grid gap-2 text-sm font-semibold text-foreground">
                Target Class
                <select
                  value={assignTargetClass}
                  onChange={(e) => setAssignTargetClass(e.target.value)}
                  className="min-h-14 rounded-lg border border-border bg-surface px-3 text-sm"
                >
                  <option value="">Select a class...</option>
                  {classesList.map((cls) => (
                    <option key={`${cls.year}-${cls.section}`} value={`${cls.year}-${cls.section}`}>
                      {cls.className} ({cls.studentCount} students)
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-foreground">
                Assign to Counsellor
                <select
                  value={currentCounsellorId}
                  onChange={(e) => setSelectedCounsellor(e.target.value)}
                  className="min-h-14 rounded-lg border border-border bg-surface px-3 text-sm"
                >
                  {counsellorsList.length === 0 ? (
                    <option value="">No faculty members available</option>
                  ) : (
                    counsellorsList.map((c) => (
                      <option key={c.staffId || c.id} value={c.staffId || c.id}>
                        {c.name} ({c.staffId || c.id})
                      </option>
                    ))
                  )}
                </select>
              </label>

              <button
                type="button"
                disabled={!assignTargetClass || !currentCounsellorId || submitting}
                onClick={() => {
                  const [yStr, sec] = assignTargetClass.split("-");
                  if (yStr && sec) {
                    void onAssignClassSubmit(Number(yStr), sec, currentCounsellorId);
                  }
                }}
                className="inline-flex min-h-14 items-center justify-center rounded-lg bg-accent text-white px-5 text-sm font-bold shadow-xs hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Assigning..." : "Assign Class to Counsellor"}
              </button>
            </div>
          </section>

          {/* Department Classes Table */}
          <section className="erp-surface p-5 rounded-xl border border-border shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold text-foreground">Department Classes Overview</h2>
                <p className="text-xs text-muted-foreground">
                  Current counsellor allocation by academic year and section
                </p>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {classesList.length} Classes
              </span>
            </div>

            {classesQuery.loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading classes...</div>
            ) : classesList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No classes available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-2 text-xs font-semibold text-muted-foreground uppercase">
                    <tr>
                      <th className="p-3">Class Name</th>
                      <th className="p-3">Academic Year</th>
                      <th className="p-3">Section</th>
                      <th className="p-3">Enrolled Students</th>
                      <th className="p-3">Assigned Counsellor</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {classesList.map((item) => (
                      <tr key={`${item.year}-${item.section}`} className="hover:bg-surface-2/30">
                        <td className="p-3 font-bold text-foreground">{item.className}</td>
                        <td className="p-3 font-semibold">Year {item.year}</td>
                        <td className="p-3 font-mono">Sec {item.section}</td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold font-mono ${
                              item.studentCount > 0
                                ? "bg-ok/10 text-ok border border-ok/30"
                                : "bg-surface-2 text-muted-foreground border border-border"
                            }`}
                          >
                            {item.studentCount > 0 ? `${item.studentCount} Students` : "—"}
                          </span>
                        </td>
                        <td className="p-3">
                          {item.counsellor ? (
                            <div>
                              <span className="font-semibold text-foreground">
                                {item.counsellor.name}
                              </span>
                              <span className="block font-mono text-xs text-muted-foreground">
                                {item.counsellor.staffId}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.counsellor && (
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => void onUnassignClassSubmit(item.year, item.section)}
                                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-danger/30 bg-danger/10 px-3 text-xs font-semibold text-danger hover:bg-danger/20 disabled:opacity-50 cursor-pointer"
                              >
                                Unassign
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={!currentCounsellorId || submitting}
                              onClick={() =>
                                void onAssignClassSubmit(
                                  item.year,
                                  item.section,
                                  currentCounsellorId,
                                )
                              }
                              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-2 disabled:opacity-50 cursor-pointer"
                            >
                              {item.counsellor ? "Reassign" : "Assign"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
