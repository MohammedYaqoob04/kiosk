import { createFileRoute } from "@tanstack/react-router";

import { LeaveApprovalDesk } from "@/components/erp/LeaveApprovalDesk";

export const Route = createFileRoute("/erp/hod/approvals")({
  component: () => <LeaveApprovalDesk role="HOD" />,
  head: () => ({ meta: [{ title: "Approvals | HOD ERP" }] }),
});
