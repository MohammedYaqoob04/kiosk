import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export function EmptyState({ title, description, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <section className="erp-surface flex min-h-40 flex-col items-center justify-center p-6 text-center">
      <Icon aria-hidden="true" className="mb-3 size-8 text-violet-300" strokeWidth={1.5} />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </section>
  );
}
