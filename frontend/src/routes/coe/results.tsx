import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/coe/results")({
  beforeLoad: () => {
    throw redirect({ to: "/erp" });
  },
});
