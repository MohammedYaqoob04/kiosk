import { createFileRoute, redirect } from "@tanstack/react-router";

import { LeaveApprovalDesk } from "@/components/erp/LeaveApprovalDesk";
import { getCurrentUser } from "@/lib/auth-session";

export const Route = createFileRoute("/erp/staff/history")({
  beforeLoad: () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/erp", replace: true });
    if (user.role === "STUDENT") throw redirect({ to: "/erp/dashboard", replace: true });
    if (user.role === "HOD") throw redirect({ to: "/erp/hod", replace: true });
    if (user.role !== "COUNSELLOR") throw redirect({ to: "/erp", replace: true });
  },
  shouldReload: true,
  component: () => <LeaveApprovalDesk role="COUNSELLOR" initialTab="history" />,
  head: () => ({ meta: [{ title: "Approval History | Staff ERP" }] }),
});
