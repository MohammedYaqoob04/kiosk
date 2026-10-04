import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Camera, LockKeyhole, Mail, MapPin, Phone, UserRound } from "lucide-react";

import { api } from "@/api";
import { useApi } from "@/api/use-api";
import { ErrorState } from "@/components/erp/ErrorState";
import { PageBanner } from "@/components/erp/PageBanner";
import { Skeleton } from "@/components/erp/Skeleton";
import { requireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/erp/profile")({
  beforeLoad: requireAuth,
  shouldReload: true,
  component: StudentProfile,
  head: () => ({ meta: [{ title: "Student Profile | Arunai ERP" }] }),
});

type PrivateField = "dateOfBirth" | "mobile" | "email";

function StudentProfile() {
  const { data: profile, loading, error, reload } = useApi(["erp", "profile"], api.getProfile);
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
    }, 10_000);
  };

  if (loading) return <Skeleton rows={4} className="flex-1 p-4" />;
  if (error || !profile) {
    return (
      <div className="p-4">
        <ErrorState
          message={error?.message ?? "Profile details are unavailable."}
          onRetry={reload}
        />
      </div>
    );
  }

  const lastLogin = profile.lastLoginAt
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(profile.lastLoginAt),
      )
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
      <PageBanner
        title="Student Profile"
        subtitle="Personal and academic details"
        icon={UserRound}
      />
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(250px,0.8fr)_minmax(0,2fr)]">
        <section className="erp-surface flex flex-col items-center justify-center gap-3 p-5 text-center">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={`${profile.name} profile`}
              className="size-28 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <div className="grid size-28 place-items-center rounded-full border border-white/10 bg-violet-400/10 text-violet-200">
              <Camera aria-hidden="true" className="size-10" strokeWidth={1.5} />
            </div>
          )}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">{profile.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Last login: {lastLogin}</p>
          </div>
          <Link
            to="/erp/password"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-5 text-base font-semibold text-foreground active:bg-white/10"
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
                className="flex min-h-[76px] min-w-0 items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-rose-400/10 text-rose-300">
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
                    className="min-h-14 shrink-0 rounded-lg px-2 text-sm font-medium text-rose-200 active:bg-white/5"
                  >
                    {revealed[privateField] ? "Shown" : "Tap to reveal"}
                  </button>
                )}
              </div>
            ))}
          </dl>
        </section>
      </div>
      <p className="erp-surface shrink-0 border-rose-300/20 px-4 py-3 text-base text-rose-200">
        If there is any correction in your personal details, please contact the office.
      </p>
    </div>
  );
}

function maskPrivateValue(field: PrivateField, value: string): string {
  if (field === "email") return "••• ••• •••";
  return `••• ••• ${value.slice(-4)}`;
}
