import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/erp")({
  head: () => ({ meta: [
    { title: "ERP | KIOSK" },
    { name: "description", content: "ERP section of the KIOSK college touch interface." },
    { property: "og:title", content: "ERP | KIOSK" },
    { property: "og:description", content: "ERP section of the KIOSK college touch interface." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <PlaceholderPage number="04" title="ERP" subtitle="Your college services, connected." icon={LayoutGrid} />,
});