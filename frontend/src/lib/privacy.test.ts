import { beforeEach, describe, expect, it } from "vitest";

import { clearKioskSessionData } from "@/lib/privacy";

describe("clearKioskSessionData", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("clears all browser session data and local storage", () => {
    window.localStorage.setItem("arunai-erp-leave-requests", "mock requests");
    window.localStorage.setItem("student-profile", "private profile");
    window.sessionStorage.setItem("auth-state", "signed in");

    clearKioskSessionData();

    expect(window.localStorage.getItem("arunai-erp-leave-requests")).toBeNull();
    expect(window.localStorage.getItem("student-profile")).toBeNull();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });
});
