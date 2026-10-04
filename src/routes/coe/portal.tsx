import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/coe/portal")({
  beforeLoad: () => {
    throw redirect({ to: "/erp" });
  },
});
