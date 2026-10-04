import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";

import { api } from "@/api";
import { KeypadInput } from "@/components/KeypadInput";
import { Button } from "@/components/ui/button";
import { PageBanner } from "@/components/erp/PageBanner";
import { useAuth } from "@/lib/auth-context";
import { requireAuth } from "@/lib/require-auth";

type PasswordField = "current" | "next" | "confirm";

export const Route = createFileRoute("/erp/password")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: ChangePassword,
  head: () => ({ meta: [{ title: "Change Password | Student ERP" }] }),
});

function ChangePassword() {
  const { user, completePasswordChange } = useAuth();
  const navigate = useNavigate();
  const forced = user?.mustChangePassword === true;
  const [activeField, setActiveField] = useState<PasswordField>("current");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const values: Record<PasswordField, string> = {
    current: currentPassword,
    next: newPassword,
    confirm: confirmPassword,
  };
  const setValue = (field: PasswordField, value: string) => {
    if (field === "current") setCurrentPassword(value);
    if (field === "next") setNewPassword(value);
    if (field === "confirm") setConfirmPassword(value);
    setError("");
    setSuccess(false);
  };

  const newPasswordValid = /^\d{6,8}$/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit =
    /^\d{4,8}$/.test(currentPassword) &&
    newPasswordValid &&
    passwordsMatch &&
    newPassword !== currentPassword &&
    !submitting;

  useEffect(() => {
    if (!success || !forced) return;
    const timeout = window.setTimeout(() => {
      completePasswordChange();
      void navigate({
        to: user?.role === "STUDENT" ? "/erp/dashboard" : "/erp/staff",
        replace: true,
      });
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [completePasswordChange, forced, navigate, success, user?.role]);

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await api.changePassword(currentPassword, newPassword);
      if (!result.changed) {
        setError("Password could not be changed. Please try again.");
        return;
      }
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update password.");
    } finally {
      setSubmitting(false);
    }
  };

  const labels: Record<PasswordField, string> = {
    current: "Current Password",
    next: "New Password",
    confirm: "Confirm Password",
  };

  return (
    <div className={`erp-password-layout ${forced ? "is-forced" : ""}`}>
      <section className="erp-password-fields">
        <div className="erp-password-heading">
          {forced ? (
            <>
              <ShieldCheck aria-hidden="true" className="size-7 text-rose-300" strokeWidth={1.5} />
              <h1 className="font-display text-2xl font-semibold text-foreground">
                Set your password
              </h1>
              <p className="text-sm text-muted-foreground">
                Choose a new 6–8 digit password to continue.
              </p>
            </>
          ) : (
            <PageBanner
              title="Change Password"
              subtitle="Use 6 to 8 digits for your new password"
              icon={LockKeyhole}
            />
          )}
        </div>
        <div className="grid gap-2">
          {(["current", "next", "confirm"] as const).map((field) => (
            <button
              key={field}
              type="button"
              aria-pressed={activeField === field}
              onClick={() => {
                setActiveField(field);
                setError("");
              }}
              className={`erp-password-field ${activeField === field ? "is-active" : ""}`}
            >
              <span className="text-sm text-muted-foreground">{labels[field]}</span>
              <span className="font-display text-lg tracking-[0.2em] text-foreground">
                {"●".repeat(values[field].length) || "Tap to enter"}
              </span>
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          New password must contain 6–8 digits, match the confirmation, and differ from the current
          password.
        </p>
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

      <section className="erp-password-keypad">
        <KeypadInput
          label={labels[activeField]}
          value={values[activeField]}
          onChange={(value) => setValue(activeField, value)}
          maxLength={8}
          masked
          placeholder={activeField === "current" ? "Current password" : "6–8 digits"}
        />
        <Button
          type="button"
          onClick={() => void submit()}
          disabled={!canSubmit}
          className="min-h-14 w-full text-lg font-semibold"
        >
          {submitting ? "Updating…" : "Update Password"}
        </Button>
        <p role="alert" className="erp-password-message">
          {error}
        </p>
        {success && (
          <p role="status" className="text-base font-semibold text-emerald-300">
            Password updated successfully.
          </p>
        )}
      </section>
    </div>
  );
}
