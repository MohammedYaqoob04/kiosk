import { createFileRoute } from "@tanstack/react-router";

const roles = ["student", "staff", "hod"] as const;
type Role = (typeof roles)[number];

function isRole(value: unknown): value is Role {
  return value === "student" || value === "staff" || value === "hod";
}

export const Route = createFileRoute("/erp/login")({
  validateSearch: (search: Record<string, unknown>) => {
    if (!isRole(search["role"])) {
      throw new Error("ERP login role must be student, staff, or hod.");
    }
    return { role: search["role"] };
  },
  component: ErpLogin,
});

function ErpLogin() {
  const { role } = Route.useSearch();
  const title = {
    student: "Student Login",
    staff: "Staff Login",
    hod: "HOD Login",
  }[role];

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl">{title}</h1>
      <section className="mt-8 max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-foreground">Coming soon</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          The portal is being prepared. Please check back soon.
        </p>
      </section>
    </div>
  );
}
