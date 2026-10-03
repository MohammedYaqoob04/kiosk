import { CalendarDays, ClipboardList, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const icons = [CalendarDays, ClipboardList, FileText] as const;

export function ErpSectionPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader title={title} />
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-lg text-muted-foreground">{description}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {icons.map((Icon, index) => (
            <div
              key={index}
              className="flex min-h-24 items-center gap-4 rounded-xl border border-border bg-secondary p-4"
            >
              <span className="grid size-14 shrink-0 place-items-center rounded-lg border border-border bg-card text-icon">
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <span className="text-lg text-foreground">Demo information</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
