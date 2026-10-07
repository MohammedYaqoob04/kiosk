import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";

import { TouchTextInput } from "@/components/TouchTextInput";
import { PageBanner } from "@/components/erp/PageBanner";
import { api } from "@/api";
import { useApi } from "@/api/use-api";
import { useStaffClass, StaffClassSelector } from "@/lib/staff-class-context";
import { Skeleton } from "@/components/erp/Skeleton";
import type { AssignedStudent } from "@/types/staff-dashboard";

const ATTENDANCE_MIN = 75;

interface StudentsPageProps {
  regNo?: string | undefined;
  onSelectRegNo?: (regNo: string) => void;
  onBack?: () => void;
}

function statusLabel(status: string): string {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function StudentsPage({ regNo: initialRegNo, onSelectRegNo, onBack }: StudentsPageProps) {
  const { activeClass } = useStaffClass();
  const [internalRegNo, setInternalRegNo] = useState<string | undefined>(initialRegNo);

  useEffect(() => {
    setInternalRegNo(initialRegNo);
  }, [initialRegNo]);

  const activeRegNo = internalRegNo ?? initialRegNo;

  const handleSelectStudent = (regNo: string) => {
    setInternalRegNo(regNo);
    onSelectRegNo?.(regNo);
  };

  const handleBack = () => {
    setInternalRegNo(undefined);
    onBack?.();
  };

  // Load real students via API (no fake/mock fallback)
  const studentsQuery = useApi(["staffStudents", activeClass], async () => {
    return await api.getAssignedStudents();
  });

  const summaryQuery = useApi(
    ["staffStudentSummary", activeRegNo],
    async () => {
      if (!activeRegNo) return null;
      try {
        return await api.getStaffStudentSummary(activeRegNo);
      } catch (err) {
        console.warn("Could not fetch staff student summary:", err);
        return null;
      }
    },
    { enabled: Boolean(activeRegNo) },
  );

  // --- Detailed Student Profile Showcase View ---
  if (activeRegNo) {
    if (studentsQuery.loading) {
      return (
        <div className="staff-portal-page flex flex-col gap-4 p-4">
          <PageBanner title="Student Profile" subtitle="Loading profile records..." icon={UsersRound} />
          <Skeleton rows={6} className="w-full" />
        </div>
      );
    }

    const studentInList = (studentsQuery.data ?? []).find((s) => s.registerNo === activeRegNo);
    const summary = summaryQuery.data;

    if (!studentInList && !summary) {
      return (
        <div className="staff-portal-page flex flex-col gap-4 p-4">
          <PageBanner title="Student Profile" subtitle="Student not found" icon={UsersRound} />
          <section className="erp-surface grid min-h-40 place-items-center p-6 text-center text-lg text-foreground">
            This student is not assigned to you or could not be found.
          </section>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-surface px-5 text-base font-semibold text-foreground hover:bg-surface-2 cursor-pointer w-fit"
          >
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
            <span>Back to Student Cards</span>
          </button>
        </div>
      );
    }

    const studentName = studentInList?.name || summary?.name || "-";
    const regNo = studentInList?.registerNo || summary?.registerNo || activeRegNo;
    const programme = studentInList?.programme || "B.Tech";
    const course = studentInList?.course || studentInList?.department || "Artificial Intelligence and Data Science";
    const deptName = studentInList?.department || "Artificial Intelligence and Data Science";
    const deptCode = studentInList?.departmentCode || "AI&DS";
    const batch = studentInList?.batch || summary?.batch || "-";
    const semester = studentInList?.semester ?? summary?.semester ?? "-";
    const year = studentInList?.year ?? (activeClass.startsWith("IV") ? 4 : activeClass.startsWith("III") ? 3 : 2);
    const section = studentInList?.section ?? summary?.section ?? null;
    const gender = studentInList?.gender || "-";
    const mobile = studentInList?.mobile || "-";
    const parentMobile = studentInList?.parentMobile || studentInList?.fatherMobile || studentInList?.motherMobile || "-";
    const email = studentInList?.email || "-";
    const attendance = studentInList?.attendancePercentage ?? summary?.attendancePercentage ?? null;
    const isShortage = attendance != null && attendance < ATTENDANCE_MIN;
    const recentRequests = summary?.recentRequests ?? [];

    const initials = studentName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "ST";

    return (
      <div className="staff-portal-page flex flex-col gap-5 p-4 sm:p-6">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-surface px-5 text-base font-semibold text-foreground hover:bg-surface-2 shadow-xs cursor-pointer"
          >
            <ArrowLeft aria-hidden="true" className="size-5 text-accent" strokeWidth={1.5} />
            <span>Back to Student Cards</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
              Class {activeClass} · Counsellor Mentee
            </span>
          </div>
        </div>

        {/* Hero Profile Showcase Card */}
        <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Initials Avatar */}
            <div
              aria-label={`${studentName} initials`}
              className="grid size-20 sm:size-24 shrink-0 place-items-center rounded-full border-2 border-border bg-secondary text-2xl sm:text-3xl font-semibold text-accent"
            >
              {initials}
            </div>

            {/* Core Identity */}
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

              {/* Tag Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-foreground">
                  Class {activeClass}
                </span>
                <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-foreground">
                  Section: {section || "-"}
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
                  attendance == null ? "text-muted-foreground" : isShortage ? "text-danger" : "text-ok"
                }`}
              >
                {attendance != null ? `${attendance}%` : "-"}
              </span>
              {attendance != null && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    isShortage ? "bg-danger/10 text-danger border border-danger/30" : "bg-ok/10 text-ok border border-ok/30"
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
            <p className="font-mono text-lg font-bold text-foreground truncate">
              {mobile}
            </p>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Direct mentee phone contact
            </span>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
              <Phone className="size-3.5 text-muted-foreground" />
              <span>Parent / Guardian Phone</span>
            </span>
            <p className="font-mono text-lg font-bold text-foreground truncate">
              {parentMobile}
            </p>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Emergency contact record
            </span>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
              <Mail className="size-3.5 text-accent" />
              <span>Student Email</span>
            </span>
            <p className="text-sm font-semibold text-foreground truncate">
              {email}
            </p>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Institutional communication
            </span>
          </div>
        </section>

        {/* Detailed Academic & Enrolment Information */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
            <GraduationCap className="size-5 text-accent" strokeWidth={1.5} />
            <span>Academic &amp; Enrolment Profile</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-muted-foreground block">Degree &amp; Programme</span>
              <span className="mt-1 text-sm font-semibold text-foreground block">
                {programme} ({course})
              </span>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-muted-foreground block">Department</span>
              <span className="mt-1 text-sm font-semibold text-foreground block">
                {deptName}
              </span>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-muted-foreground block">Department Code</span>
              <span className="mt-1 text-sm font-semibold text-foreground block">
                {deptCode}
              </span>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-muted-foreground block">Current Year &amp; Semester</span>
              <span className="mt-1 text-sm font-semibold text-foreground block">
                Year {year} · Semester {semester}
              </span>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-muted-foreground block">Batch &amp; Regulation</span>
              <span className="mt-1 text-sm font-semibold text-foreground block">
                Batch {batch} · Autonomous
              </span>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-muted-foreground block">Class Counsellor / Mentor</span>
              <span className="mt-1 text-sm font-semibold text-foreground block">
                Mrs. V. Anitha (Staff ID: ANITHA-STAFF1)
              </span>
            </div>
          </div>
        </section>

        {/* Contact & Personal Information */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
            <Phone className="size-5 text-accent" strokeWidth={1.5} />
            <span>Contact &amp; Mentorship Details</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-muted-foreground block">Student Mobile</span>
              <span className="mt-1 font-mono text-sm font-bold text-foreground block">
                {mobile}
              </span>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-muted-foreground block">Parent Phone</span>
              <span className="mt-1 font-mono text-sm font-bold text-foreground block">
                {parentMobile}
              </span>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-muted-foreground block">Email Address</span>
              <span className="mt-1 text-sm font-medium text-foreground block truncate">
                {email}
              </span>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-muted-foreground block">Gender</span>
              <span className="mt-1 text-sm font-semibold text-foreground block">
                {gender}
              </span>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-muted-foreground block">Institution</span>
              <span className="mt-1 text-sm font-semibold text-foreground block">
                Arunai Engineering College (Autonomous)
              </span>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3">
              <span className="text-muted-foreground block">Campus Address</span>
              <span className="mt-1 text-sm font-semibold text-foreground block">
                Velu Nagar, Tiruvannamalai, Tamil Nadu
              </span>
            </div>
          </div>
        </section>

        {/* Recent Leave & On-Duty Requests */}
        <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="size-5 text-accent" strokeWidth={1.5} />
              <span>Leave &amp; On-Duty Request History</span>
            </h2>
            <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-muted-foreground">
              {recentRequests.length} Record{recentRequests.length === 1 ? "" : "s"}
            </span>
          </div>

          {recentRequests.length === 0 ? (
            <div className="rounded-lg border border-border bg-surface-2/60 p-6 text-center text-xs text-muted-foreground">
              No recent Leave or On-Duty requests recorded for this student in the database.
            </div>
          ) : (
            <ul className="grid gap-3">
              {recentRequests.map((request) => (
                <li key={request.id} className="rounded-xl border border-border bg-surface-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-sm text-foreground">
                      {request.kind} · {request.category}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold border ${
                        request.status === "APPROVED"
                          ? "bg-ok/10 text-ok border-ok/30"
                          : request.status === "REJECTED"
                            ? "bg-danger/10 text-danger border-danger/30"
                            : "border-border text-foreground bg-surface"
                      }`}
                    >
                      {statusLabel(request.status)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Duration: <strong className="text-foreground">{request.fromDate}</strong> to{" "}
                    <strong className="text-foreground">{request.toDate}</strong>
                  </p>
                  {request.rejectionReason && (
                    <p className="mt-2 text-xs text-danger font-medium border-t border-danger/20 pt-1.5">
                      Rejection Reason: {request.rejectionReason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bottom Return Button */}
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-surface px-6 text-base font-semibold text-foreground hover:bg-surface-2 cursor-pointer shadow-xs"
          >
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.5} />
            <span>Back to Student Cards</span>
          </button>
        </div>
      </div>
    );
  }

  // --- Student Cards List View ---
  if (studentsQuery.loading) {
    return (
      <div className="staff-portal-page flex flex-col gap-4 p-4">
        <PageBanner
          title={`Student Details · Class ${activeClass}`}
          subtitle={`Loading registered students for Class ${activeClass}...`}
          icon={UsersRound}
        />
        <Skeleton rows={6} className="w-full" />
      </div>
    );
  }

  return (
    <StudentCardsList
      allStudents={studentsQuery.data ?? []}
      onSelectStudent={handleSelectStudent}
    />
  );
}

function StudentCardsList({
  allStudents,
  onSelectStudent,
}: {
  allStudents: AssignedStudent[];
  onSelectStudent: (regNo: string) => void;
}) {
  const { activeClass } = useStaffClass();
  const [search, setSearch] = useState("");
  const [belowOnly, setBelowOnly] = useState(false);

  // Filter students strictly by active class context from real records
  const classStudents = useMemo(() => {
    return allStudents.filter((s) => {
      if (activeClass === "IV-A" || activeClass === "IV") {
        return s.year === 4 || s.semester === 7;
      }
      if (activeClass === "III-A" || activeClass === "III") {
        return s.year === 3 || s.semester === 5;
      }
      if (activeClass === "II-A" || activeClass === "II") {
        return s.year === 2 || s.semester === 3;
      }
      const studentClass = s.className ?? `${s.year === 2 ? "II" : s.year === 3 ? "III" : "IV"}-${s.section ?? "A"}`;
      return studentClass === activeClass;
    });
  }, [allStudents, activeClass]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleStudents = useMemo(() => {
    return classStudents.filter((s) => {
      const matchesSearch =
        !normalizedSearch ||
        s.name.toLowerCase().includes(normalizedSearch) ||
        s.registerNo.includes(normalizedSearch);
      const matchesBelow =
        !belowOnly || (s.attendancePercentage != null && s.attendancePercentage < ATTENDANCE_MIN);
      return matchesSearch && matchesBelow;
    });
  }, [classStudents, normalizedSearch, belowOnly]);

  const hasAttendanceRecords = useMemo(() => {
    return classStudents.some((s) => s.attendancePercentage != null);
  }, [classStudents]);

  const shortageCount = useMemo(() => {
    if (!hasAttendanceRecords) return 0;
    return classStudents.filter(
      (s) => s.attendancePercentage != null && s.attendancePercentage < ATTENDANCE_MIN,
    ).length;
  }, [classStudents, hasAttendanceRecords]);

  return (
    <div className="staff-portal-page flex flex-col gap-4 p-4">
      {/* Banner with Class Context */}
      <PageBanner
        title={`Student Details · Class ${activeClass}`}
        subtitle={`Viewing registered students assigned to Class ${activeClass}`}
        icon={UsersRound}
        chip={
          <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-foreground">
            {classStudents.length} Students in {activeClass}
          </span>
        }
      />

      {/* Class Selector Bar */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
        <StaffClassSelector />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {hasAttendanceRecords ? (
            shortageCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 font-semibold text-danger">
                <AlertTriangle className="size-3.5" />
                <span>{shortageCount} with attendance &lt; 75%</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ok">
                <CheckCircle2 className="size-4" />
                <span>All students above minimum attendance</span>
              </span>
            )
          ) : (
            <span className="text-xs text-muted-foreground">
              Attendance records: -
            </span>
          )}
        </div>
      </section>

      {/* When class has 0 students, render the required empty state */}
      {classStudents.length === 0 ? (
        <section className="grid min-h-48 place-items-center rounded-xl border border-border bg-surface p-8 text-center text-muted-foreground">
          <div>
            <UsersRound className="mx-auto mb-2 size-8 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-base font-semibold text-foreground">
              No students available for this class.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              No registered students exist for Class {activeClass} in the database.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* Filter and Search Bar */}
          <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <TouchTextInput
              label="Search by name or register number"
              value={search}
              onChange={setSearch}
              placeholder="Tap to search students..."
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
              {belowOnly ? "Showing < 75% Attendance" : "Filter Below 75% Only"}
            </button>
          </section>

          {/* Individual Student Cards Grid */}
          <section aria-label="Student Cards" className="flex-1 overflow-auto">
            {visibleStudents.length === 0 ? (
              <div className="grid min-h-48 place-items-center rounded-xl border border-border bg-surface p-8 text-center text-muted-foreground">
                <div>
                  <UsersRound className="mx-auto mb-2 size-8 text-muted-foreground/60" strokeWidth={1.5} />
                  <p className="text-base font-semibold text-foreground">No students found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No students match your filter in Class {activeClass}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleStudents.map((student) => {
                  const hasAtt = student.attendancePercentage != null;
                  const isShortage = hasAtt && student.attendancePercentage! < ATTENDANCE_MIN;

                  return (
                    <div
                      key={student.registerNo}
                      className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-xs transition-shadow hover:shadow-sm"
                    >
                      {/* Top: Name & Reg No */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectStudent(student.registerNo)}
                            className="min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer"
                          >
                            <h3 className="truncate text-base font-bold text-foreground">
                              {student.name || "-"}
                            </h3>
                            <p className="font-mono text-xs font-semibold text-muted-foreground">
                              {student.registerNo || "-"}
                            </p>
                          </button>
                          <span className="shrink-0 rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs font-semibold text-foreground">
                            Class {activeClass}
                          </span>
                        </div>

                        <p className="mt-1.5 text-xs text-muted-foreground truncate">
                          {student.programme || ""} {student.course || ""} · Year {student.year || "-"}
                        </p>

                        {/* Contact Numbers Block */}
                        <div className="mt-3.5 space-y-2 rounded-lg border border-border bg-surface-2 p-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                              <Phone className="size-3 text-muted-foreground" />
                              <span>Student Phone:</span>
                            </span>
                            <span className="font-mono font-semibold text-foreground">
                              {student.mobile || "-"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5">
                            <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                              <Phone className="size-3 text-muted-foreground" />
                              <span>Parent Phone:</span>
                            </span>
                            <span className="font-mono font-semibold text-foreground">
                              -
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom: Attendance & Details Link */}
                      <div className="mt-4 border-t border-border pt-3">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-medium text-muted-foreground">
                            Attendance Rate
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-sm font-bold ${
                                !hasAtt ? "text-muted-foreground" : isShortage ? "text-danger" : "text-ok"
                              }`}
                            >
                              {hasAtt ? `${student.attendancePercentage}%` : "-"}
                            </span>
                            {isShortage && (
                              <span className="rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
                                &lt; 75%
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectStudent(student.registerNo)}
                          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white shadow-xs hover:bg-accent-hover cursor-pointer"
                        >
                          <span>View Student Details</span>
                          <ArrowLeft className="size-4 rotate-180" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
