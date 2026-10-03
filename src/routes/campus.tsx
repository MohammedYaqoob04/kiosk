import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/campus")({
  head: () => ({ meta: [
    { title: "Campus | KIOSK" },
    { name: "description", content: "Campus section of the KIOSK college touch interface." },
    { property: "og:title", content: "Campus | KIOSK" },
    { property: "og:description", content: "Campus section of the KIOSK college touch interface." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <PlaceholderPage number="03" title="Campus" subtitle="Find your way around campus life." icon={Building2} />,
});