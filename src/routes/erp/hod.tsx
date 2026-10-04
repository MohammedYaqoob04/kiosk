import { createFileRoute, redirect } from "@tanstack/react-router";
import { Building2 } from "lucide-react";

import { EmptyState } from "@/components/erp/EmptyState";
import { PageBanner } from "@/components/erp/PageBanner";
import { getCurrentUser } from "@/lib/auth-session";

export const Route = createFileRoute("/erp/hod")({
  beforeLoad: () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/erp", replace: true });
    if (user.role === "STUDENT") throw redirect({ to: "/erp/dashboard", replace: true });
    if (user.role === "COUNSELLOR") throw redirect({ to: "/erp/staff", replace: true });
  },
  component: HodPortal,
  head: () => ({ meta: [{ title: "HOD Portal | Arunai ERP" }] }),
});

function HodPortal() {
  return (
    <div className="staff-portal-page">
      <PageBanner
        title="HOD Portal"
        subtitle="Department overview and final approvals"
        icon={Building2}
      />
      <EmptyState
        title="HOD portal"
        description="Department services are available in this portal."
      />
    </div>
  );
}
