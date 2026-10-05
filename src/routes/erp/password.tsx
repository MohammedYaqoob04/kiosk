import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";

import { TouchTextInput } from "@/components/TouchTextInput";
import { Button } from "@/components/ui/button";
import { PageBanner } from "@/components/erp/PageBanner";
import { useAuth } from "@/lib/auth-context";
import { requireAuth } from "@/lib/require-auth";

import { api } from "@/api";

export const Route = createFileRoute("/erp/password")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: ChangePassword,
  head: () => ({ meta: [{ title: "Change Password | Student ERP" }] }),
});

function ChangePassword() {
  const { user, completePasswordChange, logout } = useAuth();
  const navigate = useNavigate();
  const forced = user?.mustChangePassword === true;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
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
          to: user?.role === "STUDENT" ? "/erp/dashboard" : user?.role === "HOD" ? "/erp/hod" : "/erp/staff",
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
                Choose a new password with at least 6 characters to continue.
              </p>
            </>
          ) : (
            <PageBanner
              title="Change Password"
              subtitle="New password must contain at least 6 characters"
              icon={LockKeyhole}
            />
          )}
        </div>
        <div className="grid gap-3">
          <TouchTextInput
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            maxLength={32}
            masked
            placeholder="Tap to enter"
          />
          <TouchTextInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            maxLength={32}
            masked
            placeholder="At least 6 characters"
          />
          <TouchTextInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            maxLength={32}
            masked
            placeholder="Re-enter new password"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          New password must contain at least 6 characters, match the confirmation, and differ from
          the current password.
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
        <Button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="min-h-14 w-full text-lg font-semibold"
        >
          Update Password
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
