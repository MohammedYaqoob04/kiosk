import { useEffect, useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Delete, RotateCcw } from "lucide-react";

import { KioskKeyboard } from "@/components/KioskKeyboard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getCurrentUser } from "@/lib/auth-session";

const loginRoles = ["student", "staff", "hod"] as const;
type LoginRole = (typeof loginRoles)[number];
type LoginField = "identifier" | "pin";

function isLoginRole(value: unknown): value is LoginRole {
  return loginRoles.includes(value as LoginRole);
}

export const Route = createFileRoute("/erp/login")({
  shouldReload: true,
  beforeLoad: () => {
    const user = getCurrentUser();
    if (user) {
      throw redirect({
        to: user.role === "STUDENT" ? "/erp/dashboard" : "/erp/staff",
        replace: true,
      });
    }
  },
  validateSearch: (search: Record<string, unknown>) => ({
    role: isLoginRole(search["role"]) ? search["role"] : "student",
  }),
  component: ErpLogin,
  head: () => ({ meta: [{ title: "ERP sign in | Arunai" }] }),
});

const roleDetails = {
  student: {
    label: "Student",
    identifierLabel: "Register number",
    credentialLabel: "4-digit PIN",
    authRole: "STUDENT",
    accentClass: "login-role-student",
  },
  staff: {
    label: "Staff",
    identifierLabel: "Staff ID",
    credentialLabel: "Password",
    authRole: "COUNSELLOR",
    accentClass: "login-role-staff",
  },
  hod: {
    label: "HOD",
    identifierLabel: "HOD ID",
    credentialLabel: "Password",
    authRole: "HOD",
    accentClass: "login-role-hod",
  },
} as const;

