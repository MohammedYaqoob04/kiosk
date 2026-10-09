import { Activity, BarChart3, Users, UserCheck, UserX } from "lucide-react";
import { PageBanner } from "@/components/erp/PageBanner";
import { api } from "@/api";
import { useApi } from "@/api/use-api";

export function HodOverviewPage() {
  const overviewQuery = useApi(["hodOverview"], () => api.getHodOverview());
  const data = overviewQuery.data;

  const yearBreakdown = data?.yearBreakdown ?? [];
  const deptSummary = data?.departmentSummary;

  return (
    <div className="staff-portal-page flex flex-col gap-5 p-4 sm:p-6 overflow-y-auto">
      <PageBanner
        title="Department Overview"
        subtitle="Department-wide attendance and student metrics"
        icon={BarChart3}
      />

      {overviewQuery.loading ? (
        <div className="erp-surface p-8 text-center text-muted-foreground">
          Loading department overview...
        </div>
      ) : overviewQuery.error ? (
        <div className="erp-surface p-8 text-center text-danger">
          Failed to load department overview.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Whole Department Summary Card */}
          <section className="erp-surface p-5 rounded-xl border border-border shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Whole Department Summary</h2>
                <p className="text-xs text-muted-foreground">
                  Aggregated metrics across all academic years
                </p>
              </div>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent border border-accent/20">
                Department Total
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-surface-2/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Total Students</span>
                  <Users className="size-4 text-accent" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {deptSummary?.totalStudents !== undefined && deptSummary.totalStudents > 0
                    ? deptSummary.totalStudents
                    : "—"}
                </p>
                <span className="text-[11px] text-muted-foreground">Actual enrolled students</span>
              </div>

              <div className="rounded-xl border border-border bg-surface-2/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Present</span>
                  <UserCheck className="size-4 text-ok" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {deptSummary?.presentCount !== null && deptSummary?.presentCount !== undefined
                    ? deptSummary.presentCount
                    : "—"}
                </p>
                <span className="text-[11px] text-muted-foreground">Attendance &ge; 75%</span>
              </div>

              <div className="rounded-xl border border-border bg-surface-2/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Absent</span>
                  <UserX className="size-4 text-danger" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {deptSummary?.absentCount !== null && deptSummary?.absentCount !== undefined
                    ? deptSummary.absentCount
                    : "—"}
                </p>
                <span className="text-[11px] text-muted-foreground">Attendance &lt; 75%</span>
              </div>

              <div className="rounded-xl border border-border bg-surface-2/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Overall Attendance</span>
                  <Activity className="size-4 text-accent" />
                </div>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {deptSummary?.averageAttendancePercent !== null &&
                  deptSummary?.averageAttendancePercent !== undefined
                    ? `${deptSummary.averageAttendancePercent}%`
                    : "—"}
                </p>
                <span className="text-[11px] text-muted-foreground">Calculated percentage</span>
              </div>
            </div>
          </section>

          {/* Year-by-Year Attendance Breakdown */}
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-bold text-foreground">Year-Level Breakdown</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[2, 3, 4].map((year) => {
                const yearData = yearBreakdown.find((y) => y.year === year);
                const hasStudents = (yearData?.studentCount ?? 0) > 0;

                return (
                  <article
                    key={year}
                    className="erp-surface flex flex-col p-5 rounded-xl border border-border shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-4 border-b border-border pb-2.5">
                      <h3 className="text-base font-bold text-foreground">YEAR {year}</h3>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          hasStudents
                            ? "bg-ok/10 text-ok border border-ok/30"
                            : "bg-surface-2 text-muted-foreground border border-border"
                        }`}
                      >
                        {hasStudents ? `${yearData?.studentCount} Students` : "No data available"}
                      </span>
                    </div>

                    {hasStudents ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg border border-border bg-surface-2/30">
                          <span className="text-xs text-muted-foreground block">Total Students</span>
                          <span className="text-lg font-bold text-foreground font-mono">
                            {yearData?.studentCount}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg border border-border bg-surface-2/30">
                          <span className="text-xs text-muted-foreground block">Attendance %</span>
                          <span className="text-lg font-bold text-foreground font-mono">
                            {yearData?.averageAttendancePercent !== null &&
                            yearData?.averageAttendancePercent !== undefined
                              ? `${yearData.averageAttendancePercent}%`
                              : "—"}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg border border-border bg-surface-2/30">
                          <span className="text-xs text-muted-foreground block">Present</span>
                          <span className="text-lg font-bold text-ok font-mono">
                            {yearData?.presentCount !== null && yearData?.presentCount !== undefined
                              ? yearData.presentCount
                              : "—"}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg border border-border bg-surface-2/30">
                          <span className="text-xs text-muted-foreground block">Absent</span>
                          <span className="text-lg font-bold text-danger font-mono">
                            {yearData?.absentCount !== null && yearData?.absentCount !== undefined
                              ? yearData.absentCount
                              : "—"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 py-2">
                        <div className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Total Students</span>
                          <span className="font-semibold text-muted-foreground font-mono">—</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Present</span>
                          <span className="font-semibold text-muted-foreground font-mono">—</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                          <span className="text-muted-foreground">Absent</span>
                          <span className="font-semibold text-muted-foreground font-mono">—</span>
                        </div>
                        <div className="flex items-center justify-between text-sm py-1">
                          <span className="text-muted-foreground">Attendance</span>
                          <span className="font-semibold text-muted-foreground font-mono">—%</span>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
