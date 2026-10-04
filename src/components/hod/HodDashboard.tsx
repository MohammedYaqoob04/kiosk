import { Link } from "@tanstack/react-router";
import { useMemo, useSyncExternalStore } from "react";
import { Activity, CalendarDays, GraduationCap, UsersRound } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { getRequestsSnapshot, subscribeToRequests } from "@/lib/leaveStore";
import { ATTENDANCE_MIN, listAllStudents } from "@/lib/staffData";
import { useAuth } from "@/lib/auth-context";
import { getNoticesSnapshot, subscribeToNotices } from "@/lib/noticeStore";

const approvalPath = "/erp/hod/approvals";

export function HodDashboard() {
  const { user } = useAuth();
  const requests = useSyncExternalStore(
    subscribeToRequests,
    getRequestsSnapshot,
    getRequestsSnapshot,
  );
  const notices = useSyncExternalStore(
    subscribeToNotices,
    getNoticesSnapshot,
    getNoticesSnapshot,
  );
  const students = listAllStudents();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const pending = requests
    .filter((request) => request.status === "PENDING_HOD")
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const lowAttendance = students.filter(
    (student) => student.attendancePercentage < ATTENDANCE_MIN,
  );
  const thisMonth = requests.filter((request) => Date.parse(request.createdAt) >= monthStart.getTime());
  const sentCount = notices.filter((notice) => notice.authorId === user?.id).length;
  const averageFor = (section: "A" | "B") => {
    const sectionStudents = students.filter((student) => student.section === section);
    return sectionStudents.length
      ? (
          sectionStudents.reduce((sum, student) => sum + student.attendancePercentage, 0) /
          sectionStudents.length
        ).toFixed(1)
      : "0.0";
  };
  const metrics = useMemo(
    () => [
      { title: "Pending approvals", value: pending.length, icon: Activity },
      { title: "Total students", value: students.length, icon: GraduationCap },
      { title: "Below 75%", value: lowAttendance.length, icon: UsersRound },
      { title: "Leave/OD this month", value: thisMonth.length, icon: CalendarDays },
      { title: "Notices sent", value: sentCount, icon: Activity },
    ],
    [pending.length, students.length, lowAttendance.length, thisMonth.length, sentCount],
  );

  return (
    <div className="staff-portal-page">
      <PageBanner title="Dashboard" subtitle="Department overview" icon={GraduationCap} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ title, value, icon: Icon }) => (
          <article key={title} className="erp-surface grid min-h-28 content-between gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm text-muted-foreground">{title}</h2>
              <Icon aria-hidden="true" className="size-5 text-accent" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-semibold text-foreground">{value}</p>
          </article>
        ))}
      </section>
      <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-2">
        <article className="erp-surface min-h-0 overflow-auto p-4">
          <h2 className="mb-3 font-semibold text-foreground">Attendance by section</h2>
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                <th className="p-3">Section</th>
                <th className="p-3">Students</th>
                <th className="p-3">Average attendance</th>
              </tr>
            </thead>
            <tbody>
              {(["A", "B"] as const).map((section) => (
                <tr key={section} className="border-t border-border">
                  <td className="p-3">{section}</td>
                  <td className="p-3">{students.filter((student) => student.section === section).length}</td>
                  <td className="p-3">{averageFor(section)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
        <article className="erp-surface min-h-0 overflow-auto p-4">
          <h2 className="mb-3 font-semibold text-foreground">Students below 75%</h2>
          <ul className="grid gap-2">
            {lowAttendance.map((student) => (
              <li key={student.regNo} className="flex justify-between gap-3 border-b border-border py-2">
                <span>{student.name} · {student.regNo}</span>
                <span className="font-semibold">{student.attendancePercentage}%</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="erp-surface min-h-0 overflow-auto p-4 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground">Oldest pending approvals</h2>
            <Link to={approvalPath} className="erp-menu-item">Open approvals</Link>
          </div>
          {pending.length ? (
            <ul className="grid gap-2">
              {pending.slice(0, 8).map((request) => (
                <li key={request.id} className="flex flex-wrap justify-between gap-3 border-b border-border py-2">
                  <span>{request.studentName} · {request.kind} · {request.fromDate}</span>
                  <span className="text-sm text-muted-foreground">
                    Waiting {Math.max(0, Math.floor((Date.now() - Date.parse(request.createdAt)) / 86_400_000))} days
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No approvals are waiting.</p>
          )}
        </article>
      </section>
    </div>
  );
}
