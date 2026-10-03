import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, ChevronUp, UsersRound } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLeaveRequests } from "@/lib/leave-store";
import { demoAssignedStudents, demoDepartmentCounsellors } from "@/mock/staff-dashboard";

export const Route = createFileRoute("/erp/staff")({
  component: StaffDashboard,
  head: () => ({ meta: [{ title: "Staff dashboard | Student ERP" }] }),
});

function StaffDashboard() {
  const { user } = useAuth();
  const requests = useLeaveRequests();
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  if (user?.role === "COUNSELLOR") {
    const assignedStudents = demoAssignedStudents.filter(
      (student) => student.assignedCounsellorId === user.identifier,
    );

    return (
      <div className="mx-auto w-full max-w-screen-2xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader title="Counsellor dashboard" description="Assigned students · Sample data" />
          <Button asChild className="min-h-14 gap-2 px-5 text-lg">
            <Link to="/erp/staff/leave">
              Leave requests
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </Button>
        </div>
        {assignedStudents.length === 0 ? (
          <section className="rounded-2xl border border-border bg-card p-6">
            <p className="text-lg text-muted-foreground">
              No students are assigned to this account.
            </p>
          </section>
        ) : (
          <section aria-label="Assigned students" className="grid gap-4">
            {assignedStudents.map((student) => {
              const studentRequests = requests.filter(
                (request) =>
                  request.registerNo === student.registerNo &&
                  (request.status === "PENDING_COUNSELLOR" || request.status === "PENDING_HOD"),
              );
              const expanded = expandedStudent === student.registerNo;

              return (
                <article
                  key={student.registerNo}
                  className="rounded-2xl border border-border bg-card"
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpandedStudent(expanded ? null : student.registerNo)}
                    className="grid min-h-24 w-full gap-3 p-5 text-left active:bg-secondary sm:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))_auto] sm:items-center sm:p-6"
                  >
                    <span>
                      <span className="block text-xl font-semibold text-foreground">
                        {student.name}
                      </span>
                      <span className="mt-1 block text-lg text-muted-foreground">
                        {student.registerNo} · {student.department}
                      </span>
                    </span>
                    <span className="text-lg text-muted-foreground">
                      Attendance
                      <span className="mt-1 block text-xl font-semibold text-primary">
                        {student.attendancePercentage}%
                      </span>
                    </span>
                    <span className="text-lg text-muted-foreground">
                      Pending leave
                      <span className="mt-1 block text-xl font-semibold text-foreground">
                        {studentRequests.length}
                      </span>
                    </span>
                    <span className="flex min-h-14 items-center gap-2 text-lg font-medium text-primary sm:justify-end">
                      {expanded ? "Close details" : "View details"}
                      {expanded ? (
                        <ChevronUp aria-hidden="true" className="size-5" />
                      ) : (
                        <ChevronDown aria-hidden="true" className="size-5" />
                      )}
                    </span>
                  </button>
                  {expanded && (
                    <div className="border-t border-border p-5 sm:p-6">
                      <h2 className="font-display text-xl font-semibold text-foreground">
                        Student details
                      </h2>
                      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-border bg-background p-4">
                          <dt className="text-lg text-muted-foreground">Department</dt>
                          <dd className="mt-1 text-lg font-semibold text-foreground">
                            {student.department}
                          </dd>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-4">
                          <dt className="text-lg text-muted-foreground">Attendance</dt>
                          <dd className="mt-1 text-lg font-semibold text-foreground">
                            {student.attendancePercentage}%
                          </dd>
                        </div>
                        <div className="rounded-xl border border-border bg-background p-4">
                          <dt className="text-lg text-muted-foreground">Pending requests</dt>
                          <dd className="mt-1 text-lg font-semibold text-foreground">
                            {studentRequests.length}
                          </dd>
                        </div>
                      </dl>
                      {studentRequests.length > 0 && (
                        <ul className="mt-4 grid gap-2">
                          {studentRequests.map((request) => (
                            <li
                              key={request.id}
                              className="rounded-xl border border-border bg-background p-4 text-lg text-foreground"
                            >
                              {request.type === "LEAVE" ? "Leave" : "OD"} · {request.reason} ·{" "}
                              {request.status.replaceAll("_", " ")}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    );
  }

  if (user?.role === "HOD") {
    const department = user.department;
    const students = demoAssignedStudents.filter((student) => student.department === department);
    const counselors = demoDepartmentCounsellors.filter(
      (counsellor) => counsellor.department === department,
    );
    const averageAttendance =
      students.length > 0
        ? students.reduce((total, student) => total + student.attendancePercentage, 0) /
          students.length
        : 0;
    const pendingApprovals = requests.filter(
      (request) => request.department === department && request.status === "PENDING_HOD",
    ).length;

    return (
      <div className="mx-auto w-full max-w-screen-2xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <PageHeader
            title="HOD dashboard"
            description={`Department overview · ${department} · Sample data`}
          />
          <Button asChild className="min-h-14 gap-2 px-5 text-lg">
            <Link to="/erp/staff/leave">
              Leave approvals
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          </Button>
        </div>
        <section aria-label="Department summary" className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total students", value: String(students.length) },
            { label: "Average attendance", value: `${averageAttendance.toFixed(1)}%` },
            { label: "Pending approvals", value: String(pendingApprovals) },
          ].map((summary) => (
            <article
              key={summary.label}
              className="min-h-36 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"
            >
              <p className="text-lg text-muted-foreground">{summary.label}</p>
              <p className="mt-3 font-display text-3xl font-bold text-primary">{summary.value}</p>
              <p className="mt-1 text-lg text-foreground">{department}</p>
            </article>
          ))}
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-7">
          <div className="mb-4 flex items-center gap-3">
            <UsersRound aria-hidden="true" className="size-6 text-primary" />
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Department counsellors
            </h2>
          </div>
          <div className="grid gap-3">
            {counselors.length === 0 ? (
              <p className="text-lg text-muted-foreground">
                No counsellors are listed for this department.
              </p>
            ) : (
              counselors.map((counsellor) => {
                const pendingCount = requests.filter(
                  (request) =>
                    request.department === department &&
                    request.assignedCounsellorId === counsellor.staffId &&
                    request.status === "PENDING_COUNSELLOR",
                ).length;
                return (
                  <article
                    key={counsellor.id}
                    className="flex min-h-20 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{counsellor.name}</h3>
                      <p className="mt-1 text-lg text-muted-foreground">
                        {counsellor.staffId} · {counsellor.department}
                      </p>
                    </div>
                    <p className="text-lg text-muted-foreground">
                      Pending requests{" "}
                      <span className="font-semibold text-primary">{pendingCount}</span>
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-8">
      <PageHeader title="Staff dashboard" />
      <p className="text-lg text-muted-foreground">
        This dashboard is available to counsellors and HODs.
      </p>
    </div>
  );
}
