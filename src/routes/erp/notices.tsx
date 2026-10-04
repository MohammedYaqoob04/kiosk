import { createFileRoute, redirect } from "@tanstack/react-router";

import { StudentNoticesPage } from "@/components/notices/StudentNoticesPage";
import { getCurrentUser } from "@/lib/auth-session";

export const Route = createFileRoute("/erp/notices")({
  beforeLoad: () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/erp", replace: true });
    if (user.role !== "STUDENT") throw redirect({ to: user.role === "HOD" ? "/erp/hod" : "/erp/staff", replace: true });
  },
  component: StudentNoticesPage,
  head: () => ({ meta: [{ title: "Notices | Student ERP" }] }),
});
