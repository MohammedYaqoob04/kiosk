import { createFileRoute, redirect } from "@tanstack/react-router";
import { StudentUploadPage } from "@/components/hod/StudentUploadPage";
import { getCurrentUser } from "@/lib/auth-session";

export const Route = createFileRoute("/erp/hod/students/upload")({
  beforeLoad: () => {
    throw redirect({ to: "/erp/hod", replace: true });
  },
  component: () => null,
  head: () => ({ meta: [{ title: "HOD ERP" }] }),
});
