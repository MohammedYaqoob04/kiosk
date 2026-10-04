import { redirect } from "@tanstack/react-router";

import { getCurrentUser } from "@/lib/auth-session";

export function requireAuth(): void {
  if (!getCurrentUser()) {
    throw redirect({ to: "/erp", replace: true });
  }
}
