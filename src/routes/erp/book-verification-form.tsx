import { createFileRoute } from "@tanstack/react-router";

import { ErpSectionPage } from "@/components/erp-section-page";

export const Route = createFileRoute("/erp/book-verification-form")({
  component: () => (
    <ErpSectionPage
      title="Book Verification Form"
      description="Book verification information will appear here."
    />
  ),
});
