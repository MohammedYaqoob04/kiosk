import { createFileRoute } from "@tanstack/react-router";

import { CampusPage } from "@/components/campus/CampusPage";
import "@/components/campus/campus-page.css";

export const Route = createFileRoute("/campus")({
  component: CampusPage,
  head: () => ({ meta: [{ title: "Explore Campus | KIOSK" }] }),
});
