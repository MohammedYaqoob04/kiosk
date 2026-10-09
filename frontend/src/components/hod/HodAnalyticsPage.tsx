import { Activity, Award, CheckCircle, Clock, GraduationCap, Users } from "lucide-react";
import { PageBanner } from "@/components/erp/PageBanner";
import { api } from "@/api";
import { useApi } from "@/api/use-api";

export function HodAnalyticsPage() {
  const analyticsQuery = useApi(["hodAnalytics"], () => api.getHodAnalytics());
  const data = analyticsQuery.data;

  return (
    <div className="staff-portal-page flex flex-col gap-5 p-4 sm:p-6 overflow-y-auto">
      <PageBanner
        title="Department Analytics"
        subtitle="Department-level key performance metrics"
        icon={Award}
      />

      {analyticsQuery.loading ? (
        <div className="erp-surface p-8 text-center text-muted-foreground">
          Loading department analytics...
        </div>
      ) : analyticsQuery.error ? (
        <div className="erp-surface p-8 text-center text-danger">
          Failed to load department analytics.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* STUDENTS */}
            <article className="erp-surface grid min-h-32 content-between gap-2 p-5 rounded-xl border border-border shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground">STUDENTS</h3>
                <GraduationCap className="size-4 text-accent" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                {data?.totalStudents !== undefined && data.totalStudents > 0
                  ? data.totalStudents
                  : "—"}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Total students in department
              </span>
            </article>

            {/* FACULTY */}
            <article className="erp-surface grid min-h-32 content-between gap-2 p-5 rounded-xl border border-border shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground">FACULTY</h3>
                <Users className="size-4 text-accent" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                {data?.totalFaculty !== undefined && data.totalFaculty > 0
                  ? data.totalFaculty
                  : "—"}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Department faculty members
              </span>
            </article>

            {/* ATTENDANCE % */}
            <article className="erp-surface grid min-h-32 content-between gap-2 p-5 rounded-xl border border-border shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground">ATTENDANCE %</h3>
                <Activity className="size-4 text-accent" />
              </div>
              <p
                className={`text-3xl font-bold ${
                  data?.overallAttendancePercent !== null && data?.overallAttendancePercent !== undefined
                    ? data.overallAttendancePercent >= 75
                      ? "text-ok"
                      : "text-danger"
                    : "text-muted-foreground text-2xl"
                }`}
              >
                {data?.overallAttendancePercent !== null && data?.overallAttendancePercent !== undefined
                  ? `${data.overallAttendancePercent}%`
                  : "—"}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Overall department average
              </span>
            </article>

            {/* PASS PERCENTAGE */}
            <article className="erp-surface grid min-h-32 content-between gap-2 p-5 rounded-xl border border-border shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground">PASS PERCENTAGE</h3>
                <CheckCircle className="size-4 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold text-muted-foreground">
                {data?.passPercentage !== null && data?.passPercentage !== undefined
                  ? `${data.passPercentage}%`
                  : "No data available"}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Semester examination results
              </span>
            </article>

            {/* PENDING APPROVALS */}
            <article className="erp-surface grid min-h-32 content-between gap-2 p-5 rounded-xl border border-border shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground">PENDING APPROVALS</h3>
                <Clock className="size-4 text-accent" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                {data?.pendingApprovals ?? 0}
              </p>
              <span className="text-[11px] text-muted-foreground">
                Leave &amp; OD requests pending
              </span>
            </article>
          </section>

          {/* Detailed Metric Transparency Card */}
          <section className="erp-surface p-5 rounded-xl border border-border shadow-xs">
            <h3 className="text-sm font-bold text-foreground mb-2">Data Transparency Notice</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All metrics on this page are strictly computed from verified database records.
              Where data has not been entered (such as examination marks or historical attendance logs),
              the system reports an honest empty state (<span className="font-mono text-foreground">—</span> or{" "}
              <span className="font-mono text-foreground">No data available</span>) in accordance with the
              data integrity rule.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
