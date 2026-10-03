import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

import { KeypadInput } from "@/components/KeypadInput";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const loginRoles = ["student", "staff", "hod"] as const;
type LoginRole = (typeof loginRoles)[number];
type LoginStep = "identifier" | "pin";

function isLoginRole(value: unknown): value is LoginRole {
  return loginRoles.includes(value as LoginRole);
}

export const Route = createFileRoute("/erp/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: isLoginRole(search["role"]) ? search["role"] : "student",
  }),
  component: ErpLogin,
  head: () => ({ meta: [{ title: "Student sign in | Arunai ERP" }] }),
});

function ErpLogin() {
  const { role } = Route.useSearch();
  const { login } = useAuth();
  const [step, setStep] = useState<LoginStep>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const roleDetails = {
    student: { label: "Student", identifierLabel: "Register number", authRole: "STUDENT" },
    staff: { label: "Counsellor", identifierLabel: "Staff ID", authRole: "COUNSELLOR" },
    hod: { label: "Head of Department", identifierLabel: "Staff ID", authRole: "HOD" },
  } as const;
  const details = roleDetails[role];

  const continueToPin = () => {
    if (!identifier.trim()) {
      setError(`Enter your ${details.identifierLabel.toLowerCase()}.`);
      return;
    }
    setError("");
    setStep("pin");
  };

  const submit = () => {
    try {
      login(details.authRole, identifier, pin);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-5rem)] w-full max-w-screen-2xl items-center px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="relative flex min-h-52 flex-col justify-between overflow-hidden border-b border-border bg-secondary p-6 sm:p-9 lg:min-h-full lg:border-b-0 lg:border-r">
            <div>
              <Link
                to="/"
                reloadDocument
                className="inline-flex min-h-14 items-center gap-2 rounded-xl border border-border bg-card px-4 text-lg font-semibold text-foreground active:bg-accent"
              >
                <ArrowLeft aria-hidden="true" className="size-5" />
                Back to Home
              </Link>
              <div className="mt-8 flex items-center gap-3">
                <span className="grid size-14 place-items-center rounded-xl border border-primary/40 bg-card font-display text-lg font-bold text-primary">
                  AEC
                </span>
                <div>
                  <p className="font-display text-xl font-bold text-foreground">ARUNAI ERP</p>
                  <p className="text-base text-muted-foreground">Student services kiosk</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <span className="inline-flex min-h-12 items-center gap-2 rounded-full border border-primary/40 bg-card px-4 text-base font-semibold uppercase tracking-[0.12em] text-primary">
                <ShieldCheck aria-hidden="true" className="size-5" />
                Secure demo access
              </span>
              <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                Your campus, at a touch.
              </h1>
              <p className="mt-3 max-w-md text-lg text-muted-foreground">
                Sign in to continue to your student dashboard, timetable, results and campus
                services.
              </p>
            </div>
          </aside>

          <section className="p-5 sm:p-9">
            <header className="mb-6">
              <p className="text-lg font-medium text-primary">{details.label} portal</p>
              <h2 className="mt-1 font-display text-3xl font-bold text-foreground">
                Sign in to ERP
              </h2>
              <p className="mt-2 text-lg text-muted-foreground">
                Demo mode · any four-digit PIN works
              </p>
            </header>

            <div
              className="mb-6 flex items-center gap-3"
              aria-label={`Sign-in step ${step === "identifier" ? 1 : 2} of 2`}
            >
              <span
                className={`grid size-10 place-items-center rounded-full border text-lg font-semibold ${
                  step === "identifier"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-primary/60 bg-primary/10 text-primary"
                }`}
              >
                1
              </span>
              <span className="h-px flex-1 bg-border" />
              <span
                className={`grid size-10 place-items-center rounded-full border text-lg font-semibold ${
                  step === "pin"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                2
              </span>
            </div>

            {step === "identifier" ? (
              <>
                <KeypadInput
                  label={details.identifierLabel}
                  value={identifier}
                  onChange={(value) => {
                    setIdentifier(value);
                    setError("");
                  }}
                  maxLength={16}
                  placeholder="Use the on-screen keypad"
                />
                <Button
                  type="button"
                  onClick={continueToPin}
                  disabled={!identifier.trim()}
                  className="mt-5 w-full text-lg font-semibold"
                >
                  Continue <ArrowRight aria-hidden="true" />
                </Button>
              </>
            ) : (
              <>
                <div className="mb-5 flex min-h-16 items-center justify-between gap-3 rounded-xl border border-border bg-secondary px-4">
                  <div className="min-w-0">
                    <p className="text-base text-muted-foreground">{details.identifierLabel}</p>
                    <p className="truncate text-lg font-semibold text-foreground">{identifier}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPin("");
                      setError("");
                      setStep("identifier");
                    }}
                    className="min-h-14 shrink-0 rounded-lg px-3 text-lg font-semibold text-primary active:bg-accent"
                  >
                    Edit
                  </button>
                </div>
                <KeypadInput
                  label="4-digit PIN"
                  value={pin}
                  onChange={(value) => {
                    setPin(value);
                    setError("");
                  }}
                  maxLength={4}
                  masked
                  placeholder="Enter PIN"
                />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep("identifier");
                      setPin("");
                      setError("");
                    }}
                    className="text-lg font-semibold"
                  >
                    <ArrowLeft aria-hidden="true" /> Back
                  </Button>
                  <Button
                    type="button"
                    onClick={submit}
                    disabled={pin.length !== 4}
                    className="text-lg font-semibold"
                  >
                    Sign in <ArrowRight aria-hidden="true" />
                  </Button>
                </div>
              </>
            )}
            {error && (
              <p role="alert" className="mt-4 text-center text-lg text-destructive">
                {error}
              </p>
            )}
            <p className="mt-6 text-center text-base text-muted-foreground">
              Sample identity and portal data are for demonstration only.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
