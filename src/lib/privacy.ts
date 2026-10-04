import { LEAVE_REQUEST_STORAGE_KEY } from "@/lib/leaveStore";

export function clearKioskSessionData(): void {
  if (typeof window === "undefined") return;

  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key !== LEAVE_REQUEST_STORAGE_KEY) window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.error("Unable to clear kiosk local storage.", error);
  }

  try {
    window.sessionStorage.clear();
  } catch (error) {
    console.error("Unable to clear kiosk session storage.", error);
  }
}
