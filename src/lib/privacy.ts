export function clearKioskSessionData(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.clear();
  } catch (error) {
    console.error("Unable to clear kiosk local storage.", error);
  }

  try {
    window.sessionStorage.clear();
  } catch (error) {
    console.error("Unable to clear kiosk session storage.", error);
  }
}
