import type { User } from "@/types/erp";

let currentUser: User | null = null;
let currentToken: string | null = null;

export function getCurrentUser(): User | null {
  return currentUser;
}

export function setCurrentUser(user: User | null): void {
  currentUser = user;
  if (!user) currentToken = null;
}

export function completePasswordChange(): User | null {
  if (!currentUser) return null;
  currentUser = { ...currentUser, mustChangePassword: false };
  return currentUser;
}

export function getAuthToken(): string | null {
  return currentToken;
}

export function setAuthToken(token: string | null): void {
  currentToken = token;
}
