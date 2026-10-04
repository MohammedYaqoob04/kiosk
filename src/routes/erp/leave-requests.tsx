import { createFileRoute } from "@tanstack/react-router";
import { ErpSectionPage } from "@/components/erp-section-page";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/leave-requests")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: () => (
    <ErpSectionPage
      title="Leave requests"
      description="Review sample student leave requests from the staff portal."
    />
  ),
});
