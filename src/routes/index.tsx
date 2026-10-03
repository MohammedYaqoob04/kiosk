import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/hero.jpeg"; // local file in src/assets
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Facebook,
  GraduationCap,
  Instagram,
  MapPinned,
  Megaphone,
  Phone,
  UserRound,
  UsersRound,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

// Placeholder links: replace with the college's real pages
const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/", Icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/", Icon: Instagram },
  { label: "YouTube", href: "https://www.youtube.com/", Icon: Youtube },
];

const logins = [
  { href: "/login/student", label: "Student Login", Icon: UserRound },
  { href: "/login/staff", label: "Staff Login", Icon: UsersRound },
  { href: "/login/hod", label: "HOD Login", Icon: GraduationCap },
];

const destinations = [
  { to: "/about", label: "About", icon: GraduationCap },
  { to: "/departments", label: "Departments", icon: BookOpen },
  { to: "/facilities", label: "Facilities", icon: Building2 },
  { to: "/campus-navigation", label: "Campus Navigation", icon: MapPinned },
  { to: "/contact", label: "Contact", icon: Phone },
  { to: "/notices", label: "Notices", icon: Megaphone },
];

function Index() {
  const [imgFailed, setImgFailed] = useState(false); // true if hero image can't load

  return (
    <div className="w-full">
      {/* ---------- HERO ---------- */}
      <section className="relative isolate flex min-h-[60vh] w-full items-center justify-center overflow-hidden bg-background">
        {imgFailed ? (
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#0f1a24] via-[#0A0D12] to-[#161433]" />
        ) : (
          <img
            src={heroImg}
            alt=""
            aria-hidden="true"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 -z-20 size-full object-cover object-center"
          />
        )}

        {/* gradient so the photo blends into the dark page */}
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/25 to-[#0A0D12]"
          aria-hidden="true"
        />

        {/* title: the college name appears here once */}
        <div className="px-6 py-20 text-center">
          <p className="mb-4 text-lg font-semibold uppercase tracking-widest text-primary">
            Welcome to your campus
          </p>
          <h1
            className="font-display text-6xl font-bold text-white sm:text-7xl lg:text-8xl"
            style={{ textShadow: "0 0 40px rgba(46,230,197,0.35)" }}
          >
            ARUNAI
          </h1>
          <p className="mt-5 text-xl text-white/85 sm:text-2xl">
            Engineering College (Autonomous)
          </p>
          <p className="mt-2 flex items-center justify-center gap-2 text-lg text-white/70">
            <MapPinned className="size-5 text-primary" aria-hidden="true" />
            Velu Nagar, Tiruvannamalai
          </p>
        </div>

        {/* social rail: inside the hero, always visible, 56px targets */}
        <div className="absolute right-0 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3"></div>
      </section>
    </div>
  );
}