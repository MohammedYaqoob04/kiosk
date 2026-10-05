import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Delete, Eye, EyeOff, RotateCcw } from "lucide-react";

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
      if (user.mustChangePassword) {
        throw redirect({
          to: "/erp/password",
          replace: true,
        });
      }
      throw redirect({
        to: user.role === "STUDENT" ? "/erp/dashboard" : user.role === "HOD" ? "/erp/hod" : "/erp/staff",
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
  },
  staff: {
    label: "Staff",
    identifierLabel: "Staff ID",
    credentialLabel: "Password",
    authRole: "COUNSELLOR",
  },
  hod: {
    label: "HOD",
    identifierLabel: "HOD ID",
    credentialLabel: "Password",
    authRole: "HOD",
  },
} as const;

function ErpLogin() {
  const { role } = Route.useSearch();
  const { login, logout } = useAuth();
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
    let timeout: number;
    const resetIdleTimeout = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        logout();
      }, 60_000);
    };
    resetIdleTimeout();
    window.addEventListener("pointerdown", resetIdleTimeout, { passive: true });
    window.addEventListener("keydown", resetIdleTimeout);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("pointerdown", resetIdleTimeout);
      window.removeEventListener("keydown", resetIdleTimeout);
    };
  }, [logout]);

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

  const goBack = () => void navigate({ to: "/erp", replace: true });

  const setIdentifierValue = (value: string) => {
    setIdentifier(isStudent ? value : value.toUpperCase());
    setError("");
  };

  const setCredentialValue = (value: string) => {
    setCredential(value);
    setError("");
  };

  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await login(details.authRole, identifier.trim(), credential);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    } finally {
      setLoading(false);
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

  const canSubmit = Boolean(identifier.trim()) && credential.length > 0;

  if (isStudent) {
    return <StudentLogin onBack={goBack} login={login} />;
  }

  return (
    <div className="erp-login-layout is-text-login">
      <section className="erp-login-details">
        <div className="erp-login-topline">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-card px-4 text-base font-semibold text-foreground active:bg-accent"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
            Back
          </button>
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
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-lpignore="true"
                  data-form-type="other"
                  name="kiosk-identifier"
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
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-lpignore="true"
                  data-form-type="other"
                  name="kiosk-credential"
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
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="kiosk-keyboard-desktop">
          <KioskKeyboard
            shift={shift}
            onShift={() => setShift((current) => !current)}
            onCharacter={appendText}
            onBackspace={backspace}
            onClear={clearActive}
          />
        </div>
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

function StudentLogin({
  onBack,
  login,
}: {
  onBack: () => void;
  login: ReturnType<typeof useAuth>["login"];
}) {
  const [activeField, setActiveField] = useState<LoginField>("identifier");
  const [registerSuffix, setRegisterSuffix] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [attempted, setAttempted] = useState(false);
  const setField = (field: LoginField) => {
    setActiveField(field);
  };
  const clear = () => {
    if (activeField === "identifier") setRegisterSuffix("");
    else setPassword("");
    setError("");
  };
  const backspace = () => {
    if (activeField === "identifier") setRegisterSuffix((value) => value.slice(0, -1));
    else setPassword((value) => value.slice(0, -1));
    setError("");
  };
  const [loading, setLoading] = useState(false);

  const appendDigit = (digit: string) => {
    if (activeField === "identifier") {
      setRegisterSuffix((value) => (value.length < 8 ? `${value}${digit}` : value));
    } else {
      setPassword((value) => (value.length < 32 ? `${value}${digit}` : value));
    }
    setError("");
  };
  const canSubmit = registerSuffix.length === 8 && password.length >= 4 && !loading;

  const submit = async () => {
    if (loading) return;
    setAttempted(true);
    if (!/^5104\d{8}$/.test(`5104${registerSuffix}`)) {
      setError("Register number must be 12 digits starting with 5104");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 digits");
      return;
    }
    setLoading(true);
    try {
      await login("STUDENT", `5104${registerSuffix}`, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Incorrect register number or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-login-layout">
      <section className="student-login-intro">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-card px-4 text-base font-semibold text-foreground active:bg-accent"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
            Back
          </button>
          <p className="text-base font-semibold text-muted-foreground">
            Arunai Engineering College
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-foreground">
            Student Login
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Authorized users only • Arunai ERP</p>
        </div>
        <ol className="student-login-steps">
          <li>
            <span>1</span> Enter register number
          </li>
          <li>
            <span>2</span> Enter DOB as DDMM
          </li>
          <li>
            <span>3</span> Sign in
          </li>
        </ol>
      </section>

      <form
        className="student-login-card"
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="student-login-field student-register-field">
          <span className="font-semibold text-foreground">Register number</span>
          <button
            type="button"
            aria-label={`Register number: 5104${registerSuffix || " locked prefix, enter 8 digits"}`}
            aria-pressed={activeField === "identifier"}
            onClick={() => setField("identifier")}
            className={`student-register-input ${activeField === "identifier" ? "is-selected" : ""}`}
          >
            <span className="student-prefix">5104</span>
            <span className="student-suffix">{registerSuffix}</span>
            <span className="student-counter">{registerSuffix.length}/8</span>
          </button>
          {attempted && registerSuffix.length !== 8 && (
            <span className="text-sm text-destructive">
              Register number must be 12 digits starting with 5104
            </span>
          )}
        </div>

        <div className="student-login-field student-password-field">
          <label htmlFor="student-password" className="font-semibold text-foreground">
            Password = birth date and month, e.g. 0105
          </label>
          <div className="student-password-box">
            <button
              id="student-password"
              type="button"
              onClick={() => setField("pin")}
              aria-label="Password, 4 digits"
              aria-pressed={activeField === "pin"}
              className={`student-password-cells ${activeField === "pin" ? "is-selected" : ""}`}
            >
              {Array.from({ length: Math.max(4, password.length) }, (_, index) => (
                <span key={index} className="student-password-cell">
                  {passwordVisible ? (password[index] ?? "") : password[index] ? "●" : ""}
                </span>
              ))}
              {!password && <span className="student-password-hint">DDMM</span>}
            </button>
            <button
              type="button"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              aria-pressed={passwordVisible}
              onClick={() => setPasswordVisible((visible) => !visible)}
              className="student-password-toggle"
            >
              {passwordVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
          {attempted && password.length !== 4 && (
            <span className="text-sm text-destructive">Password must be 4 digits (DDMM)</span>
          )}
        </div>

        <div className="student-login-keypad" aria-label="Numeric keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              className="erp-login-key"
              onClick={() => {
                appendDigit(digit);
                if (activeField === "identifier" && registerSuffix.length === 7)
                  setActiveField("pin");
              }}
              aria-label={`Enter ${digit}`}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            className="erp-login-key erp-login-key-action"
            onClick={clear}
            aria-label="Clear selected field"
          >
            <RotateCcw aria-hidden="true" className="size-5" />
            <span className="student-key-label">Clear</span>
          </button>
          <button
            type="button"
            className="erp-login-key"
            onClick={() => {
              appendDigit("0");
              if (activeField === "identifier" && registerSuffix.length === 7)
                setActiveField("pin");
            }}
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
            <span className="student-key-label">Backspace</span>
          </button>
        </div>
        <Button type="submit" disabled={!canSubmit} className="student-login-submit">
          Sign in <ArrowRight aria-hidden="true" />
        </Button>
        <p role="alert" className="erp-login-error">
          {error}
        </p>
      </form>
    </div>
  );
}
