import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/faculty")({
  component: () => <PlaceholderPage title="Faculty Directory" />,
  head: () => ({ meta: [{ title: "Faculty Directory | KIOSK" }] }),
});
