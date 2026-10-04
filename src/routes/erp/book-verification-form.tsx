import { createFileRoute } from "@tanstack/react-router";

import { ErpSectionPage } from "@/components/erp-section-page";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/book-verification-form")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: () => (
    <ErpSectionPage
      title="Book Verification Form"
      description="Book verification information will appear here."
    />
  ),
});
