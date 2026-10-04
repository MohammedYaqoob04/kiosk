import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { StudentsPage } from "@/components/staff/StudentsPage";
import { getCurrentUser } from "@/lib/auth-session";

export const Route = createFileRoute("/erp/staff/students")({
  validateSearch: (search: Record<string, unknown>) => ({
    regNo: typeof search["regNo"] === "string" ? search["regNo"] : undefined,
  }),
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
  const { regNo } = Route.useSearch();
  const navigate = useNavigate({ from: "/erp/staff/students" });
  return (
    <StudentsPage
      regNo={regNo}
      onBack={() => void navigate({ search: { regNo: undefined }, replace: true })}
    />
  );
}
