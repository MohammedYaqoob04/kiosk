import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearStudentLoginAttempts,
  getStudentLoginLockRemainingSeconds,
  recordStudentLoginFailure,
} from "@/lib/student-login-lock";

const firstRegisterNumber = "510423243001";
const secondRegisterNumber = "510423243002";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-04T00:00:00Z"));
  clearStudentLoginAttempts(firstRegisterNumber);
  clearStudentLoginAttempts(secondRegisterNumber);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("student login lock", () => {
  it("locks only the register number after five failures and expires after 60 seconds", () => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      expect(recordStudentLoginFailure(firstRegisterNumber)).toBe(0);
    }

    expect(recordStudentLoginFailure(firstRegisterNumber)).toBe(60);
    expect(getStudentLoginLockRemainingSeconds(secondRegisterNumber)).toBe(0);
    expect(recordStudentLoginFailure(firstRegisterNumber)).toBe(60);

    vi.advanceTimersByTime(60_000);

    expect(getStudentLoginLockRemainingSeconds(firstRegisterNumber)).toBe(0);
    expect(recordStudentLoginFailure(firstRegisterNumber)).toBe(0);
  });
});
