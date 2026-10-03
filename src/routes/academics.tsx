import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/academics")({
  head: () => ({ meta: [
    { title: "Academics | KIOSK" },
    { name: "description", content: "Academics section of the KIOSK college touch interface." },
    { property: "og:title", content: "Academics | KIOSK" },
    { property: "og:description", content: "Academics section of the KIOSK college touch interface." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <PlaceholderPage number="02" title="Academics" subtitle="Everything for your academic journey." icon={BookOpen} />,
});