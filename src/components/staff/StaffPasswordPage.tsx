import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Eye, EyeOff, LockKeyhole, ShieldAlert, ShieldCheck } from "lucide-react";

import { KioskKeyboard } from "@/components/KioskKeyboard";
import { PageBanner } from "@/components/erp/PageBanner";
import { useAuth } from "@/lib/auth-context";
import { api, formatServerError } from "@/api";

type PasswordField = "current" | "new" | "confirm";

export function StaffPasswordPage() {
  const { user, completePasswordChange } = useAuth();
  const navigate = useNavigate();

  const [activeField, setActiveField] = useState<PasswordField>("current");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [shift, setShift] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const maxLen = 64;

  // Staff password validation: >= 8 characters, alphanumeric
  const hasMinLength = newPassword.length >= 8 && newPassword.length <= maxLen;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const isNewPasswordValid = hasMinLength && hasLetter && hasDigit;

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent = newPassword.length > 0 && newPassword !== currentPassword;

  const canSubmit =
    currentPassword.length > 0 &&
    isNewPasswordValid &&
    passwordsMatch &&
    isDifferentFromCurrent &&
    !success &&
    !submitting;

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => {
      completePasswordChange();
      void navigate({ to: "/erp/staff", replace: true });
    }, 1500);
    return () => window.clearTimeout(timeout);
  }, [completePasswordChange, navigate, success]);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(formatServerError(err, "Failed to change password. Please verify your current password."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCharacter = (char: string) => {
    if (activeField === "current") {
      if (currentPassword.length < maxLen) setCurrentPassword((prev) => prev + char);
    } else if (activeField === "new") {
      if (newPassword.length < maxLen) setNewPassword((prev) => prev + char);
    } else {
      if (confirmPassword.length < maxLen) setConfirmPassword((prev) => prev + char);
    }
    setError("");
  };

  const handleBackspace = () => {
    if (activeField === "current") setCurrentPassword((prev) => prev.slice(0, -1));
    else if (activeField === "new") setNewPassword((prev) => prev.slice(0, -1));
    else setConfirmPassword((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    if (activeField === "current") setCurrentPassword("");
    else if (activeField === "new") setNewPassword("");
    else setConfirmPassword("");
    setError("");
  };

  const activeVisible =
    activeField === "current" ? showCurrent : activeField === "new" ? showNew : showConfirm;

  const toggleActiveVisibility = () => {
    if (activeField === "current") setShowCurrent((v) => !v);
    else if (activeField === "new") setShowNew((v) => !v);
    else setShowConfirm((v) => !v);
  };

  return (
    <div className="staff-portal-page flex flex-col gap-4 p-4">
      <PageBanner
        title="Change Staff Password"
        subtitle={`Update account password for ${user?.name || "Staff Member"}`}
        icon={LockKeyhole}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* Left: Input Form */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Staff Security Credentials</h2>
            <Link
              to="/erp/staff"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          {/* Success Banner */}
          {success && (
            <div className="rounded-xl border border-ok/30 bg-ok/10 p-4 text-sm font-semibold text-ok flex items-center gap-2">
              <Check className="size-5 shrink-0" />
              <span>Password updated successfully! Redirecting to staff dashboard...</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3.5">
            {/* Current Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">Current Password</label>
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {showCurrent ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  <span>{showCurrent ? "Hide" : "Show"}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveField("current")}
                className={`w-full min-h-12 rounded-lg border px-3 text-left font-mono text-sm transition-colors ${
                  activeField === "current"
                    ? "border-accent bg-accent/5 ring-2 ring-accent"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                {currentPassword
                  ? showCurrent
                    ? currentPassword
                    : "•".repeat(currentPassword.length)
                  : <span className="text-muted-foreground font-sans text-xs">Tap to enter current password</span>}
              </button>
            </div>

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">New Password</label>
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {showNew ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  <span>{showNew ? "Hide" : "Show"}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveField("new")}
                className={`w-full min-h-12 rounded-lg border px-3 text-left font-mono text-sm transition-colors ${
                  activeField === "new"
                    ? "border-accent bg-accent/5 ring-2 ring-accent"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                {newPassword
                  ? showNew
                    ? newPassword
                    : "•".repeat(newPassword.length)
                  : <span className="text-muted-foreground font-sans text-xs">Tap to enter new password</span>}
              </button>
            </div>

            {/* Confirm New Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  <span>{showConfirm ? "Hide" : "Show"}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveField("confirm")}
                className={`w-full min-h-12 rounded-lg border px-3 text-left font-mono text-sm transition-colors ${
                  activeField === "confirm"
                    ? "border-accent bg-accent/5 ring-2 ring-accent"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                {confirmPassword
                  ? showConfirm
                    ? confirmPassword
                    : "•".repeat(confirmPassword.length)
                  : <span className="text-muted-foreground font-sans text-xs">Tap to confirm new password</span>}
              </button>
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="rounded-lg border border-border bg-surface-2 p-3 text-xs space-y-1.5">
            <span className="font-bold text-foreground block mb-1">Password Requirements:</span>
            <div className="flex items-center gap-2">
              <span className={hasMinLength ? "text-ok font-bold" : "text-muted-foreground"}>
                {hasMinLength ? "✓" : "○"} At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={hasLetter ? "text-ok font-bold" : "text-muted-foreground"}>
                {hasLetter ? "✓" : "○"} Contains at least one letter (A-Z)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={hasDigit ? "text-ok font-bold" : "text-muted-foreground"}>
                {hasDigit ? "✓" : "○"} Contains at least one number (0-9)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={passwordsMatch ? "text-ok font-bold" : "text-muted-foreground"}>
                {passwordsMatch ? "✓" : "○"} New password matches confirm password
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            <ShieldCheck className="size-4" />
            <span>{submitting ? "Updating Password..." : "Update Password"}</span>
          </button>
        </div>

        {/* Right: Touch Keypad (Kiosk rules) */}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-bold text-foreground">
            <span>
              Typing:{" "}
              <strong className="text-accent uppercase">
                {activeField === "current" ? "Current" : activeField === "new" ? "New" : "Confirm"}
              </strong>
            </span>
            <button
              type="button"
              onClick={toggleActiveVisibility}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {activeVisible ? "Hide" : "Show"}
            </button>
          </div>

          <KioskKeyboard
            layout="full"
            shift={shift}
            onShift={() => setShift((s) => !s)}
            onCharacter={handleCharacter}
            onBackspace={handleBackspace}
            onClear={handleClear}
            isPassword={true}
            passwordVisible={activeVisible}
            onTogglePassword={toggleActiveVisibility}
          />
        </div>
      </div>
    </div>
  );
}
