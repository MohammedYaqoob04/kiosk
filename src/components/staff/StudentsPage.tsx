import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  ShieldAlert,
  User,
  UsersRound,
} from "lucide-react";

import { TouchTextInput } from "@/components/TouchTextInput";
import { PageBanner } from "@/components/erp/PageBanner";
import { api } from "@/api";
import { useApi } from "@/api/use-api";
import { useStaffClass, StaffClassSelector } from "@/lib/staff-class-context";
import { demoAssignedStudents } from "@/mock/staff-dashboard";
import type { AssignedStudent } from "@/types/staff-dashboard";

const ATTENDANCE_MIN = 75;

interface StudentsPageProps {
  regNo: string | undefined;
  onBack: () => void;
}

function statusLabel(status: string): string {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function StudentsPage({ regNo, onBack }: StudentsPageProps) {
  const { activeClass } = useStaffClass();

  // Load students via API with fallback to mock data
  const studentsQuery = useApi(["staffStudents", activeClass], async () => {
    try {
      const data = await api.getAssignedStudents();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Offline / mock fallback
    }
    return demoAssignedStudents;
  });

  const summaryQuery = useApi(
    ["staffStudentSummary", regNo],
    async () => {
      if (!regNo) return null;
      try {
        return await api.getStaffStudentSummary(regNo);
      } catch {
        // Fallback to local student data
        const found = demoAssignedStudents.find((s) => s.registerNo === regNo);
        if (!found) return null;
        return {
          registerNo: found.registerNo,
          name: found.name,
          batch: found.batch,
          departmentCode: found.departmentCode,
          course: found.course,
          semester: found.semester,
          section: found.section,
          attendancePercentage: found.attendancePercentage,
          recentRequests: [],
        };
      }
    },
    { enabled: Boolean(regNo) },
  );

  // --- Detailed Student View ---
  if (regNo) {
    if (summaryQuery.loading) {
      return (
        <div className="staff-portal-page">
          <PageBanner title="Student Summary" subtitle="Loading..." icon={UsersRound} />
          <section className="erp-surface grid min-h-40 place-items-center p-6 text-center text-muted-foreground">
            Loading student details...
          </section>
        </div>
      );
    }

    const student = summaryQuery.data;
    const fullProfile = demoAssignedStudents.find((s) => s.registerNo === regNo);

    if (!student) {
      return (
        <div className="staff-portal-page">
          <PageBanner title="Student Summary" subtitle="Student not found" icon={UsersRound} />
          <section className="erp-surface grid min-h-40 place-items-center p-6 text-center text-lg text-foreground">
            This student is not assigned to you or could not be found.
          </section>
          <button type="button" onClick={onBack} className="erp-menu-item w-fit">
            <ArrowLeft aria-hidden="true" className="mr-2 inline size-5" strokeWidth={1.5} />
            Back to Student List
          </button>
        </div>
      );
    }

    return (
      <div className="staff-portal-page flex flex-col gap-4 p-4">
        <PageBanner
          title={student.name}
          subtitle={`Student Profile · ${student.registerNo} · Class ${activeClass}`}
          icon={UsersRound}
          chip={
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm font-semibold text-foreground">
              {student.attendancePercentage !== null
                ? `${student.attendancePercentage}% Attendance`
                : "Active Student"}
            </span>
          }
        />

        {/* Academic Overview Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="text-xs text-muted-foreground">Full Name</span>
            <p className="mt-1 text-base font-semibold text-foreground">{student.name}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="text-xs text-muted-foreground">Register Number</span>
            <p className="mt-1 font-mono text-base font-semibold text-foreground">{student.registerNo}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="text-xs text-muted-foreground">Class & Section</span>
            <p className="mt-1 text-base font-semibold text-foreground">
              Class {activeClass} (Sec {student.section ?? "A"})
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="text-xs text-muted-foreground">Semester & Batch</span>
            <p className="mt-1 text-base font-semibold text-foreground">
              Sem {student.semester ?? "—"} · {student.batch ?? "2023-2027"}
            </p>
          </div>
        </div>

        {/* Contact Numbers (Prominent card per requirements) */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
            <Phone className="size-4 text-accent" strokeWidth={1.5} />
            <span>Contact Information</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface-2 p-3.5">
              <span className="text-xs font-medium text-muted-foreground">Student Phone</span>
              <p className="mt-1 font-mono text-base font-bold text-foreground">
                {fullProfile?.mobile || "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-3.5">
              <span className="text-xs font-medium text-muted-foreground">Parent / Father Phone</span>
              <p className="mt-1 font-mono text-base font-bold text-accent">
                {fullProfile?.parentMobile ?? fullProfile?.fatherMobile ?? "—"}
              </p>
            </div>
            {fullProfile?.motherMobile && (
              <div className="rounded-lg border border-border bg-surface-2 p-3.5">
                <span className="text-xs font-medium text-muted-foreground">Mother Phone</span>
                <p className="mt-1 font-mono text-base font-bold text-accent">
                  {fullProfile.motherMobile}
                </p>
              </div>
            )}
            <div className="rounded-lg border border-border bg-surface-2 p-3.5 sm:col-span-2 lg:col-span-3">
              <span className="text-xs font-medium text-muted-foreground">Email Address</span>
              <p className="mt-1 text-sm font-medium text-foreground">
                {fullProfile?.email ?? `${student.registerNo}@arunai.edu`}
              </p>
            </div>
          </div>
        </section>

        {/* Recent Leave Requests */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-base font-semibold text-foreground flex items-center gap-2">
            <Calendar className="size-4 text-accent" strokeWidth={1.5} />
            <span>Recent Leave & OD Requests</span>
          </h2>
          {student.recentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent Leave or OD requests recorded.</p>
          ) : (
            <ul className="grid gap-3">
              {student.recentRequests.map((request) => (
                <li key={request.id} className="rounded-xl border border-border bg-surface-2 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">
                      {request.kind} · {request.category}
                    </p>
                    <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {statusLabel(request.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Duration: {request.fromDate} to {request.toDate}
                  </p>
                  {request.rejectionReason && (
                    <p className="mt-2 text-sm text-danger">
                      Rejection Reason: {request.rejectionReason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-2"
          >
            <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.5} />
            <span>Back to Class Student Cards</span>
          </button>
        </div>
      </div>
    );
  }

  // --- Student Cards List View ---
  return <StudentCardsList allStudents={studentsQuery.data ?? demoAssignedStudents} />;
}

function StudentCardsList({ allStudents }: { allStudents: AssignedStudent[] }) {
  const { activeClass } = useStaffClass();
  const [search, setSearch] = useState("");
  const [belowOnly, setBelowOnly] = useState(false);

  // Filter students by active class context
  const classStudents = useMemo(() => {
    return allStudents.filter((s) => {
      const studentClass = s.className ?? `${s.year === 2 ? "II" : s.year === 3 ? "III" : "IV"}-${s.section}`;
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
      const matchesBelow = !belowOnly || s.attendancePercentage < ATTENDANCE_MIN;
      return matchesSearch && matchesBelow;
    });
  }, [classStudents, normalizedSearch, belowOnly]);

  const shortageCount = useMemo(
    () => classStudents.filter((s) => s.attendancePercentage < ATTENDANCE_MIN).length,
    [classStudents],
  );

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
          {shortageCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 font-semibold text-danger">
              <AlertTriangle className="size-3.5" />
              <span>{shortageCount} with attendance &lt; 75%</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ok">
              <CheckCircle2 className="size-4" />
              <span>All students above minimum attendance</span>
            </span>
          )}
        </div>
      </section>

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

      {/* Individual Student Cards Grid (Requirement 3: card/box rather than large table) */}
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
              const isShortage = student.attendancePercentage < ATTENDANCE_MIN;
              const parentPhone =
                student.parentMobile ?? student.fatherMobile ?? "—";

              return (
                <div
                  key={student.registerNo}
                  className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-xs transition-shadow hover:shadow-sm"
                >
                  {/* Top: Name & Reg No */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-foreground">
                          {student.name}
                        </h3>
                        <p className="font-mono text-xs font-semibold text-muted-foreground">
                          {student.registerNo}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs font-semibold text-foreground">
                        Class {activeClass}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs text-muted-foreground truncate">
                      {student.programme} {student.course} · Year {student.year}
                    </p>

                    {/* Contact Numbers Block (Visually highlighted per requirements) */}
                    <div className="mt-3.5 space-y-2 rounded-lg border border-border bg-surface-2 p-3 text-xs">
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
                          <Phone className="size-3 text-accent" />
                          <span>Parent Phone:</span>
                        </span>
                        <span className="font-mono font-bold text-accent">
                          {parentPhone}
                        </span>
                      </div>

                      {student.motherMobile && (
                        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5">
                          <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                            <Phone className="size-3 text-muted-foreground" />
                            <span>Mother Phone:</span>
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {student.motherMobile}
                          </span>
                        </div>
                      )}
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
                            isShortage ? "text-danger" : "text-ok"
                          }`}
                        >
                          {student.attendancePercentage}%
                        </span>
                        {isShortage && (
                          <span className="rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
                            &lt; 75%
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      to="/erp/staff/students"
                      search={{ regNo: student.registerNo }}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground hover:bg-surface-2"
                    >
                      <span>View Student History</span>
                      <ArrowLeft className="size-3.5 rotate-180" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
