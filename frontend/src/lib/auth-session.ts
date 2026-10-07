import type { User } from "@/types/erp";

const TOKEN_KEY = "kiosk-auth-token";
const USER_KEY = "kiosk-auth-user";

let currentUser: User | null = null;
let currentToken: string | null = null;

if (typeof window !== "undefined") {
  try {
    const savedToken = window.sessionStorage.getItem(TOKEN_KEY);
    const savedUser = window.sessionStorage.getItem(USER_KEY);
    if (savedToken) currentToken = savedToken;
    if (savedUser) currentUser = JSON.parse(savedUser) as User;
  } catch {
    // Ignore storage parse errors
  }
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function setCurrentUser(user: User | null): void {
  currentUser = user;
  if (typeof window !== "undefined") {
    if (user) {
      window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      window.sessionStorage.removeItem(USER_KEY);
      window.sessionStorage.removeItem(TOKEN_KEY);
    }
  }
  if (!user) currentToken = null;
}

export function completePasswordChange(): User | null {
  if (!currentUser) return null;
  currentUser = { ...currentUser, mustChangePassword: false };
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  }
  return currentUser;
}

export function getAuthToken(): string | null {
  return currentToken;
}

export function setAuthToken(token: string | null): void {
  currentToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      window.sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_KEY);
    }
  }
}
