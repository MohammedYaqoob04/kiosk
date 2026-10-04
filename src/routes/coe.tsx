import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/coe")({
  beforeLoad: () => {
    throw redirect({ to: "/erp" });
  },
});
