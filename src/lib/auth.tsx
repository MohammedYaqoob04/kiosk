import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { AuthContext, type AuthContextValue } from "@/lib/auth-context";
import { isMockApi } from "@/api";
import { httpApi } from "@/api/http";
import {
  completePasswordChange as clearForcedPasswordChange,
  getAuthToken,
  getCurrentUser,
  setAuthToken,
  setCurrentUser,
} from "@/lib/auth-session";
import { getDemoUser } from "@/mock/erp";
import type { Role, User } from "@/types/erp";
import { clearKioskSessionData } from "@/lib/privacy";


const STANDARD_IDLE_LIMIT_MS = 2 * 60_000;
const EXTENDED_IDLE_LIMIT_MS = 10 * 60_000;
const WARNING_BEFORE_LOGOUT_MS = 10_000;

function readSessionSetting(key: string): boolean {
  return typeof window !== "undefined" && window.sessionStorage.getItem(key) === "true";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [warningOpen, setWarningOpen] = useState(false);
  const [largeText, setLargeText] = useState(() => readSessionSetting("kiosk-large-text"));
  const [highContrast, setHighContrast] = useState(() => readSessionSetting("kiosk-high-contrast"));
  const [extendedTimeout, setExtendedTimeout] = useState(() =>
    readSessionSetting("kiosk-extended-timeout"),
  );
  const [sessionResetVersion, setSessionResetVersion] = useState(0);
  const skipSessionSettingsPersistence = useRef(false);

  const clearSession = useCallback(() => {
    clearKioskSessionData();
    skipSessionSettingsPersistence.current = true;
    setCurrentUser(null);
    setUser(null);
    setWarningOpen(false);
    setLargeText(false);
    setHighContrast(false);
    setExtendedTimeout(false);
    setSessionResetVersion((version) => version + 1);
    document.documentElement.classList.remove("large-text", "high-contrast", "extended-timeout");
    queryClient.clear();
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      if (!isMockApi && getAuthToken()) {
        await httpApi.logout();
      }
    } catch {
      // Ignore network failures on logout
    } finally {
      clearSession();
      void navigate({ to: "/erp", replace: true });
    }
  }, [clearSession, navigate]);

  const expireSession = useCallback(async () => {
    try {
      if (!isMockApi && getAuthToken()) {
        await httpApi.logout();
      }
    } catch {
      // Ignore network failures on session expiration
    } finally {
      clearSession();
      void navigate({ to: "/erp", replace: true });
    }
  }, [clearSession, navigate]);

  const completePasswordChange = useCallback(() => {
    const updatedUser = clearForcedPasswordChange();
    if (updatedUser) setUser(updatedUser);
  }, []);

  const login = useCallback(
    async (role: Role, identifier: string, pin: string) => {
      if (isMockApi) {
        if (role === "STUDENT") {
          if (!/^5104\d{8}$/.test(identifier)) {
            throw new Error("Register number must be 12 digits starting with 5104");
          }
          if (pin.length < 4) {
            throw new Error("Password must be at least 4 digits");
          }
        } else if (!identifier.trim()) {
          throw new Error("Enter your ID to sign in.");
        }
        if (role !== "STUDENT" && !pin.trim()) {
          throw new Error("Enter your password to sign in.");
        }
        const demoUser = getDemoUser(role);
        const signedInUser =
          role === "STUDENT"
            ? {
                ...demoUser,
                identifier: identifier.trim(),
              }
            : {
                ...demoUser,
                identifier: identifier.trim().toUpperCase(),
              };
        setCurrentUser(signedInUser);
        setAuthToken(`mock-session-${signedInUser.identifier}`);
        setUser(signedInUser);
        setLastActivity(Date.now());
        setWarningOpen(false);
        if (signedInUser.mustChangePassword) {
          void navigate({ to: "/erp/password", replace: true });
        } else {
          void navigate({
            to: role === "STUDENT" ? "/erp/dashboard" : role === "HOD" ? "/erp/hod" : "/erp/staff",
            replace: true,
          });
        }
        return;
      }

      // Backend login
      const portal = role === "STUDENT" ? "student" : role === "HOD" ? "hod" : "staff";
      const res = await httpApi.login(identifier.trim(), pin, portal);
      setAuthToken(res.accessToken);
      const signedInUser: User = {
        id: String(res.user.id),
        name: res.user.fullName || res.user.username,
        role: res.user.role as Role,
        identifier: res.user.username,
        department: res.user.department || "",
        departmentCode: res.user.department || "",
        year: "",
        mustChangePassword: Boolean(res.user.mustChangePassword),
      };
      setCurrentUser(signedInUser);
      setUser(signedInUser);
      setLastActivity(Date.now());
      setWarningOpen(false);
      if (signedInUser.mustChangePassword) {
        void navigate({ to: "/erp/password", replace: true });
      } else {
        void navigate({
          to: role === "STUDENT" ? "/erp/dashboard" : role === "HOD" ? "/erp/hod" : "/erp/staff",
          replace: true,
        });
      }
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
    if (!skipSessionSettingsPersistence.current) {
      window.sessionStorage.setItem("kiosk-large-text", String(largeText));
    }
    document.documentElement.classList.toggle("large-text", largeText);
  }, [largeText]);

  useEffect(() => {
    if (!skipSessionSettingsPersistence.current) {
      window.sessionStorage.setItem("kiosk-high-contrast", String(highContrast));
    }
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  useEffect(() => {
    if (!skipSessionSettingsPersistence.current) {
      window.sessionStorage.setItem("kiosk-extended-timeout", String(extendedTimeout));
    }
    document.documentElement.classList.toggle("extended-timeout", extendedTimeout);
  }, [extendedTimeout]);

  useEffect(() => {
    skipSessionSettingsPersistence.current = false;
  }, [highContrast, extendedTimeout, largeText, sessionResetVersion]);

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
