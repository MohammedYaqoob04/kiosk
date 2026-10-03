import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu as MenuIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const erpRoles = [
  { role: "student", label: "Student Login" },
  { role: "staff", label: "Staff Login" },
  { role: "hod", label: "HOD Login" },
] as const;

function Brand() {
  return (
    <Link
      to="/"
      reloadDocument
      className="flex min-w-0 items-center gap-3 text-foreground"
      aria-label="Home"
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-lg border border-border bg-card font-display text-base font-bold text-primary">
        AEC
      </span>
      <span className="min-w-0">
        <span className="block font-display text-base font-bold tracking-wide sm:text-xl">
          ARUNAI <span className="text-muted-foreground">/</span>
        </span>
        <span className="block truncate text-[10px] font-semibold tracking-[0.1em] text-muted-foreground sm:text-sm">
          ENGINEERING COLLEGE (AUTONOMOUS)
        </span>
      </span>
      <span className="ml-1 shrink-0 rounded-full border border-primary/50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary sm:px-3 sm:text-sm">
        Kiosk
      </span>
    </Link>
  );
}

function RoleLinks({ closeOnSelect = false }: { closeOnSelect?: boolean }) {
  return (
    <>
      {erpRoles.map(({ role, label }) => {
        const link = (
          <Link
            to="/erp/login"
            search={{ role }}
            activeProps={{ className: "bg-accent text-foreground" }}
            className="flex min-h-14 items-center rounded-md px-4 text-lg text-muted-foreground active:bg-muted"
          >
            {label}
          </Link>
        );

        return closeOnSelect ? (
          <SheetClose asChild key={role}>
            {link}
          </SheetClose>
        ) : (
          <DropdownMenuItem key={role} asChild className="min-h-14 p-0 text-lg">
            {link}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

export function SiteHeader() {
  const onErpRoute = useRouterState({
    select: (state) => state.location.pathname.startsWith("/erp/"),
  });

  return (
    <Sheet>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95">
        <div className="mx-auto flex min-h-20 max-w-screen-2xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-8">
          <Brand />

          <nav aria-label="Main navigation" className="hidden items-center gap-3 xl:flex">
            <Link
              to="/"
              reloadDocument
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-foreground after:scale-x-100" }}
              className="relative inline-flex min-h-14 items-center px-4 font-display text-lg font-semibold uppercase tracking-[0.12em] text-muted-foreground after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary"
            >
              Home
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`relative min-h-14 gap-2 px-4 font-display text-lg font-semibold uppercase tracking-[0.12em] after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary ${
                    onErpRoute ? "text-foreground after:scale-x-100" : ""
                  }`}
                >
                  ERP <ChevronDown aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <RoleLinks />
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              to="/coe"
              activeProps={{ className: "text-foreground after:scale-x-100" }}
              className="relative inline-flex min-h-14 items-center px-4 font-display text-lg font-semibold uppercase tracking-[0.12em] text-muted-foreground after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary"
            >
              COE
            </Link>
          </nav>

          <SheetTrigger asChild>
            <Button variant="outline" className="min-h-14 min-w-24 gap-2 px-5 text-lg xl:hidden">
              <MenuIcon aria-hidden="true" />
              Menu
            </Button>
          </SheetTrigger>
        </div>
      </header>

      <SheetContent
        side="right"
        className="flex h-dvh w-screen max-w-none flex-col gap-0 overflow-y-auto border-0 bg-background px-5 py-6 sm:max-w-none sm:px-8"
      >
        <div className="mb-6 flex items-center border-b border-border pb-5 pr-12">
          <Brand />
          <SheetTitle className="sr-only">Site navigation</SheetTitle>
        </div>
        <nav aria-label="Mobile main navigation" className="flex flex-col gap-1">
          <SheetClose asChild>
            <Link
              to="/"
              reloadDocument
              activeOptions={{ exact: true }}
              activeProps={{ className: "border-primary bg-card text-foreground" }}
              className="flex min-h-14 items-center border-l-2 border-transparent px-4 font-display text-lg font-semibold uppercase tracking-[0.12em] text-muted-foreground active:bg-muted"
            >
              Home
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link
              to="/erp/login"
              search={{ role: "student" }}
              className="flex min-h-14 items-center border-l-2 border-transparent px-4 font-display text-lg font-semibold uppercase tracking-[0.12em] text-muted-foreground active:bg-muted"
            >
              ERP
            </Link>
          </SheetClose>
          <p className="flex min-h-14 items-center border-l-2 border-transparent px-4 font-display text-lg font-semibold uppercase tracking-[0.12em] text-foreground">
            ERP
          </p>
          <div className="mb-2 ml-4 border-l border-border pl-3">
            <RoleLinks closeOnSelect />
          </div>
          <SheetClose asChild>
            <Link
              to="/coe"
              activeProps={{ className: "border-primary bg-card text-foreground" }}
              className="flex min-h-14 items-center border-l-2 border-transparent px-4 font-display text-lg font-semibold uppercase tracking-[0.12em] text-muted-foreground active:bg-muted"
            >
              COE
            </Link>
          </SheetClose>
        </nav>

        <div className="mt-auto border-t border-border pt-6">
          <div className="flex min-h-14 items-center gap-3 rounded-lg border border-border bg-card px-4 text-lg text-muted-foreground">
            <ShieldCheck className="size-5 shrink-0 text-icon" aria-hidden="true" />
            <span>Demo mode</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border bg-background/85">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-lg text-muted-foreground">Velu Nagar, Tiruvannamalai</p>
        <p className="text-base text-muted-foreground">
          © {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export function KioskShell() {
  return (
    <div className="site-shell relative isolate min-h-screen">
      <div aria-hidden="true" className="ambient-background">
        <span className="ambient-blob ambient-blob-one" />
        <span className="ambient-blob ambient-blob-two" />
        <span className="ambient-blob ambient-blob-three" />
      </div>
      <div className="relative z-10">
        <SiteHeader />
        <main id="main-content" className="flex min-h-[60vh] w-full flex-col">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
