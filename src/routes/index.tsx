import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  GraduationCap,
  MapPinned,
  Megaphone,
  Phone,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import campusPhoto from "@/assets/arunai-campus.png.asset.json";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Arunai Engineering College | KIOSK" },
      { name: "description", content: "The Arunai Engineering College campus kiosk." },
      { property: "og:title", content: "Arunai Engineering College | KIOSK" },
      { property: "og:description", content: "The Arunai Engineering College campus kiosk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const destinations = [
    { to: "/about", label: "About", icon: GraduationCap },
    { to: "/departments", label: "Departments", icon: BookOpen },
    { to: "/facilities", label: "Facilities", icon: Building2 },
    { to: "/campus-navigation", label: "Campus Navigation", icon: MapPinned },
    { to: "/contact", label: "Contact", icon: Phone },
    { to: "/notices", label: "Notices", icon: Megaphone },
  ] as const;

  return (
    <div className="w-full">
      <section className="campus-hero relative isolate flex min-h-[min(760px,calc(100svh-5rem))] items-center overflow-hidden sm:min-h-[min(820px,calc(100svh-6rem))]">
        <img
          className="absolute inset-0 -z-20 size-full object-cover object-center"
          src={campusPhoto.url}
          alt="The Arunai Engineering College campus building and gardens"
        />
        <div className="hero-scrim absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto w-full max-w-[1440px] px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
          <div className="max-w-4xl">
            <div className="mb-8 flex items-center gap-4 sm:mb-10">
              <span className="grid size-[68px] shrink-0 place-items-center rounded-3xl border border-glass-border bg-glass-surface/80 font-display text-lg font-bold text-primary backdrop-blur-xl sm:size-20 sm:text-xl" aria-label="Arunai logo placeholder">
                AEC
              </span>
              <div>
                <p className="text-lg font-semibold text-foreground sm:text-xl">Arunai Engineering College</p>
                <p className="mt-1 text-base text-muted-foreground sm:text-lg">(Autonomous)</p>
              </div>
            </div>

            <p className="mb-4 text-base font-semibold text-primary sm:text-lg">WELCOME TO YOUR CAMPUS</p>
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
              Arunai Engineering College
            </h1>
            <p className="mt-5 flex items-center gap-3 text-lg text-foreground/90 sm:text-xl">
              <MapPinned className="size-6 shrink-0 text-primary" aria-hidden="true" />
              Velu Nagar, Tiruvannamalai
            </p>

            <div className="mt-9 grid max-w-4xl gap-4 sm:mt-12 sm:grid-cols-3">
              <Button type="button" variant="kioskGlass" className="min-h-[72px] justify-between px-5 text-lg sm:px-6">
                <span className="flex items-center gap-3"><UserRound aria-hidden="true" />Student Login</span>
                <ArrowUpRight aria-hidden="true" />
              </Button>
              <Button type="button" variant="kioskGlass" className="min-h-[72px] justify-between px-5 text-lg sm:px-6">
                <span className="flex items-center gap-3"><UsersRound aria-hidden="true" />Staff Login</span>
                <ArrowUpRight aria-hidden="true" />
              </Button>
              <Button type="button" variant="kioskGlass" className="min-h-[72px] justify-between px-5 text-lg sm:px-6">
                <span className="flex items-center gap-3"><GraduationCap aria-hidden="true" />HOD Login</span>
                <ArrowUpRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
        <span className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-primary/80" aria-hidden="true" />
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-5 pb-16 pt-14 sm:px-10 sm:pb-20 sm:pt-20 lg:px-16" aria-labelledby="explore-heading">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 sm:mb-10">
          <div>
            <p className="mb-3 text-base font-semibold text-primary">CAMPUS DIRECTORY</p>
            <h2 id="explore-heading" className="font-display text-4xl font-semibold text-foreground sm:text-5xl">Explore Arunai</h2>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-muted-foreground">Everything you need to find your place around campus.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {destinations.map(({ to, label, icon: Icon }, index) => (
            <Button key={to} asChild variant="kioskTile" className="group min-h-[156px] justify-between px-5 py-5 text-left sm:min-h-[176px] sm:px-7">
              <Link to={to}>
                <span className="flex h-full w-full items-start justify-between gap-4">
                  <span className="flex h-full flex-col items-start justify-between gap-8">
                    <Icon className="size-7 text-primary" strokeWidth={1.8} aria-hidden="true" />
                    <span className="font-display text-xl font-semibold leading-tight sm:text-2xl">{label}</span>
                  </span>
                  <span className="flex h-full flex-col items-end justify-between text-muted-foreground">
                    <span className="text-base font-medium">0{index + 1}</span>
                    <ArrowUpRight className="size-6 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-5 py-7 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 text-base text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-foreground">Arunai Engineering College <span className="text-primary">·</span> KIOSK</span>
          <span>Velu Nagar, Tiruvannamalai</span>
        </div>
      </footer>
    </div>
  );
}
