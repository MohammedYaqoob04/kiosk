import { createFileRoute } from "@tanstack/react-router";
import { HodAnalyticsPage } from "@/components/hod/HodAnalyticsPage";

export const Route = createFileRoute("/erp/hod/analytics")({
  component: HodAnalyticsPage,
  head: () => ({ meta: [{ title: "Department Analytics | HOD ERP" }] }),
});
