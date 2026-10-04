import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { AuthContext, type AuthContextValue } from "@/lib/auth-context";
import {
  completePasswordChange as clearForcedPasswordChange,
  setAuthToken,
  setCurrentUser,
} from "@/lib/auth-session";
import { resetLeaveRequests } from "@/lib/leave-store";
import { getDemoUser } from "@/mock/erp";
import type { Role, User } from "@/types/erp";

const STANDARD_IDLE_LIMIT_MS = 2 * 60_000;
const EXTENDED_IDLE_LIMIT_MS = 10 * 60_000;
const WARNING_BEFORE_LOGOUT_MS = 10_000;

function readSessionSetting(key: string): boolean {
  return typeof window !== "undefined" && window.sessionStorage.getItem(key) === "true";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [warningOpen, setWarningOpen] = useState(false);
  const [largeText, setLargeText] = useState(() => readSessionSetting("kiosk-large-text"));
  const [highContrast, setHighContrast] = useState(() => readSessionSetting("kiosk-high-contrast"));
  const [extendedTimeout, setExtendedTimeout] = useState(() =>
    readSessionSetting("kiosk-extended-timeout"),
  );

  const clearSession = useCallback(() => {
    setCurrentUser(null);
    setUser(null);
    setWarningOpen(false);
    queryClient.clear();
    resetLeaveRequests();
  }, [queryClient]);

  const logout = useCallback(() => {
    clearSession();
    void navigate({ to: "/erp", replace: true });
  }, [clearSession, navigate]);

  const expireSession = useCallback(() => {
    clearSession();
    void navigate({ to: "/", replace: true });
  }, [clearSession, navigate]);

  const completePasswordChange = useCallback(() => {
    const updatedUser = clearForcedPasswordChange();
    if (updatedUser) setUser(updatedUser);
  }, []);

  const login = useCallback(
    (role: Role, identifier: string, pin: string) => {
      if (!identifier.trim() || !/^\d{4}$/.test(pin)) {
        throw new Error("Enter an ID and a four-digit PIN to sign in.");
      }
      const demoUser = getDemoUser(role);
      const signedInUser =
        role === "STUDENT"
          ? {
              ...demoUser,
              identifier: identifier.trim(),
            }
          : demoUser;
      setCurrentUser(signedInUser);
      setAuthToken(`mock-session-${signedInUser.identifier}`);
      setUser(signedInUser);
      setLastActivity(Date.now());
      setWarningOpen(false);
      void navigate({
        to: role === "STUDENT" ? "/erp/dashboard" : "/erp/staff",
        replace: true,
      });
    },
    [navigate],
  );

  const staySignedIn = useCallback(() => {
    setLastActivity(Date.now());
    setWarningOpen(false);
  }, []);

  useEffect(() => {
    const recordActivity = (event: Event) => {
      if (event.target instanceof Element && event.target.closest('[role="alertdialog"]')) return;
      setLastActivity(Date.now());
      setWarningOpen(false);
    };
    window.addEventListener("pointerdown", recordActivity, { passive: true });
    window.addEventListener("touchstart", recordActivity, { passive: true });
    window.addEventListener("keydown", recordActivity);
    return () => {
      window.removeEventListener("pointerdown", recordActivity);
      window.removeEventListener("touchstart", recordActivity);
      window.removeEventListener("keydown", recordActivity);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const idleLimit = extendedTimeout ? EXTENDED_IDLE_LIMIT_MS : STANDARD_IDLE_LIMIT_MS;
    const warningTimeout = window.setTimeout(
      () => setWarningOpen(true),
      Math.max(0, idleLimit - WARNING_BEFORE_LOGOUT_MS - (Date.now() - lastActivity)),
    );
    const logoutTimeout = window.setTimeout(
      expireSession,
      Math.max(0, idleLimit - (Date.now() - lastActivity)),
    );
    return () => {
      window.clearTimeout(warningTimeout);
      window.clearTimeout(logoutTimeout);
    };
  }, [extendedTimeout, lastActivity, expireSession, user]);

  useEffect(() => {
    window.sessionStorage.setItem("kiosk-large-text", String(largeText));
    document.documentElement.classList.toggle("large-text", largeText);
  }, [largeText]);

  useEffect(() => {
    window.sessionStorage.setItem("kiosk-high-contrast", String(highContrast));
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  useEffect(() => {
    window.sessionStorage.setItem("kiosk-extended-timeout", String(extendedTimeout));
    document.documentElement.classList.toggle("extended-timeout", extendedTimeout);
  }, [extendedTimeout]);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      completePasswordChange,
      warningOpen,
      staySignedIn,
      largeText,
      highContrast,
      extendedTimeout,
      setLargeText,
      setHighContrast,
      setExtendedTimeout,
    }),
    [
      user,
      login,
      logout,
      completePasswordChange,
      warningOpen,
      staySignedIn,
      largeText,
      highContrast,
      extendedTimeout,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
