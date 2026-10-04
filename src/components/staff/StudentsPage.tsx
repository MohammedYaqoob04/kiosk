import { useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, UsersRound } from "lucide-react";

import { TouchTextInput } from "@/components/TouchTextInput";
import { PageBanner } from "@/components/erp/PageBanner";
import { useAuth } from "@/lib/auth-context";
import { getRequestsSnapshot, subscribeToRequests } from "@/lib/leaveStore";
import { ATTENDANCE_MIN, getStudentSummary, listStudents } from "@/lib/staffData";
import type { Request, Status } from "@/types/leave";

interface StudentsPageProps {
  regNo: string | undefined;
  onBack: () => void;
}

function isPending(status: Status): boolean {
  return status === "PENDING_COUNSELLOR" || status === "PENDING_HOD";
}

function statusLabel(status: Status): string {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function rejectionReason(request: Request): string | undefined {
  if (request.status === "REJECTED_BY_COUNSELLOR") return request.counsellorDecision?.remark;
  if (request.status === "REJECTED_BY_HOD") return request.hodDecision?.remark;
  return undefined;
}

function requestDate(request: Request): number {
  return Date.parse(request.createdAt);
}

export function StudentsPage({ regNo, onBack }: StudentsPageProps) {
  const { user } = useAuth();
  const requests = useSyncExternalStore(
    subscribeToRequests,
    getRequestsSnapshot,
    getRequestsSnapshot,
  );
  const assignedStudents = useMemo(() => listStudents(user?.id ?? ""), [user?.id]);

  if (regNo) {
    const isAssigned = assignedStudents.some((student) => student.regNo === regNo);
    const student = isAssigned ? getStudentSummary(regNo) : null;
    if (!isAssigned) {
      return (
        <div className="staff-portal-page">
          <PageBanner title="Student Summary" subtitle="Student details" icon={UsersRound} />
          <section className="erp-surface grid min-h-40 place-items-center p-6 text-center text-lg text-foreground">
            This student is not assigned to you.
          </section>
          <button type="button" onClick={onBack} className="erp-menu-item w-fit">
            <ArrowLeft aria-hidden="true" className="mr-2 inline size-5" strokeWidth={1.5} />
            Back to My Students
          </button>
        </div>
      );
    }
    if (!student) {
      return (
        <div className="staff-portal-page">
          <PageBanner title="Student Summary" subtitle="Student not found" icon={UsersRound} />
          <button type="button" onClick={onBack} className="erp-menu-item w-fit">
            <ArrowLeft aria-hidden="true" className="mr-2 inline size-5" strokeWidth={1.5} />
            Back to My Students
          </button>
        </div>
      );
    }

    const studentRequests = requests
      .filter((request) => request.studentRegNo === student.regNo)
      .sort((a, b) => requestDate(b) - requestDate(a))
      .slice(0, 5);

    return (
      <div className="staff-portal-page">
        <PageBanner
          title={student.name}
          subtitle={`Student Summary · ${student.regNo}`}
          icon={UsersRound}
        />
        <section className="erp-surface grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryField label="Name" value={student.name} />
          <SummaryField label="Register number" value={student.regNo} />
          <SummaryField label="Batch" value="2023-2027" />
          <SummaryField label="Section" value={student.section} />
          <SummaryField label="Semester" value={String(student.semester)} />
          <SummaryField label="Attendance" value={`${student.attendancePercentage}%`} />
        </section>
        <section className="erp-surface min-h-0 flex-1 overflow-auto p-4">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Last 5 Leave/OD requests</h2>
          {studentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Leave/OD requests.</p>
          ) : (
            <ul className="grid gap-3">
              {studentRequests.map((request) => (
                <li key={request.id} className="rounded-xl border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-foreground">
                      {request.kind} · {request.category}
                    </p>
                    <span className="text-sm text-muted-foreground">
                      {statusLabel(request.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.fromDate} – {request.toDate}
                  </p>
                  {rejectionReason(request) && (
                    <p className="mt-2 text-sm text-foreground">
                      Rejection reason: {rejectionReason(request)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
        <button type="button" onClick={onBack} className="erp-menu-item w-fit">
          <ArrowLeft aria-hidden="true" className="mr-2 inline size-5" strokeWidth={1.5} />
          Back to My Students
        </button>
      </div>
    );
  }

  const assignedRequests = requests.filter((request) =>
    assignedStudents.some((student) => student.regNo === request.studentRegNo),
  );
  const rows = assignedStudents
    .map((student) => {
      const studentRequests = assignedRequests.filter(
        (request) => request.studentRegNo === student.regNo,
      );
      return {
        student,
        leaveCount: studentRequests.length,
        pendingCount: studentRequests.filter((request) => isPending(request.status)).length,
      };
    })
    .sort((a, b) => a.student.attendancePercentage - b.student.attendancePercentage);

  return <StudentTable rows={rows} belowThreshold={ATTENDANCE_MIN} />;
}

interface StudentRow {
  student: NonNullable<ReturnType<typeof getStudentSummary>>;
  leaveCount: number;
  pendingCount: number;
}

function StudentTable({ rows, belowThreshold }: { rows: StudentRow[]; belowThreshold: number }) {
  const [search, setSearch] = useState("");
  const [belowOnly, setBelowOnly] = useState(false);
  const normalizedSearch = search.trim().toLowerCase();
  const visibleRows = rows.filter(
    ({ student }) =>
      (!belowOnly || student.attendancePercentage < belowThreshold) &&
      (!normalizedSearch ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.regNo.includes(normalizedSearch)),
  );

  return (
    <div className="staff-portal-page">
      <PageBanner
        title="My Students"
        subtitle="Attendance, Leave/OD requests and student summaries"
        icon={UsersRound}
        chip={<span className="text-sm text-muted-foreground">{rows.length} students</span>}
      />
      <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <TouchTextInput
          label="Search by name or register number"
          value={search}
          onChange={setSearch}
          placeholder="Tap to search"
          maxLength={40}
        />
        <button
          type="button"
          aria-pressed={belowOnly}
          onClick={() => setBelowOnly((current) => !current)}
          className={`min-h-14 rounded-lg border px-4 font-medium ${
            belowOnly
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-surface text-foreground"
          }`}
        >
          Below 75% only
        </button>
      </section>
      <section
        aria-label="Student list"
        className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-surface"
      >
        <table className="w-full min-w-[780px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-surface-2 text-sm text-foreground">
            <tr>
              {[
                "Reg No",
                "Name",
                "Section",
                "Attendance %",
                "Leave/OD count",
                "Pending requests",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="border-b border-border px-4 py-3 font-semibold"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(({ student, leaveCount, pendingCount }) => (
              <tr key={student.regNo} className="border-b border-border last:border-b-0">
                <td className="p-0">
                  <Link
                    to="/erp/staff/students"
                    search={{ regNo: student.regNo }}
                    className="flex min-h-14 items-center px-4 py-3 text-sm text-foreground hover:bg-surface-2"
                  >
                    {student.regNo}
                  </Link>
                </td>
                <td className="p-0">
                  <Link
                    to="/erp/staff/students"
                    search={{ regNo: student.regNo }}
                    className="flex min-h-14 items-center px-4 py-3 font-medium text-foreground hover:bg-surface-2"
                  >
                    {student.name}
                  </Link>
                </td>
                <td className="p-0">
                  <Link
                    to="/erp/staff/students"
                    search={{ regNo: student.regNo }}
                    className="flex min-h-14 items-center px-4 py-3 text-foreground hover:bg-surface-2"
                  >
                    {student.section}
                  </Link>
                </td>
                <td className="p-0">
                  <Link
                    to="/erp/staff/students"
                    search={{ regNo: student.regNo }}
                    className="flex min-h-14 flex-wrap items-center gap-2 px-4 py-3 text-foreground hover:bg-surface-2"
                  >
                    {student.attendancePercentage}%
                    {student.attendancePercentage < belowThreshold && (
                      <span className="inline-flex min-h-8 items-center rounded-full border border-danger/20 bg-danger/10 px-3 text-sm font-semibold text-danger">
                        Below {belowThreshold}%
                      </span>
                    )}
                  </Link>
                </td>
                <td className="p-0">
                  <Link
                    to="/erp/staff/students"
                    search={{ regNo: student.regNo }}
                    className="flex min-h-14 items-center px-4 py-3 text-foreground hover:bg-surface-2"
                  >
                    {leaveCount}
                  </Link>
                </td>
                <td className="p-0">
                  <Link
                    to="/erp/staff/students"
                    search={{ regNo: student.regNo }}
                    className="flex min-h-14 items-center px-4 py-3 text-foreground hover:bg-surface-2"
                  >
                    {pendingCount}
                  </Link>
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No students match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}
