import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BookOpen, Building2, ContactRound, GraduationCap, House, MapPinned, Megaphone, ShieldCheck, Shapes } from "lucide-react";
import { Button } from "@/components/ui/button";

export const sections = [
  { to: "/", label: "Home", icon: House },
  { to: "/about", label: "About", icon: GraduationCap },
  { to: "/departments", label: "Departments", icon: BookOpen },
  { to: "/facilities", label: "Facilities", icon: Building2 },
  { to: "/campus-navigation", label: "Campus Navigation", icon: MapPinned },
  { to: "/contact", label: "Contact", icon: ContactRound },
  { to: "/notices", label: "Notices", icon: Megaphone },
] as const;

const mobileSections = [sections[0], sections[2], sections[3], sections[4], sections[6]] as const;

export function KioskShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const current = sections.find((section) => section.to === pathname) ?? sections[0];

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[304px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-sidebar px-5 py-8 text-sidebar-foreground lg:flex">
        <Link to="/" className="mb-12 flex min-h-16 items-center gap-3 px-3" aria-label="Arunai Engineering College home">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-sidebar-border bg-sidebar-accent font-display text-sm font-bold text-primary">AEC</span>
          <span className="min-w-0"><span className="block font-display text-lg font-semibold leading-tight">Arunai Engineering</span><span className="mt-1 block text-base text-sidebar-foreground/70">College kiosk</span></span>
        </Link>
        <p className="mb-3 px-4 text-base font-semibold text-sidebar-foreground/60">Explore</p>
        <nav aria-label="Main navigation" className="flex flex-col gap-3">
          {sections.map(({ to, label, icon: Icon }) => (
            <Button key={to} asChild variant={pathname === to ? "navActive" : "nav"}>
              <Link to={to} aria-current={pathname === to ? "page" : undefined}>
                <Icon size={22} strokeWidth={1.8} className="!size-[22px]" />
                <span>{label}</span>
                {pathname === to && <span className="ml-auto size-2 rounded-full bg-primary" />}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="mt-auto border-t border-sidebar-border pt-6">
          <p className="px-4 text-base text-sidebar-foreground/70">Velu Nagar, Tiruvannamalai</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border bg-background/90 px-5 backdrop-blur-xl sm:px-8 lg:min-h-24 lg:px-10">
          <Link to="/" className="flex min-w-0 items-center gap-3 font-display text-lg font-semibold text-foreground lg:hidden" aria-label="Arunai Engineering College home">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-card text-sm font-bold text-primary">AEC</span>
            <span className="min-w-0"><span className="block truncate">Arunai Engineering College</span><span className="block text-base font-normal text-muted-foreground">KIOSK</span></span>
          </Link>
          <div className="hidden min-w-0 lg:block"><p className="text-base text-muted-foreground">Arunai Engineering College (Autonomous)</p><p className="truncate font-display text-lg font-semibold">{current.label}</p></div>
          <div className="flex min-h-14 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 text-base font-medium text-muted-foreground sm:px-4">
            <ShieldCheck size={20} className="shrink-0 text-success" aria-hidden="true" /><span>Demo mode</span>
          </div>
        </header>
        <main id="main-content" className="flex w-full flex-1 flex-col pb-24 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-1 sm:gap-2">
          {mobileSections.map(({ to, label, icon: Icon }) => (
            <Button key={to} asChild variant={pathname === to ? "navMobileActive" : "navMobile"} className="min-w-0 flex-1">
              <Link to={to} aria-current={pathname === to ? "page" : undefined}>
                <Icon size={21} strokeWidth={1.8} className="!size-[21px] shrink-0" />
                <span className="max-w-full truncate">{label === "Campus Navigation" ? "Campus" : label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
}