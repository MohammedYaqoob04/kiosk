import { type LucideIcon, ArrowUpRight, Construction } from "lucide-react";

type PlaceholderPageProps = {
  number: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

export function PlaceholderPage({ number, title, subtitle, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 py-10 sm:px-10 sm:py-14 lg:px-16">
      <div className="flex items-start gap-4 sm:gap-6">
        <span className="mt-2 hidden size-12 shrink-0 place-items-center rounded-md bg-gold-soft text-primary sm:grid"><Icon size={25} strokeWidth={1.8} /></span>
        <div className="min-w-0">
          <p className="mb-3 flex items-center gap-3 text-base font-semibold text-primary"><span className="h-px w-6 bg-primary" /> Section {number}</p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">{title}<span className="text-primary">.</span></h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="mt-10 h-1 w-full bg-border sm:mt-14"><div className="h-full w-24 bg-primary" /></div>

      <section aria-label={`${title} placeholder`} className="mt-8 flex min-h-[330px] flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center sm:mt-10 sm:min-h-[440px]">
        <span className="mb-6 grid size-20 place-items-center rounded-2xl bg-secondary text-primary"><Construction size={34} strokeWidth={1.5} /></span>
        <p className="font-display text-2xl font-semibold text-foreground">Coming soon</p>
        <p className="mt-3 max-w-sm text-lg leading-relaxed text-muted-foreground">This section is ready for content. Check back soon.</p>
      </section>
      <div className="mt-5 flex items-center justify-between gap-4 text-base font-medium text-muted-foreground"><span>KIOSK / {title}</span><ArrowUpRight size={20} aria-hidden="true" /></div>
    </div>
  );
}