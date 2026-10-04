import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  accent?: "emerald" | "rose" | "orange" | "violet";
}

const accents = {
  emerald: "text-emerald-300 bg-emerald-400/10",
  rose: "text-rose-300 bg-rose-400/10",
  orange: "text-orange-300 bg-orange-400/10",
  violet: "text-violet-300 bg-violet-400/10",
};

export function StatCard({ label, value, detail, icon: Icon, accent = "violet" }: StatCardProps) {
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
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${accents[accent]}`}>
          <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </span>
      </div>
    </article>
  );
}
