import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Delete, RotateCcw, ShieldCheck } from "lucide-react";

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
  head: () => ({ meta: [{ title: "Student sign in | Arunai ERP" }] }),
});

function ErpLogin() {
  const { role } = Route.useSearch();
  const { login } = useAuth();
  const [activeField, setActiveField] = useState<LoginField>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [keypadMessage, setKeypadMessage] = useState("");

  const roleDetails = {
    student: { label: "Student", identifierLabel: "Register number", authRole: "STUDENT" },
    staff: { label: "Counsellor", identifierLabel: "Staff ID", authRole: "COUNSELLOR" },
    hod: { label: "Head of Department", identifierLabel: "Staff ID", authRole: "HOD" },
  } as const;
  const details = roleDetails[role];

  const submit = () => {
    try {
      login(details.authRole, identifier, pin);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    }
  };

  const updateActiveValue = (digit: string) => {
    if (activeField === "identifier") {
      if (identifier.length < 16) setIdentifier((value) => `${value}${digit}`);
    } else if (pin.length < 4) {
      setPin((value) => `${value}${digit}`);
    }
    setError("");
  };

  const clearActiveValue = () => {
    if (activeField === "identifier") setIdentifier("");
    else setPin("");
    setError("");
  };

  const deleteActiveValue = () => {
    if (activeField === "identifier") setIdentifier((value) => value.slice(0, -1));
    else setPin((value) => value.slice(0, -1));
    setError("");
  };

  const selectField = (field: LoginField) => {
    setActiveField(field);
    setKeypadMessage(field === "identifier" ? "Entering register or staff ID" : "Entering PIN");
    setError("");
  };

  return (
    <div className="erp-login-layout">
      <section className="erp-login-details">
        <Link
          to="/erp"
          className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-card px-4 text-lg font-semibold text-foreground active:bg-accent"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
          Back
        </Link>
        <div className="erp-login-intro">
          <span className="inline-flex min-h-12 items-center gap-2 rounded-full border border-primary/40 bg-card px-4 text-base font-semibold uppercase tracking-[0.12em] text-primary">
            <ShieldCheck aria-hidden="true" className="size-5" />
            Secure demo access
          </span>
          <h1 className="font-display text-3xl font-bold leading-tight text-foreground">
            Your campus, at a touch.
          </h1>
          <p className="text-lg text-muted-foreground">
            Sign in to continue to your student dashboard, timetable, results and campus services.
          </p>
          <div className="erp-login-heading">
            <p className="text-lg font-medium text-primary">{details.label} portal</p>
            <h2 className="font-display text-3xl font-bold text-foreground">Sign in to ERP</h2>
            <p className="text-lg text-muted-foreground">Demo mode · any four-digit PIN works</p>
          </div>
        </div>

        <div className="erp-login-fields">
          <label className="grid min-w-0 gap-2 text-lg font-semibold text-foreground">
            {details.identifierLabel}
            <input
              aria-label={details.identifierLabel}
              className={`erp-login-input ${activeField === "identifier" ? "is-selected" : ""}`}
              inputMode="none"
              readOnly
              value={identifier}
              placeholder="Use the on-screen keypad"
              onClick={() => selectField("identifier")}
            />
          </label>
          <label className="grid min-w-0 gap-2 text-lg font-semibold text-foreground">
            4-digit PIN
            <input
              aria-label="4-digit PIN"
              className={`erp-login-input ${activeField === "pin" ? "is-selected" : ""}`}
              inputMode="none"
              readOnly
              value={"●".repeat(pin.length)}
              placeholder="Enter PIN"
              onClick={() => selectField("pin")}
            />
          </label>
        </div>
        <p className="text-base text-muted-foreground">
          Sample identity and portal data are for demonstration only.
        </p>
      </section>

      <form
        className="erp-login-keypad-panel"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <p className="erp-login-keypad-label" aria-live="polite">
          {keypadMessage ||
            `Enter ${activeField === "identifier" ? details.identifierLabel : "PIN"}`}
        </p>
        <div className="erp-login-keypad" aria-label="On-screen keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              className="erp-login-key"
              onClick={() => updateActiveValue(digit)}
              aria-label={`Enter ${digit}`}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            className="erp-login-key erp-login-key-action"
            onClick={clearActiveValue}
            aria-label="Clear selected field"
          >
            <RotateCcw aria-hidden="true" className="size-5" />
            Clear
          </button>
          <button
            type="button"
            className="erp-login-key"
            onClick={() => updateActiveValue("0")}
            aria-label="Enter 0"
          >
            0
          </button>
          <button
            type="button"
            className="erp-login-key erp-login-key-action"
            onClick={deleteActiveValue}
            aria-label="Delete last digit"
          >
            <Delete aria-hidden="true" className="size-5" />
            Backspace
          </button>
        </div>
        <Button
          type="submit"
          disabled={!identifier.trim() || pin.length !== 4}
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
