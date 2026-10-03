import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/campus-navigation")({
  component: () => <PlaceholderPage title="Campus Navigation" />,
});
