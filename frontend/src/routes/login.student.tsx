import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/login/student")({
  component: () => <PlaceholderPage title="Student Login" />,
});
