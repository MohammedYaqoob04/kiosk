import { useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { UsersRound } from "lucide-react";

import { api } from "@/api";
import { useApi } from "@/api/use-api";
import { EmptyState } from "@/components/erp/EmptyState";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { StatusChip } from "@/components/erp/StatusChip";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { getCurrentUser } from "@/lib/auth-session";

export const Route = createFileRoute("/erp/staff/students")({
  beforeLoad: () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/erp", replace: true });
    if (user.role === "STUDENT") throw redirect({ to: "/erp/dashboard", replace: true });
    if (user.role === "HOD") throw redirect({ to: "/erp/hod", replace: true });
    if (user.role !== "COUNSELLOR") throw redirect({ to: "/erp", replace: true });
  },
  shouldReload: true,
  component: MyStudents,
  head: () => ({ meta: [{ title: "My Students | Staff ERP" }] }),
});

function MyStudents() {
  const { user } = useAuth();
  const [selectedRegisterNo, setSelectedRegisterNo] = useState<string | null>(null);
  const students = useApi(
    ["staff", "students", user?.identifier],
    () => api.getAssignedStudents(user?.identifier ?? ""),
    { enabled: Boolean(user?.identifier) },
  );
  const queue = useApi(
    ["staff", "leave-queue", user?.identifier],
    () => api.getLeaveQueue(user?.identifier ?? ""),
    { enabled: Boolean(user?.identifier) },
  );
  const selectedStudent = students.data?.find(
    (student) => student.registerNo === selectedRegisterNo,
  );

  const pendingCounts = useMemo(() => {
    const counts = new Map<string, number>();
    queue.data?.forEach((request) =>
      counts.set(request.registerNo, (counts.get(request.registerNo) ?? 0) + 1),
    );
    return counts;
  }, [queue.data]);

  if (students.loading || queue.loading) return <Skeleton rows={4} className="flex-1 p-4" />;
  if (students.error || queue.error || !students.data || !queue.data) {
    return (
      <div className="p-4">
        <ErrorState
          message={
            students.error?.message ?? queue.error?.message ?? "Student records are unavailable."
          }
          onRetry={() => {
            students.reload();
            queue.reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="staff-portal-page">
      <PageBanner
        title="My Students"
        subtitle="Assigned students and attendance overview"
        icon={UsersRound}
        chip={
          <span className="text-sm text-muted-foreground">{students.data.length} students</span>
        }
      />
      <section aria-label="Assigned students" className="staff-portal-list">
        {students.data.length === 0 ? (
          <EmptyState title="No students assigned." />
        ) : (
          students.data.map((student) => (
            <button
              type="button"
              key={student.registerNo}
              onClick={() => setSelectedRegisterNo(student.registerNo)}
              className="erp-surface staff-student-row text-left active:bg-secondary"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-semibold text-foreground">
                  {student.name}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {student.registerNo} · {student.department}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-base font-semibold text-foreground">
                  {student.attendancePercentage.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground">Attendance</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="grid size-9 place-items-center rounded-full border border-border bg-surface-2 text-sm font-semibold text-foreground">
                  {pendingCounts.get(student.registerNo) ?? 0}
                </span>
              </span>
            </button>
          ))
        )}
      </section>
      <Sheet
        open={selectedStudent !== undefined}
        onOpenChange={(open) => !open && setSelectedRegisterNo(null)}
      >
        <SheetContent
          side="bottom"
          className="mx-auto grid max-h-[85svh] w-full max-w-3xl gap-4 overflow-y-auto rounded-t-3xl border-border bg-surface p-5 pb-8 text-foreground"
        >
          {selectedStudent && (
            <>
              <SheetTitle className="pr-14 font-display text-xl">{selectedStudent.name}</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Read-only student profile · {selectedStudent.registerNo}
              </SheetDescription>
              <dl className="grid gap-2 sm:grid-cols-2">
                {[
                  ["Register No.", selectedStudent.registerNo],
                  ["Department", selectedStudent.department],
                  ["Batch", selectedStudent.batch],
                  ["Programme", selectedStudent.programme],
                  ["Course", selectedStudent.course],
                  ["Semester", String(selectedStudent.semester)],
                  ["Year", String(selectedStudent.year)],
                  ["Section", selectedStudent.section],
                  ["Gender", selectedStudent.gender],
                  ["Mobile", selectedStudent.mobile],
                  ["Email", selectedStudent.email],
                  ["Pending requests", String(pendingCounts.get(selectedStudent.registerNo) ?? 0)],
                ].map(([label, value]) => (
                  <div key={label} className="erp-surface p-3">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-base font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex items-center justify-between erp-surface p-4">
                <span className="text-base text-muted-foreground">Attendance</span>
                <span className="flex items-center gap-3 text-lg font-semibold">
                  {selectedStudent.attendancePercentage.toFixed(1)}%
                  <StatusChip
                    status={selectedStudent.attendancePercentage >= 75 ? "Eligible" : "Low"}
                  />
                </span>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
