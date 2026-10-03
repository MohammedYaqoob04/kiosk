import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BookOpen, Building2, CircleHelp, GraduationCap, House, LayoutGrid, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const sections = [
  { to: "/", label: "Home", icon: House },
  { to: "/academics", label: "Academics", icon: BookOpen },
  { to: "/campus", label: "Campus", icon: Building2 },
  { to: "/erp", label: "ERP", icon: LayoutGrid },
  { to: "/help", label: "Help", icon: CircleHelp },
] as const;

export function KioskShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const current = sections.find((section) => section.to === pathname) ?? sections[0];

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[304px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen flex-col bg-sidebar px-5 py-8 text-sidebar-foreground lg:flex">
        <Link to="/" className="mb-12 flex min-h-16 items-center gap-3 px-3" aria-label="KIOSK home">
          <span className="grid size-12 shrink-0 place-items-center rounded-md border border-sidebar-border bg-sidebar-accent text-gold"><GraduationCap size={27} strokeWidth={1.8} /></span>
          <span className="min-w-0"><span className="block font-display text-2xl font-bold leading-none">KIOSK<span className="text-gold">.</span></span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/70">College services</span></span>
        </Link>
        <p className="mb-3 px-4 text-xs font-bold uppercase tracking-[0.15em] text-sidebar-foreground/60">Explore</p>
        <nav aria-label="Main navigation" className="flex flex-col gap-4">
          {sections.map(({ to, label, icon: Icon }) => (
            <Button key={to} asChild variant={pathname === to ? "navActive" : "nav"}>
              <Link to={to} aria-current={pathname === to ? "page" : undefined}>
                <Icon size={22} strokeWidth={1.8} className="!size-[22px]" />
                <span>{label}</span>
                {pathname === to && <span className="ml-auto size-1.5 rounded-full bg-gold" />}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="mt-auto border-t border-sidebar-border pt-6">
          <p className="px-4 text-xs text-sidebar-foreground/70">Made for campus life</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-card px-5 sm:px-8 lg:min-h-24 lg:px-12">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-xl font-bold text-primary lg:hidden" aria-label="KIOSK home">
            <GraduationCap size={27} className="shrink-0 text-gold" /> <span className="truncate">KIOSK<span className="text-gold">.</span></span>
          </Link>
          <div className="hidden min-w-0 lg:block"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">College kiosk</p><p className="truncate font-display text-lg font-semibold">{current.label}</p></div>
          <div className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted-foreground sm:px-4 sm:text-sm">
            <ShieldCheck size={18} className="shrink-0 text-success" aria-hidden="true" /><span>Demo mode</span>
          </div>
        </header>
        <main id="main-content" className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 pb-32 pt-8 sm:px-8 sm:pt-12 lg:px-12 lg:pb-12">
          <Outlet />
        </main>
      </div>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_-20px_var(--color-foreground)] lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 sm:gap-4">
          {sections.map(({ to, label, icon: Icon }) => (
            <Button key={to} asChild variant={pathname === to ? "navMobileActive" : "navMobile"} className="min-w-0 flex-1">
              <Link to={to} aria-current={pathname === to ? "page" : undefined}>
                <Icon size={21} strokeWidth={1.8} className="!size-[21px] shrink-0" />
                <span className="max-w-full truncate">{label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
}