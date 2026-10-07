import { createFileRoute, redirect } from "@tanstack/react-router";
import { StudentUploadPage } from "@/components/hod/StudentUploadPage";
import { getCurrentUser } from "@/lib/auth-session";

export const Route = createFileRoute("/erp/hod/students/upload")({
  beforeLoad: () => {
    const user = getCurrentUser();
    if (!user) throw redirect({ to: "/erp", replace: true });
    if (user.role !== "HOD") throw redirect({ to: "/erp", replace: true });
  },
  component: StudentUploadPage,
  head: () => ({ meta: [{ title: "Upload Students | HOD ERP" }] }),
});
