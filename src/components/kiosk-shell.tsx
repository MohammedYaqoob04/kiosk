import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  ContactRound,
  GraduationCap,
  House,
  MapPinned,
  Megaphone,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const sections = [
  { to: "/", label: "Home", icon: House },
  { to: "/about", label: "About", icon: GraduationCap },
  { to: "/departments", label: "Departments", icon: BookOpen },
  { to: "/facilities", label: "Facilities", icon: Building2 },
  { to: "/campus-navigation", label: "Campus Navigation", icon: MapPinned },
  { to: "/notices", label: "Notices", icon: Megaphone },
  { to: "/contact", label: "Contact", icon: ContactRound },
] as const;

const logins = [
  { to: "/login/student", label: "Student Login", icon: UserRound },
  { to: "/login/staff", label: "Staff Login", icon: UsersRound },
  { to: "/login/hod", label: "HOD Login", icon: GraduationCap },
] as const;

export function KioskShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <Sheet>
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-20 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-8">
            <Link
              to="/"
              className="flex min-w-0 items-center gap-3 text-foreground"
              aria-label="Arunai Engineering College home"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-card font-display text-sm font-bold text-primary sm:size-14">
                AEC
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base font-bold tracking-wide sm:text-lg">
                  ARUNAI <span className="text-primary">/</span>
                </span>
                <span className="block truncate text-xs font-medium tracking-[0.12em] text-muted-foreground sm:text-sm">
                  ENGINEERING COLLEGE (AUTONOMOUS)
                </span>
              </span>
            </Link>

            <SheetTrigger asChild>
              <Button variant="kioskGlass" className="min-h-14 min-w-24 px-5 text-base">
                Menu
              </Button>
            </SheetTrigger>
          </div>
        </header>

        <SheetContent
          side="right"
          className="flex h-dvh w-screen max-w-none flex-col gap-0 overflow-y-auto border-0 bg-background px-5 py-6 sm:max-w-none sm:px-10 sm:py-8"
        >
          <SheetHeader className="mb-8 border-b border-border pb-6 pr-12 text-left">
            <SheetTitle className="font-display text-2xl font-bold tracking-wide text-foreground">
              ARUNAI
            </SheetTitle>
            <SheetDescription className="text-base text-muted-foreground">
              Engineering College (Autonomous)
            </SheetDescription>
          </SheetHeader>

          <nav aria-label="Main navigation" className="mx-auto flex w-full max-w-2xl flex-col gap-2">
            {sections.map(({ to, label, icon: Icon }) => (
              <SheetClose asChild key={to}>
                <Button
                  variant={pathname === to ? "navActive" : "nav"}
                  className="min-h-14 rounded-xl text-base"
                  asChild
                >
                  <a href={to} aria-current={pathname === to ? "page" : undefined}>
                    <Icon size={22} strokeWidth={1.8} className="!size-[22px]" />
                    <span>{label}</span>
                  </a>
                </Button>
              </SheetClose>
            ))}
          </nav>

          <div className="mx-auto mt-8 w-full max-w-2xl border-t border-border pt-6">
            <p className="mb-3 px-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Portal access
            </p>
            <nav aria-label="Portal logins" className="flex flex-col gap-2">
              {logins.map(({ to, label, icon: Icon }) => (
                <SheetClose asChild key={to}>
                  <Button
                    asChild
                    variant="kioskGlass"
                    className="min-h-14 w-full justify-start rounded-xl px-4 text-base"
                  >
                    <a href={to}>
                      <Icon size={22} strokeWidth={1.8} className="!size-[22px]" />
                      <span>{label}</span>
                    </a>
                  </Button>
                </SheetClose>
              ))}
            </nav>
          </div>

          <div className="mx-auto mt-auto w-full max-w-2xl pt-8">
            <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-4 text-base font-medium text-muted-foreground">
              <ShieldCheck size={20} className="shrink-0 text-success" aria-hidden="true" />
              <span>Demo mode</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <main id="main-content" className="flex w-full flex-col">
        <Outlet />
      </main>
    </div>
  );
}
