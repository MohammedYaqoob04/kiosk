import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  BusFront,
  Dumbbell,
  ExternalLink,
  House,
  Landmark,
  Microscope,
  Sparkles,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  collegeInfo,
  officialFacilities,
  officialSourceAttribution,
  type OfficialFacility,
} from "@/config/siteContent";

export const Route = createFileRoute("/facilities")({
  head: () => ({
    meta: [
      { title: `Facilities | ${collegeInfo.shortInstitutionName}` },
      {
        name: "description",
        content: `Comprehensive academic, computing, residential, and sports facilities at ${collegeInfo.institutionName}.`,
      },
    ],
  }),
  component: FacilitiesPage,
});

const facilityIcons: Record<string, LucideIcon> = {
  "Academic & Research": BookOpen,
  "Computing & Labs": Wifi,
  "Student Life & Hostels": House,
  "Campus Amenities": Landmark,
};

function FacilitiesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [primaryOnly, setPrimaryOnly] = useState<boolean>(false);

  const categories = [
    "All",
    "Academic & Research",
    "Computing & Labs",
    "Student Life & Hostels",
    "Campus Amenities",
  ];

  const filtered = useMemo(() => {
    return officialFacilities.filter((f) => {
      const matchCat = selectedCategory === "All" || f.category === selectedCategory;
      const matchPrimary = !primaryOnly || f.isPrimary;
      return matchCat && matchPrimary;
    });
  }, [selectedCategory, primaryOnly]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-2 text-accent border border-border mb-3">
              <Sparkles className="size-3.5" />
              <span>25,000+ sq. m Green Campus</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              Campus Facilities & Infrastructure
            </h1>
            <p className="mt-2 text-base sm:text-lg text-muted-foreground max-w-3xl">
              Equipped with smart classrooms, research laboratories, high-speed Wi-Fi, separate residential hostels, and expansive athletic grounds.
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

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Facility categories">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-12 px-5 rounded-full text-sm font-semibold border transition-all ${
                selectedCategory === cat
                  ? "bg-accent text-on-accent border-accent shadow-xs"
                  : "bg-surface text-foreground border-border hover:border-accent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPrimaryOnly((prev) => !prev)}
          className={`min-h-12 px-5 rounded-xl text-sm font-semibold border transition-all flex items-center gap-2 ${
            primaryOnly
              ? "bg-accent/15 text-accent border-accent"
              : "bg-surface text-muted-foreground border-border hover:border-accent"
          }`}
        >
          <span>Primary Facilities</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2">
            {primaryOnly ? "Active" : "All"}
          </span>
        </button>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((facility) => {
          const Icon = facilityIcons[facility.category] ?? Building2;
          return (
            <div
              key={facility.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-xs hover:border-accent hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="p-3 rounded-xl bg-surface-2 text-accent border border-border">
                    <Icon className="size-6" strokeWidth={1.5} />
                  </div>
                  {facility.isPrimary && (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                      Primary
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                  {facility.category}
                </span>
                <h2 className="font-display text-lg font-bold text-foreground mt-1 mb-2">
                  {facility.name}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {facility.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Arunai Campus</span>
                <span className="text-accent font-medium">Available</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
