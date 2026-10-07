import { createFileRoute } from "@tanstack/react-router";
import React, { Suspense } from "react";

const DevCampusEditor = import.meta.env.DEV
  ? React.lazy(() =>
      import("@/components/campus/CampusEditorPage").then((m) => ({
        default: m.CampusEditorPage,
      })),
    )
  : null;

export const Route = createFileRoute("/campus-editor")({
  component: function CampusEditorRouteComponent() {
    if (!import.meta.env.DEV || !DevCampusEditor) {
      return (
        <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>404 - Not Found</h2>
          <p>The campus editor is only available in development mode.</p>
        </div>
      );
    }
    return (
      <Suspense fallback={<div style={{ padding: 40, color: "#999" }}>Loading Campus Editor...</div>}>
        <DevCampusEditor />
      </Suspense>
    );
  },
  head: () => ({ meta: [{ title: "Campus Map Editor (DEV) | KIOSK" }] }),
});
