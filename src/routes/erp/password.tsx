import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";

import { KioskKeyboard } from "@/components/KioskKeyboard";
import { Button } from "@/components/ui/button";
import { PageBanner } from "@/components/erp/PageBanner";
import { useAuth } from "@/lib/auth-context";
import { requireAuth } from "@/lib/require-auth";
import { api } from "@/api";

export const Route = createFileRoute("/erp/password")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: ChangePassword,
  head: () => ({ meta: [{ title: "Change Password | Arunai ERP" }] }),
});

type PasswordField = "current" | "new" | "confirm";

function ChangePassword() {
  const { user, completePasswordChange } = useAuth();
  const navigate = useNavigate();
  const forced = user?.mustChangePassword === true;
  const isStudent = user?.role === "STUDENT";

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

  const maxLen = isStudent ? 32 : 64;

  const isNewPasswordValid = isStudent
    ? newPassword.length >= 6 && newPassword.length <= 32
    : newPassword.length >= 8 &&
      newPassword.length <= 64 &&
      /[A-Za-z]/.test(newPassword) &&
      /\d/.test(newPassword);

  const canSubmit =
    currentPassword.length > 0 &&
    isNewPasswordValid &&
    newPassword === confirmPassword &&
    newPassword !== currentPassword &&
    !success &&
    !submitting;

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => {
      if (forced) {
        completePasswordChange();
        void navigate({
          to:
            user?.role === "STUDENT"
              ? "/erp/dashboard"
              : user?.role === "HOD"
                ? "/erp/hod"
                : "/erp/staff",
          replace: true,
        });
      } else {
        void navigate({ to: "/erp/profile", replace: true });
      }
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [completePasswordChange, forced, navigate, success, user?.role]);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCharacter = (char: string) => {
    if (activeField === "current") {
      if (currentPassword.length < 128) setCurrentPassword((prev) => prev + char);
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

  const rulesText = isStudent
    ? "New password must be 6 to 32 characters, match the confirmation, and differ from the current password."
    : "New password must be 8 to 64 characters with at least one letter and one digit, match the confirmation, and differ from the current password.";

  const headingSubtitle = isStudent
    ? "New password must be 6 to 32 characters"
    : "New password must be 8 to 64 characters with at least one letter and one digit";

  return (
    <div className={`erp-password-layout ${forced ? "is-forced" : ""}`}>
      <section className="erp-password-fields">
        <div className="erp-password-heading">
          {forced ? (
            <>
              <ShieldCheck aria-hidden="true" className="size-7 text-accent" strokeWidth={1.5} />
              <h1 className="font-display text-2xl font-semibold text-foreground">
                Set your password
              </h1>
              <p className="text-sm text-muted-foreground">
                Choose a new password ({headingSubtitle.toLowerCase()}) to continue.
              </p>
            </>
          ) : (
            <PageBanner title="Change Password" subtitle={headingSubtitle} icon={LockKeyhole} />
          )}
        </div>

        <div className="grid gap-4">
          {/* Current Password Field */}
          <div className="grid gap-1.5">
            <span className="text-sm font-semibold text-foreground">Current Password</span>
            <div
              onClick={() => setActiveField("current")}
              className={`flex min-h-14 cursor-pointer items-center justify-between rounded-xl border bg-background px-4 py-2 text-lg text-foreground transition-colors ${
                activeField === "current"
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-input hover:border-border"
              }`}
            >
              <span className="font-mono tracking-wider">
                {currentPassword ? (
                  showCurrent ? (
                    currentPassword
                  ) : (
                    "●".repeat(currentPassword.length)
                  )
                ) : (
                  <span className="font-sans text-sm text-muted-foreground tracking-normal">
                    Enter current password
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCurrent((v) => !v);
                }}
                className="ml-2 text-muted-foreground hover:text-foreground"
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
              >
                {showCurrent ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">New Password</span>
              <span className="text-xs text-muted-foreground">
                {isStudent ? "6–32 chars" : "8–64 chars (1 letter, 1 digit)"}
              </span>
            </div>
            <div
              onClick={() => setActiveField("new")}
              className={`flex min-h-14 cursor-pointer items-center justify-between rounded-xl border bg-background px-4 py-2 text-lg text-foreground transition-colors ${
                activeField === "new"
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-input hover:border-border"
              }`}
            >
              <span className="font-mono tracking-wider">
                {newPassword ? (
                  showNew ? (
                    newPassword
                  ) : (
                    "●".repeat(newPassword.length)
                  )
                ) : (
                  <span className="font-sans text-sm text-muted-foreground tracking-normal">
                    {isStudent ? "At least 6 characters" : "At least 8 chars with letter & digit"}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNew((v) => !v);
                }}
                className="ml-2 text-muted-foreground hover:text-foreground"
                aria-label={showNew ? "Hide new password" : "Show new password"}
              >
                {showNew ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div className="grid gap-1.5">
            <span className="text-sm font-semibold text-foreground">Confirm New Password</span>
            <div
              onClick={() => setActiveField("confirm")}
              className={`flex min-h-14 cursor-pointer items-center justify-between rounded-xl border bg-background px-4 py-2 text-lg text-foreground transition-colors ${
                activeField === "confirm"
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-input hover:border-border"
              }`}
            >
              <span className="font-mono tracking-wider">
                {confirmPassword ? (
                  showConfirm ? (
                    confirmPassword
                  ) : (
                    "●".repeat(confirmPassword.length)
                  )
                ) : (
                  <span className="font-sans text-sm text-muted-foreground tracking-normal">
                    Re-enter new password
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm((v) => !v);
                }}
                className="ml-2 text-muted-foreground hover:text-foreground"
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Password rules:</p>
          <p className="mt-1">{rulesText}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Students: 6 to 32 characters • Staff and HOD: 8 to 64 characters with at least one letter and one digit
          </p>
        </div>

        {!forced && (
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate({ to: "/erp/profile" })}
            className="min-h-14 w-fit gap-2 px-5 text-base"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
            Cancel
          </Button>
        )}
      </section>

      <section className="erp-password-keypad w-full">
        <KioskKeyboard
          layout="full"
          shift={shift}
          onShift={() => setShift((v) => !v)}
          onCharacter={handleCharacter}
          onBackspace={handleBackspace}
          onClear={handleClear}
          isPassword={true}
          passwordVisible={activeVisible}
          onTogglePassword={toggleActiveVisibility}
        />

        <Button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="min-h-14 w-full text-lg font-semibold mt-2"
        >
          {submitting ? "Updating Password…" : "Update Password"}
        </Button>

        {error && (
          <p role="alert" className="text-base font-semibold text-destructive">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-base font-semibold text-ok">
            Password updated successfully.
          </p>
        )}
      </section>
    </div>
  );
}
