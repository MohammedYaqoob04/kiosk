import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, detail, icon: Icon }: StatCardProps) {
  return (
    <article className="erp-surface min-w-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 truncate font-display text-2xl font-semibold text-foreground">
            {value}
          </p>
          {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-accent">
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </span>
      </div>
    </article>
  );
}
