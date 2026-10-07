const STUDENT_LOGIN_ATTEMPT_LIMIT = 5;
const STUDENT_LOGIN_LOCK_MS = 60_000;

interface StudentLoginAttempt {
  failedAttempts: number;
  lockedUntil: number;
}

const studentLoginAttempts = new Map<string, StudentLoginAttempt>();

export function getStudentLoginLockRemainingSeconds(registerNumber: string): number {
  const attempt = studentLoginAttempts.get(registerNumber);
  if (!attempt?.lockedUntil) return 0;
  return Math.max(0, Math.ceil((attempt.lockedUntil - Date.now()) / 1000));
}

export function recordStudentLoginFailure(registerNumber: string): number {
  const remainingLock = getStudentLoginLockRemainingSeconds(registerNumber);
  if (remainingLock > 0) return remainingLock;

  const attempt = studentLoginAttempts.get(registerNumber) ?? {
    failedAttempts: 0,
    lockedUntil: 0,
  };
  attempt.failedAttempts += 1;
  if (attempt.failedAttempts >= STUDENT_LOGIN_ATTEMPT_LIMIT) {
    attempt.failedAttempts = 0;
    attempt.lockedUntil = Date.now() + STUDENT_LOGIN_LOCK_MS;
  }
  studentLoginAttempts.set(registerNumber, attempt);
  return getStudentLoginLockRemainingSeconds(registerNumber);
}

export function clearStudentLoginAttempts(registerNumber: string): void {
  studentLoginAttempts.delete(registerNumber);
}
