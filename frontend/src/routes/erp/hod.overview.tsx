import { createFileRoute } from "@tanstack/react-router";
import { HodOverviewPage } from "@/components/hod/HodOverviewPage";

export const Route = createFileRoute("/erp/hod/overview")({
  component: HodOverviewPage,
  head: () => ({ meta: [{ title: "Department Overview | HOD ERP" }] }),
});
