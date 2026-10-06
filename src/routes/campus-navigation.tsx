import { createFileRoute } from "@tanstack/react-router";

import { CampusPage } from "@/components/campus/CampusPage";
import "@/components/campus/campus-page.css";

export const Route = createFileRoute("/campus-navigation")({
  component: CampusPage,
  head: () => ({ meta: [{ title: "Campus Navigation | KIOSK" }] }),
});
