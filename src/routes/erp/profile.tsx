import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/erp/profile")({
  component: StudentProfile,
});

function StudentProfile() {
  const { user } = useAuth();
  const detailGroups = [
    {
      title: "Identity",
      details: [
        ["Name", user?.name ?? "Student"],
        ["Register number", user?.identifier ?? "Not available"],
        ["Portal role", "Student · Demo"],
      ],
    },
    {
      title: "Academic",
      details: [
        ["Department", user?.department ?? "Not available"],
        ["Year", user?.year ?? "Not available"],
        ["Record status", "Sample profile"],
      ],
    },
    {
      title: "Portal",
      details: [
        ["Account type", "Student demo account"],
        ["Profile access", "Read only"],
        ["Contact information", "Not provided in demo"],
      ],
    },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader title="Profile" description="Student details · Read only · Sample data" />
      <div className="grid gap-5 lg:grid-cols-2">
        {detailGroups.map((group) => (
          <section
            key={group.title}
            aria-labelledby={`profile-${group.title}`}
            className="rounded-2xl border border-border bg-card p-5 sm:p-7"
          >
            <h2
              id={`profile-${group.title}`}
              className="mb-4 font-display text-2xl font-semibold text-foreground"
            >
              {group.title}
            </h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              {group.details.map(([label, value]) => (
                <div
                  key={label}
                  className="min-h-20 rounded-xl border border-border bg-secondary p-4"
                >
                  <dt className="text-lg text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-lg font-semibold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
