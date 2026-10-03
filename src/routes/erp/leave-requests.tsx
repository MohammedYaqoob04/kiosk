import { createFileRoute } from "@tanstack/react-router";
import { ErpSectionPage } from "@/components/erp-section-page";

export const Route = createFileRoute("/erp/leave-requests")({
  component: () => (
    <ErpSectionPage
      title="Leave requests"
      description="Review sample student leave requests from the staff portal."
    />
  ),
});
