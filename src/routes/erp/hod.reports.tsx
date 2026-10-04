import { createFileRoute } from "@tanstack/react-router";

import { HodReportsPage } from "@/components/hod/HodReportsPage";

export const Route = createFileRoute("/erp/hod/reports")({
  component: HodReportsPage,
  head: () => ({ meta: [{ title: "Reports | HOD ERP" }] }),
});
