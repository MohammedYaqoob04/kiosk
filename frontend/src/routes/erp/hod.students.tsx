import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

import { StudentsAssignmentPage } from "@/components/hod/StudentsAssignmentPage";

export const Route = createFileRoute("/erp/hod/students")({
  component: HodStudentsRoute,
  head: () => ({ meta: [{ title: "Students & Assignment | HOD ERP" }] }),
});

function HodStudentsRoute() {
  const { pathname } = useLocation();
  return pathname === "/erp/hod/students" ? <StudentsAssignmentPage /> : <Outlet />;
}
