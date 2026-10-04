import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/coe/login")({
  beforeLoad: () => {
    throw redirect({ to: "/erp" });
  },
});
