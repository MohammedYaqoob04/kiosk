import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageBannerProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  chip?: ReactNode;
}

export function PageBanner({ title, subtitle, icon: Icon, chip }: PageBannerProps) {
  return (
    <header className="erp-surface flex min-w-0 items-center gap-4 p-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-rose-400/10 text-rose-300">
        <Icon aria-hidden="true" className="size-6" strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {chip && <div className="shrink-0">{chip}</div>}
    </header>
  );
}
