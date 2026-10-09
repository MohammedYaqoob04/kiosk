import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  Building2,
  Calendar,
  Compass,
  ExternalLink,
  GraduationCap,
  Landmark,
  MapPin,
  School,
  Sparkles,
  UsersRound,
} from "lucide-react";

import {
  collegeInfo,
  institutionalHighlights,
  officialSourceAttribution,
} from "@/config/siteContent";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About | ${collegeInfo.shortInstitutionName}` },
      {
        name: "description",
        content: `Official institutional profile, vision, mission, and highlights of ${collegeInfo.institutionName}.`,
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 flex flex-col gap-10">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-2 text-accent border border-border mb-3">
              <School className="size-3.5" />
              <span>{collegeInfo.tagline}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              About Arunai Engineering College
            </h1>
            <p className="mt-2 text-base sm:text-lg text-muted-foreground max-w-3xl">
              A premier autonomous, co-educational engineering institution in Velu Nagar, Tiruvannamalai, dedicated to technical brilliance and character building since 1993.
            </p>
          </div>
          <a
            href={officialSourceAttribution.url}
            target="_blank"
            rel="noreferrer"
            className="site-source-attribution self-start"
          >
            <ExternalLink className="size-3.5" />
            <span>{officialSourceAttribution.text}</span>
          </a>
        </div>
      </div>

      {/* College Profile & Institutional Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
          <div className="flex items-center gap-3 text-accent">
            <Building2 className="size-6" />
            <h2 className="font-display text-2xl font-bold text-foreground">
              Institutional Profile
            </h2>
          </div>
          <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
            {collegeInfo.profile}
          </p>
          <div className="border-t border-border pt-4">
            <h3 className="font-display text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <MapPin className="size-4 text-accent" />
              Campus Overview
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              {collegeInfo.campusOverview}
            </p>
          </div>
        </div>

        {/* Regulatory & Accreditation Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 flex flex-col gap-4 shadow-xs">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Award className="size-5 text-accent" />
            Institutional Governance
          </h2>
          <div className="divide-y divide-border text-sm">
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold text-foreground">Autonomous</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted-foreground">Affiliation</span>
              <span className="font-semibold text-foreground">{collegeInfo.affiliation}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted-foreground">AICTE Approval</span>
              <span className="font-semibold text-foreground">{collegeInfo.approval}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted-foreground">Accreditation</span>
              <span className="font-semibold text-foreground">{collegeInfo.accreditation}</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted-foreground">Counselling Code</span>
              <span className="font-mono font-bold text-accent px-2 py-0.5 rounded bg-surface-2 border border-border">
                {collegeInfo.counsellingCode}
              </span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="text-muted-foreground">Nature</span>
              <span className="font-semibold text-foreground">{collegeInfo.nature}</span>
            </div>
          </div>

          <div className="mt-auto pt-4">
            <Link
              to="/campus"
              className="inline-flex items-center justify-center gap-2 w-full min-h-12 px-4 rounded-xl bg-surface-2 border border-border font-semibold text-sm text-foreground hover:border-accent transition-colors"
            >
              <Compass className="size-4 text-accent" />
              <span>Explore Interactive Campus Map</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-3 text-accent font-bold text-lg">
            <Sparkles className="size-5" />
            <span>Our Vision</span>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground italic leading-relaxed">
            "{collegeInfo.vision}"
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-3 text-accent font-bold text-lg">
            <Award className="size-5" />
            <span>Our Mission</span>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground italic leading-relaxed">
            "{collegeInfo.mission}"
          </p>
        </div>
      </section>

      {/* Key Numerical Highlights */}
      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6">
          Institutional Highlights at a Glance
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {institutionalHighlights.map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl bg-surface-2 border border-border text-center flex flex-col justify-center"
            >
              <span className="font-display text-2xl sm:text-3xl font-bold text-accent">
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm font-medium text-foreground mt-1">
                {stat.label}
              </span>
              {stat.description && (
                <span className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  {stat.description}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
