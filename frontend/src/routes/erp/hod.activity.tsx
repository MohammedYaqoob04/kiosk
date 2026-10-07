import { createFileRoute } from "@tanstack/react-router";

import { ActivityLogPage } from "@/components/hod/ActivityLogPage";

export const Route = createFileRoute("/erp/hod/activity")({
  component: () => <ActivityLogPage role="HOD" />,
  head: () => ({ meta: [{ title: "Activity Log | HOD ERP" }] }),
});
