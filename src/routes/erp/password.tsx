import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { KeypadInput } from "@/components/KeypadInput";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/erp/password")({
  component: ChangePassword,
});

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const passwordsMatch = newPassword.length === 4 && newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length === 4 && passwordsMatch && newPassword !== currentPassword;

  const submit = () => {
    if (!canSubmit) return;
    setMessage("Password updated for this demo session.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Change password"
        description="Demo password update · Use the on-screen keypad"
      />
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-3">
          <KeypadInput
            label="Current password"
            value={currentPassword}
            onChange={(value) => {
              setCurrentPassword(value);
              setMessage("");
            }}
            maxLength={4}
            masked
            placeholder="4 digits"
          />
          <KeypadInput
            label="New password"
            value={newPassword}
            onChange={(value) => {
              setNewPassword(value);
              setMessage("");
            }}
            maxLength={4}
            masked
            placeholder="4 digits"
          />
          <KeypadInput
            label="Confirm new password"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              setMessage("");
            }}
            maxLength={4}
            masked
            placeholder="4 digits"
          />
        </div>
        {confirmPassword.length === 4 && !passwordsMatch && (
          <p role="alert" className="mt-4 text-lg text-destructive">
            The new password and confirmation do not match.
          </p>
        )}
        {newPassword.length === 4 && newPassword === currentPassword && (
          <p role="alert" className="mt-4 text-lg text-destructive">
            Choose a new password different from the current password.
          </p>
        )}
        <Button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="mt-6 min-h-14 w-full text-lg font-semibold sm:w-auto sm:px-8"
        >
          Update password
        </Button>
        {message && (
          <p role="status" className="mt-4 text-lg font-medium text-primary">
            {message}
          </p>
        )}
        <p className="mt-4 text-lg text-muted-foreground">
          This demo confirms the change on screen only. No password is stored or sent.
        </p>
      </section>
    </div>
  );
}
