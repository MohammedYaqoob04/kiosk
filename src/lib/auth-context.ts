import { createContext, useContext } from "react";

import type { Role, User } from "@/types/erp";

export interface AuthContextValue {
  user: User | null;
  login: (role: Role, identifier: string, pin: string) => Promise<void> | void;
  logout: () => Promise<void> | void;
  completePasswordChange: () => void;
  warningOpen: boolean;
  staySignedIn: () => void;
  largeText: boolean;
  highContrast: boolean;
  extendedTimeout: boolean;
  setLargeText: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setExtendedTimeout: (enabled: boolean) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
