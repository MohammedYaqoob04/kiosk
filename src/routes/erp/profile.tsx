import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, LockKeyhole, Mail, MapPin, Phone, UserRound } from "lucide-react";

import { PageBanner } from "@/components/erp/PageBanner";
import { fakeProfile } from "@/lib/erpData";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/profile")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: StudentProfile,
  head: () => ({ meta: [{ title: "Student Profile | Arunai ERP" }] }),
});

type PrivateField = "dateOfBirth" | "mobile" | "email";

function StudentProfile() {
  const profile = fakeProfile;
  const [revealed, setRevealed] = useState<Partial<Record<PrivateField, boolean>>>({});
  const timers = useRef<Partial<Record<PrivateField, number>>>({});

  useEffect(
    () => () => Object.values(timers.current).forEach((timer) => window.clearTimeout(timer)),
    [],
  );

  const reveal = (field: PrivateField) => {
    setRevealed((current) => ({ ...current, [field]: true }));
    const oldTimer = timers.current[field];
    if (oldTimer) window.clearTimeout(oldTimer);
    timers.current[field] = window.setTimeout(() => {
      setRevealed((current) => ({ ...current, [field]: false }));
      delete timers.current[field];
    }, 15_000);
  };

  const lastLoginDate = profile.lastLoginAt ? new Date(profile.lastLoginAt) : null;
  const lastLogin = lastLoginDate
    ? `${String(lastLoginDate.getDate()).padStart(2, "0")}-${String(lastLoginDate.getMonth() + 1).padStart(2, "0")}-${lastLoginDate.getFullYear()} ${String(lastLoginDate.getHours()).padStart(2, "0")}:${String(lastLoginDate.getMinutes()).padStart(2, "0")}`
    : "--";
  const details: {
    label: string;
    value: string;
    privateField?: PrivateField;
  }[] = [
    { label: "Register No.", value: profile.registerNo },
    { label: "Name", value: profile.name },
    { label: "Batch", value: profile.batch },
    { label: "Programme", value: profile.programme },
    { label: "Semester", value: String(profile.semester) },
    { label: "Department", value: profile.department },
    { label: "Date of Birth", value: profile.dateOfBirth, privateField: "dateOfBirth" },
    { label: "Gender", value: profile.gender },
    { label: "Mobile No.", value: profile.mobile, privateField: "mobile" },
    { label: "Email ID", value: profile.email, privateField: "email" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4 lg:overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <PageBanner title="PROFILE" icon={UserRound} />
        <Link
          to="/erp/dashboard"
          className="inline-flex min-h-14 items-center rounded-lg border border-border bg-surface px-5 text-base font-semibold text-foreground"
        >
          Home
        </Link>
      </div>
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(250px,0.8fr)_minmax(0,2fr)]">
        <section className="erp-surface flex flex-col items-center justify-center gap-3 p-5 text-center">
          <div
            aria-label={`${profile.name} initials`}
            className="grid size-28 place-items-center rounded-full border border-border bg-secondary text-2xl font-semibold text-accent"
          >
            {profile.name
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">{profile.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Welcome {profile.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">Last Login Time : {lastLogin}</p>
          </div>
          <Link
            to="/erp/password"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 text-base font-semibold text-foreground active:bg-secondary"
          >
            <LockKeyhole aria-hidden="true" className="size-5" strokeWidth={1.5} />
            Change Password
          </Link>
        </section>

        <section aria-label="Profile details" className="erp-surface min-h-0 overflow-auto p-4">
          <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {details.map(({ label, value, privateField }) => (
              <div
                key={label}
                className="flex min-h-[76px] min-w-0 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-accent">
                  {privateField === "mobile" ? (
                    <Phone aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  ) : privateField === "email" ? (
                    <Mail aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  ) : privateField === "dateOfBirth" ? (
                    <CalendarDays aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  ) : (
                    <MapPin aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="truncate text-base font-medium text-foreground">
                    {privateField && !revealed[privateField]
                      ? maskPrivateValue(privateField, value)
                      : value}
                  </dd>
                </div>
                {privateField && (
                  <button
                    type="button"
                    onClick={() => reveal(privateField)}
                    className="min-h-14 shrink-0 rounded-lg px-2 text-sm font-medium text-foreground active:bg-secondary"
                  >
                    Show
                  </button>
                )}
              </div>
            ))}
          </dl>
        </section>
      </div>
      <p className="erp-surface shrink-0 px-4 py-3 text-base text-muted-foreground">
        <span className="text-danger">
          If there is any correction in your personal details, Please contact the office.
        </span>
      </p>
    </div>
  );
}

function maskPrivateValue(field: PrivateField, value: string): string {
  if (field === "email") {
    const [name, domain] = value.split("@");
    return name && domain ? `${name.slice(0, 1)}•••@${domain}` : "••••••••";
  }
  if (field === "dateOfBirth") return "0X-0X-20XX";
  return value.startsWith("98")
    ? `98XXXXXX${value.slice(-2)}`
    : `${value.slice(0, 2)}XXXXXX${value.slice(-2)}`;
}