function ErpLogin() {
  const { role } = Route.useSearch();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeField, setActiveField] = useState<LoginField>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [credential, setCredential] = useState("");
  const [error, setError] = useState("");
  const [shift, setShift] = useState(true);
  const [nativeTextInput, setNativeTextInput] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 899px)").matches,
  );
  const details = roleDetails[role];
  const isStudent = role === "student";

  useEffect(() => {
    setActiveField("identifier");
    setIdentifier("");
    setCredential("");
    setError("");
    setShift(true);
  }, [role]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 899px)");
    const updateInputMode = () => setNativeTextInput(media.matches);
    updateInputMode();
    media.addEventListener("change", updateInputMode);
    return () => media.removeEventListener("change", updateInputMode);
  }, []);

  const changeRole = (nextRole: LoginRole) => {
    setActiveField("identifier");
    setIdentifier("");
    setCredential("");
    setError("");
    void navigate({
      to: "/erp/login",
      search: { role: nextRole },
      replace: true,
    });
  };

  const setIdentifierValue = (value: string) => {
    setIdentifier(isStudent ? value : value.toUpperCase());
    setError("");
  };

  const setCredentialValue = (value: string) => {
    setCredential(value);
    setError("");
  };

  const submit = () => {
    try {
      login(details.authRole, identifier.trim(), credential);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    }
  };

  const appendText = (character: string) => {
    if (activeField === "identifier") {
      setIdentifierValue(`${identifier}${character}`);
    } else {
      setCredentialValue(`${credential}${character}`);
    }
  };

  const backspace = () => {
    if (activeField === "identifier") setIdentifierValue(identifier.slice(0, -1));
    else setCredentialValue(credential.slice(0, -1));
  };

  const clearActive = () => {
    if (activeField === "identifier") setIdentifierValue("");
    else setCredentialValue("");
  };

  const appendDigit = (digit: string) => {
    if (activeField === "identifier") {
      if (identifier.length < 16) setIdentifierValue(`${identifier}${digit}`);
    } else if (credential.length < 4) {
      setCredentialValue(`${credential}${digit}`);
    }
  };

  const canSubmit =
    Boolean(identifier.trim()) && (isStudent ? credential.length === 4 : credential.length > 0);

  return (
    <div className={`erp-login-layout ${isStudent ? "" : "is-text-login"} ${details.accentClass}`}>
      <section className="erp-login-details">
        <div className="erp-login-topline">
          <Link
            to="/erp"
            className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-card px-4 text-base font-semibold text-foreground active:bg-accent"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
            Back
          </Link>
          <div aria-label="Choose portal" className="erp-login-role-switch">
            {loginRoles.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={role === option}
                onClick={() => changeRole(option)}
                className={`erp-login-role-option ${role === option ? "is-active" : ""}`}
              >
                <span className="erp-login-role-label">{roleDetails[option].label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="erp-login-heading">
          <h1 className="font-display text-3xl font-bold leading-tight text-foreground">
            {details.label} Login
          </h1>
        </div>

        <div className="erp-login-fields">
          {isStudent ? (
            <>
              <label className="grid min-w-0 gap-2 text-base font-semibold text-foreground">
                {details.identifierLabel}
                <input
                  aria-label={details.identifierLabel}
                  className={`erp-login-input ${activeField === "identifier" ? "is-selected" : ""}`}
                  inputMode="none"
                  readOnly
                  value={identifier}
                  onClick={() => setActiveField("identifier")}
                />
              </label>
              <label className="grid min-w-0 gap-2 text-base font-semibold text-foreground">
                {details.credentialLabel}
                <input
                  aria-label={details.credentialLabel}
                  className={`erp-login-input ${activeField === "pin" ? "is-selected" : ""}`}
                  inputMode="none"
                  readOnly
                  value={"●".repeat(credential.length)}
                  onClick={() => setActiveField("pin")}
                />
              </label>
            </>
          ) : (
            <>
              <label className="grid min-w-0 gap-2 text-base font-semibold text-foreground">
                {details.identifierLabel}
                <input
                  aria-label={details.identifierLabel}
                  className={`erp-login-input kiosk-text-input ${activeField === "identifier" ? "is-selected" : ""}`}
                  type="text"
                  inputMode={nativeTextInput ? "text" : "none"}
                  autoCapitalize="characters"
                  autoComplete="username"
                  readOnly={!nativeTextInput}
                  value={identifier}
                  onClick={() => setActiveField("identifier")}
                  onChange={(event) => setIdentifierValue(event.currentTarget.value)}
                />
              </label>
              <label className="grid min-w-0 gap-2 text-base font-semibold text-foreground">
                {details.credentialLabel}
                <input
                  aria-label={details.credentialLabel}
                  className={`erp-login-input kiosk-text-input ${activeField === "pin" ? "is-selected" : ""}`}
                  type="password"
                  inputMode={nativeTextInput ? "text" : "none"}
                  autoComplete="current-password"
                  readOnly={!nativeTextInput}
                  value={credential}
                  onClick={() => setActiveField("pin")}
                  onChange={(event) => setCredentialValue(event.currentTarget.value)}
                />
              </label>
            </>
          )}
        </div>
      </section>

      <form
        className="erp-login-keypad-panel"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {isStudent ? (
          <div className="erp-login-keypad" aria-label="Numeric keypad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <button
                key={digit}
                type="button"
                className="erp-login-key"
                onClick={() => appendDigit(digit)}
                aria-label={`Enter ${digit}`}
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              className="erp-login-key erp-login-key-action"
              onClick={clearActive}
              aria-label="Clear selected field"
            >
              <RotateCcw aria-hidden="true" className="size-5" />
              Clear
            </button>
            <button
              type="button"
              className="erp-login-key"
              onClick={() => appendDigit("0")}
              aria-label="Enter 0"
            >
              0
            </button>
            <button
              type="button"
              className="erp-login-key erp-login-key-action"
              onClick={backspace}
              aria-label="Delete last digit"
            >
              <Delete aria-hidden="true" className="size-5" />
              Backspace
            </button>
          </div>
        ) : (
          <div className="kiosk-keyboard-desktop">
            <KioskKeyboard
              shift={shift}
              onShift={() => setShift((current) => !current)}
              onCharacter={appendText}
              onBackspace={backspace}
              onClear={clearActive}
            />
          </div>
        )}
        <Button
          type="submit"
          disabled={!canSubmit}
          className="erp-login-submit min-h-14 w-full text-lg font-semibold"
        >
          Sign in <ArrowRight aria-hidden="true" />
        </Button>
        <p role="alert" className="erp-login-error">
          {error}
        </p>
      </form>
    </div>
  );
}
