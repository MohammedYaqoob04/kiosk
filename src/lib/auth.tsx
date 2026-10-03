import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { AuthContext, type AuthContextValue } from "@/lib/auth-context";
import { getDemoUser } from "@/mock/erp";
import type { Role, User } from "@/types/erp";

const WARNING_AFTER_MS = 110_000;
const LOGOUT_AFTER_MS = 120_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [warningOpen, setWarningOpen] = useState(false);

  const logout = useCallback(() => {
    setUser(null);
    setWarningOpen(false);
    window.location.assign("/");
  }, []);

  const login = useCallback(
    (role: Role, identifier: string, pin: string) => {
      if (!identifier.trim() || !/^\d{4}$/.test(pin)) {
        throw new Error("Enter an ID and a four-digit PIN to sign in.");
      }
      const demoUser = getDemoUser(role);
      setUser(
        role === "STUDENT"
          ? {
              ...demoUser,
              identifier: identifier.trim(),
            }
          : demoUser,
      );
      setLastActivity(Date.now());
      setWarningOpen(false);
      void navigate({ to: role === "STUDENT" ? "/erp/dashboard" : "/erp/staff" });
    },
    [navigate],
  );

  const staySignedIn = useCallback(() => {
    setLastActivity(Date.now());
    setWarningOpen(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    const recordActivity = () => {
      setLastActivity(Date.now());
      setWarningOpen(false);
    };
    window.addEventListener("pointerdown", recordActivity, { passive: true });
    window.addEventListener("touchstart", recordActivity, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", recordActivity);
      window.removeEventListener("touchstart", recordActivity);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const warningTimeout = window.setTimeout(
      () => setWarningOpen(true),
      Math.max(0, WARNING_AFTER_MS - (Date.now() - lastActivity)),
    );
    const logoutTimeout = window.setTimeout(
      logout,
      Math.max(0, LOGOUT_AFTER_MS - (Date.now() - lastActivity)),
    );
    return () => {
      window.clearTimeout(warningTimeout);
      window.clearTimeout(logoutTimeout);
    };
  }, [lastActivity, logout, user]);

  const value = useMemo(
    () => ({ user, login, logout, warningOpen, staySignedIn }),
    [user, login, logout, warningOpen, staySignedIn],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
