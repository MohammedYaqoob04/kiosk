import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/notices")({
  component: () => <PlaceholderPage title="Notices" />,
});
