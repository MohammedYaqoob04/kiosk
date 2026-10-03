import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { KeypadInput } from "@/components/KeypadInput";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/coe/login")({
  component: CoeLoginPage,
  head: () => ({ meta: [{ title: "Exam Portal Sign In | Arunai" }] }),
});

function CoeLoginPage() {
  const navigate = useNavigate();
  const [registerNumber, setRegisterNumber] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!registerNumber.trim() || !/^\d{4}$/.test(pin)) {
      setError("Enter a register number and a four-digit PIN.");
      return;
    }
    setError("");
    void navigate({ to: "/coe/portal" });
  };

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 text-center">
          <div className="mb-5 flex justify-start">
            <Link
              to="/coe"
              className="inline-flex min-h-14 items-center rounded-xl border border-border bg-card px-5 text-lg font-medium text-foreground active:bg-secondary"
            >
              Back to COE Home
            </Link>
          </div>
          <div className="mb-4 flex justify-center">
            <span className="inline-flex min-h-14 items-center gap-2 rounded-full border border-primary/50 bg-card px-5 font-display text-lg font-semibold uppercase tracking-[0.12em] text-primary">
              <ShieldCheck aria-hidden="true" className="size-5" />
              Kiosk
            </span>
          </div>
          <p className="text-lg font-medium text-muted-foreground">Student examination portal</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Sign in
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">Demo mode · any four-digit PIN works</p>
        </header>

        <section className="grid gap-6 rounded-3xl border border-border bg-card p-5 shadow-card md:grid-cols-2 md:p-8">
          <KeypadInput
            label="Register number"
            value={registerNumber}
            onChange={(value) => {
              setRegisterNumber(value);
              setError("");
            }}
            maxLength={16}
            placeholder="Use the on-screen keypad"
          />
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
          <div className="md:col-span-2">
            <Button
              type="button"
              onClick={submit}
              disabled={!registerNumber.trim() || pin.length !== 4}
              className="w-full text-lg font-semibold"
            >
              Continue to Exam Portal
            </Button>
            {error && (
              <p role="alert" className="mt-3 text-center text-lg text-destructive">
                {error}
              </p>
            )}
          </div>
        </section>
        <p className="mt-5 text-center text-lg text-muted-foreground">
          Sample identity and portal data are for demonstration only.
        </p>
      </div>
    </div>
  );
}
