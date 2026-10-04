import { createFileRoute } from "@tanstack/react-router";

import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/campus")({
  component: () => <PlaceholderPage title="Explore Campus" />,
  head: () => ({ meta: [{ title: "Explore Campus | KIOSK" }] }),
});
