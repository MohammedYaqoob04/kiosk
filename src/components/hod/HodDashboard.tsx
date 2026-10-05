import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Activity, CalendarDays, GraduationCap, UsersRound } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { api } from "@/api";
import { useApi } from "@/api/use-api";
const approvalPath = "/erp/hod/approvals";

export function HodDashboard() {
  const { data: overview, reload } = useApi(["hodOverview"], () => api.getHodOverview());

  const metrics = useMemo(
    () => [
      { title: "Pending approvals", value: overview?.cards.pendingApprovals ?? 0, icon: Activity },
      { title: "Total students", value: overview?.cards.totalStudents ?? 0, icon: GraduationCap },
      { title: "Below 75%", value: overview?.cards.belowMinAttendance ?? 0, icon: UsersRound },
      {
        title: "Leave/OD this month",
        value: overview?.cards.leaveThisMonth ?? 0,
        icon: CalendarDays,
      },
      { title: "Notices sent", value: overview?.cards.noticesSent ?? 0, icon: Activity },
    ],
    [overview?.cards],
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
              {(overview?.attendanceBySection ?? []).map((item) => (
                <tr key={item.section} className="border-t border-border">
                  <td className="p-3">{item.section}</td>
                  <td className="p-3">{item.students}</td>
                  <td className="p-3">
                    {item.averagePercent !== null ? `${item.averagePercent}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
        <article className="erp-surface min-h-0 overflow-auto p-4">
          <h2 className="mb-3 font-semibold text-foreground">Students below 75%</h2>
          <ul className="grid gap-2">
            {(overview?.belowMinStudents ?? []).map((student) => (
              <li
                key={student.registerNo}
                className="flex justify-between gap-3 border-b border-border py-2"
              >
                <span>
                  {student.name} · {student.registerNo}
                </span>
                <span className="font-semibold">
                  {student.attendancePercentage !== null
                    ? `${student.attendancePercentage}%`
                    : "—"}
                </span>
              </li>
            ))}
            {overview?.belowMinStudents.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">No students below 75%.</li>
            )}
          </ul>
        </article>
        <article className="erp-surface min-h-0 overflow-auto p-4 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-foreground">Oldest pending approvals</h2>
            <Link to={approvalPath} className="erp-menu-item">
              Open approvals
            </Link>
          </div>
          {overview?.pendingApprovals && overview.pendingApprovals.length ? (
            <ul className="grid gap-2">
              {overview.pendingApprovals.slice(0, 8).map((request) => (
                <li
                  key={request.id}
                  className="flex flex-wrap justify-between gap-3 border-b border-border py-2"
                >
                  <span>
                    {request.studentName} · {request.kind} · {request.fromDate}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Waiting{" "}
                    {Math.max(
                      0,
                      Math.floor((Date.now() - Date.parse(request.createdAt)) / 86_400_000),
                    )}{" "}
                    days
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
