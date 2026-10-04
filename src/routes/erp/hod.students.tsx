import { createFileRoute } from "@tanstack/react-router";

import { StudentsAssignmentPage } from "@/components/hod/StudentsAssignmentPage";

export const Route = createFileRoute("/erp/hod/students")({
  component: StudentsAssignmentPage,
  head: () => ({ meta: [{ title: "Students & Assignment | HOD ERP" }] }),
});
