import { createFileRoute } from "@tanstack/react-router";

import { AnnouncementsPage } from "@/components/staff/AnnouncementsPage";

export const Route = createFileRoute("/erp/hod/notices")({
  component: () => <AnnouncementsPage role="HOD" />,
  head: () => ({ meta: [{ title: "Notices | HOD ERP" }] }),
});
