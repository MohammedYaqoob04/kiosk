import { createFileRoute } from "@tanstack/react-router";
import { House } from "lucide-react";
import { PlaceholderPage } from "@/components/placeholder-page";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Home | KIOSK" },
    { name: "description", content: "The home screen for KIOSK college touch services." },
    { property: "og:title", content: "Home | KIOSK" },
    { property: "og:description", content: "The home screen for KIOSK college touch services." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  return <PlaceholderPage number="01" title="Home" subtitle="Your campus, all in one place." icon={House} />;
}
