import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/login/hod")({
  component: () => <PlaceholderPage title="HOD Login" />,
});
