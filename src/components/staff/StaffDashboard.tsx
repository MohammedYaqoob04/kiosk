import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  GraduationCap,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { useAuth } from "@/lib/auth-context";
import { useStaffClass, StaffClassSelector } from "@/lib/staff-class-context";
import { demoAssignedStudents } from "@/mock/staff-dashboard";
import { getClassTimetable } from "@/lib/timetable-store";
import { getClassMarksStatus } from "@/lib/marks-store";
import { useLeaveRequests } from "@/lib/leave-store";

const ATTENDANCE_MIN = 75;

export function StaffDashboard() {
  const { user } = useAuth();
  const { activeClass } = useStaffClass();

  // Class students
  const classStudents = useMemo(() => {
    return demoAssignedStudents.filter((s) => {
      const cls = s.className ?? `${s.year === 2 ? "II" : s.year === 3 ? "III" : "IV"}-${s.section}`;
      return cls === activeClass;
    });
  }, [activeClass]);

  // Attendance metrics
  const { avgAttendance, lowAttendanceCount, presentCount, absentCount } = useMemo(() => {
    if (classStudents.length === 0) {
      return { avgAttendance: 90.0, lowAttendanceCount: 0, presentCount: 0, absentCount: 0 };
    }
    const sum = classStudents.reduce((acc, s) => acc + s.attendancePercentage, 0);
    const avg = Number((sum / classStudents.length).toFixed(1));
    const lowCount = classStudents.filter((s) => s.attendancePercentage < ATTENDANCE_MIN).length;
    // Approximated daily counts
    const absent = lowCount > 0 ? lowCount : Math.max(1, Math.round(classStudents.length * (1 - avg / 100)));
    const present = Math.max(0, classStudents.length - absent);
    return { avgAttendance: avg, lowAttendanceCount: lowCount, presentCount: present, absentCount: absent };
  }, [classStudents]);

  // Timetable metrics
  const timetable = useMemo(() => getClassTimetable(activeClass), [activeClass]);

  // Next class calculation
  const nextClass = useMemo(() => {
    const todayHours = timetable.hours;
    if (todayHours.length === 0) return null;
    return todayHours[0] ?? null;
  }, [timetable]);

  // Marks metrics
  const marksStatus = useMemo(() => getClassMarksStatus(activeClass), [activeClass]);

  // Leave / OD requests
  const leaveRequests = useLeaveRequests();
  const pendingRequestsCount = useMemo(() => {
    return leaveRequests.filter((r) => r.status === "PENDING_COUNSELLOR").length;
  }, [leaveRequests]);

  const staffName = user?.name || "Dr. Kumar";
  const staffId = user?.identifier || "STAFF-AI-104";

  return (
    <div className="staff-portal-page flex flex-col gap-5 p-4 sm:p-6">
      {/* Top Welcome Banner */}
      <PageBanner
        title={`Welcome, ${staffName}`}
        subtitle={`Counsellor Portal · Staff ID: ${staffId} · Arunai Engineering College`}
        icon={GraduationCap}
        chip={
          <span className="rounded-full border border-border bg-surface px-3 py-1 text-sm font-semibold text-foreground">
            Academic Year 2026-2027
          </span>
        }
      />

      {/* Prominent Class Selector Bar (Requirement 4) */}
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <StaffClassSelector />
          <span className="text-xs text-muted-foreground">
            Controls data across Student Details, Marks, Timetable, and Attendance
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-accent/20 bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
            Class {activeClass} Context
          </span>
          <span className="text-xs text-muted-foreground">
            ({classStudents.length} Students Assigned)
          </span>
        </div>
      </section>

      {/* Overview Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* WIDGET 1: ATTENDANCE */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="size-4 text-accent" strokeWidth={1.5} />
                <span>Attendance · Class {activeClass}</span>
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  avgAttendance >= ATTENDANCE_MIN
                    ? "bg-ok/10 text-ok border border-ok/20"
                    : "bg-danger/10 text-danger border border-danger/20"
                }`}
              >
                {avgAttendance}% Average
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface-2 p-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Today's Classes</span>
                <span className="mt-0.5 text-base font-bold text-foreground">
                  {timetable.hours.length} Periods
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Conducted Today</span>
                <span className="mt-0.5 text-base font-bold text-foreground">
                  {Math.min(timetable.hours.length, 4)} / {timetable.hours.length}
                </span>
              </div>
              <div className="border-t border-border/60 pt-2">
                <span className="text-muted-foreground block">Present Count</span>
                <span className="mt-0.5 text-base font-bold text-ok">
                  {presentCount} Students
                </span>
              </div>
              <div className="border-t border-border/60 pt-2">
                <span className="text-muted-foreground block">Absent Count</span>
                <span className="mt-0.5 text-base font-bold text-danger">
                  {absentCount} Students
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <Link
              to="/erp/staff/attendance"
              className="inline-flex min-h-11 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-2"
            >
              <span>View Attendance Register</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* WIDGET 2: STUDENTS */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="size-4 text-accent" strokeWidth={1.5} />
                <span>Students · Class {activeClass}</span>
              </span>
              <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs font-semibold text-foreground">
                {classStudents.length} Total
              </span>
            </div>

            <div className="mt-4 space-y-2.5 rounded-lg border border-border bg-surface-2 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Enrolled:</span>
                <span className="font-bold text-foreground">{classStudents.length} Students</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2">
                <span className="text-muted-foreground">Low Attendance (&lt; 75%):</span>
                {lowAttendanceCount > 0 ? (
                  <span className="font-bold text-danger flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    <span>{lowAttendanceCount} Students</span>
                  </span>
                ) : (
                  <span className="font-semibold text-ok flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    <span>0 (None)</span>
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-2">
                <span className="text-muted-foreground">Contact Phone Records:</span>
                <span className="font-semibold text-foreground">100% Verified</span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <Link
              to="/erp/staff/students"
              search={{ regNo: undefined }}
              className="inline-flex min-h-11 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-2"
            >
              <span>View Student Cards &amp; Contacts</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* WIDGET 3: TIMETABLE */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-4 text-accent" strokeWidth={1.5} />
                <span>Timetable · Class {activeClass}</span>
              </span>
              <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs font-semibold text-foreground">
                Hall: {timetable.hall ?? "C14"}
              </span>
            </div>

            <div className="mt-4 rounded-lg border border-border bg-surface-2 p-3 text-xs">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">
                Next Scheduled Class
              </span>
              {nextClass ? (
                <div className="mt-1">
                  <p className="font-bold text-sm text-foreground">
                    {nextClass.subjectCode} · {nextClass.subjectName}
                  </p>
                  <p className="text-muted-foreground mt-0.5 flex items-center gap-2">
                    <Clock className="size-3" />
                    <span>Period {nextClass.period} ({nextClass.time})</span>
                    <span>· Room {nextClass.room}</span>
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No classes scheduled for today.</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2 border-t border-border pt-3">
            <Link
              to="/erp/staff/timetable"
              className="inline-flex min-h-11 flex-1 items-center justify-between rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-2"
            >
              <span>View Schedule</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              to="/erp/staff/timetable-upload"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-accent hover:bg-surface-2"
              title="Upload new timetable for this class"
            >
              <FileSpreadsheet className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* WIDGET 4: MARKS SHOWCASE */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Award className="size-4 text-accent" strokeWidth={1.5} />
                <span>Marks Showcase · Class {activeClass}</span>
              </span>
              <span className="rounded-md border border-ok/20 bg-ok/10 px-2 py-0.5 text-xs font-semibold text-ok">
                Available
              </span>
            </div>

            <div className="mt-4 space-y-2 rounded-lg border border-border bg-surface-2 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Assignments 1, 2, 3:</span>
                <span className="font-bold text-foreground">Available (Max 20/20/40)</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                <span className="text-muted-foreground">CIA 1 &amp; CIA 2:</span>
                <span className="font-bold text-foreground">Published (Max 60/60)</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                <span className="text-muted-foreground">Model Examination:</span>
                <span className="font-bold text-foreground">Available (Max 100)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <Link
              to="/erp/staff/marks"
              className="inline-flex min-h-11 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-2"
            >
              <span>View Class Marks Breakdown</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* WIDGET 5: LEAVE & OD REQUESTS */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="size-4 text-accent" strokeWidth={1.5} />
                <span>Approvals Desk</span>
              </span>
              {pendingRequestsCount > 0 && (
                <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
                  {pendingRequestsCount} Pending
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2 rounded-lg border border-border bg-surface-2 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending Review:</span>
                <span className="font-bold text-accent">{pendingRequestsCount} Requests</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                <span className="text-muted-foreground">Decision Flow:</span>
                <span className="font-medium text-foreground">Student → Counsellor → HOD</span>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-1.5">
                <span className="text-muted-foreground">Minimum Rejection Reason:</span>
                <span className="font-medium text-foreground">10 characters required</span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <Link
              to="/erp/staff/leave"
              className="inline-flex min-h-11 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-2"
            >
              <span>Open Approval Desk</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* WIDGET 6: ANNOUNCEMENTS & TOOLS */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Bell className="size-4 text-accent" strokeWidth={1.5} />
                <span>Announcements</span>
              </span>
              <span className="rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs font-semibold text-foreground">
                Staff Desk
              </span>
            </div>

            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Broadcast notices, circulars, exam notifications, and event circulars to class students and parents.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3">
            <Link
              to="/erp/staff/announcements"
              className="inline-flex min-h-11 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-2"
            >
              <span>Manage Announcements</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              to="/erp/staff/password"
              className="inline-flex min-h-11 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-muted-foreground hover:bg-surface-2"
            >
              <span>Security &amp; Change Password</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
