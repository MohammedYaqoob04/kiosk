import { createFileRoute, redirect } from "@tanstack/react-router";

import { LeaveApprovalDesk } from "@/components/erp/LeaveApprovalDesk";
import { useAuth } from "@/lib/auth-context";
import { getCurrentUser } from "@/lib/auth-session";

export const Route = createFileRoute("/erp/staff/leave")({
  beforeLoad: () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/erp", replace: true });
    if (user.role === "STUDENT") throw redirect({ to: "/erp/dashboard", replace: true });
    if (user.role !== "COUNSELLOR" && user.role !== "HOD") {
      throw redirect({ to: "/erp", replace: true });
    }
  },
  shouldReload: true,
  component: StaffLeaveDesk,
  head: () => ({ meta: [{ title: "Leave / OD approvals | Arunai ERP" }] }),
});

function StaffLeaveDesk() {
  const { user } = useAuth();
  if (user?.role !== "COUNSELLOR" && user?.role !== "HOD") return null;
  return <LeaveApprovalDesk role={user.role} />;
}
