import { createFileRoute, redirect } from "@tanstack/react-router";
import { StaffAttendancePage } from "@/components/staff/StaffAttendancePage";
import { getCurrentUser } from "@/lib/auth-session";

export const Route = createFileRoute("/erp/staff/attendance")({
  beforeLoad: () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/erp", replace: true });
    if (user.role === "STUDENT") throw redirect({ to: "/erp/dashboard", replace: true });
    if (user.role === "HOD") throw redirect({ to: "/erp/hod", replace: true });
    if (user.role !== "COUNSELLOR") throw redirect({ to: "/erp", replace: true });
  },
  component: () => <StaffAttendancePage />,
  head: () => ({ meta: [{ title: "Class Attendance | Staff ERP" }] }),
});
