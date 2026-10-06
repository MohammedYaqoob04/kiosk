import { createFileRoute, notFound } from "@tanstack/react-router";
import { CampusEditorPage } from "@/components/campus/CampusEditorPage";

export const Route = createFileRoute("/campus-editor")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound();
    }
  },
  component: CampusEditorPage,
  head: () => ({ meta: [{ title: "Campus Map Editor (DEV) | KIOSK" }] }),
});
