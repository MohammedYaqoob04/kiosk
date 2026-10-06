import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";

import { StaffDashboard } from "@/components/staff/StaffDashboard";
import { StaffClassProvider } from "@/lib/staff-class-context";
import { getCurrentUser } from "@/lib/auth-session";

export const Route = createFileRoute("/erp/staff")({
  beforeLoad: () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/erp", replace: true });
    if (user.role === "STUDENT") throw redirect({ to: "/erp/dashboard", replace: true });
    if (user.role === "HOD") throw redirect({ to: "/erp/hod", replace: true });
    if (user.role !== "COUNSELLOR") throw redirect({ to: "/erp", replace: true });
  },
  shouldReload: true,
  component: CounsellorRoute,
  head: () => ({ meta: [{ title: "Staff Dashboard | Arunai ERP" }] }),
});

function CounsellorRoute() {
  const { pathname } = useLocation();
  return (
    <StaffClassProvider>
      {pathname === "/erp/staff" ? <StaffDashboard /> : <Outlet />}
    </StaffClassProvider>
  );
}
