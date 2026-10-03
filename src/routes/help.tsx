import { createFileRoute } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [
    { title: "Help | KIOSK" },
    { name: "description", content: "Help section of the KIOSK college touch interface." },
    { property: "og:title", content: "Help | KIOSK" },
    { property: "og:description", content: "Help section of the KIOSK college touch interface." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <PlaceholderPage number="05" title="Help" subtitle="Support is always within reach." icon={CircleHelp} />,
});