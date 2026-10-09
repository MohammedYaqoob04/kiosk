import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays,
  ExternalLink,
  Megaphone,
  Search,
} from "lucide-react";

import {
  collegeInfo,
  officialNotices,
  officialSourceAttribution,
  type OfficialNotice,
} from "@/config/siteContent";

export const Route = createFileRoute("/notices")({
  head: () => ({
    meta: [
      { title: `Notices & Circulars | ${collegeInfo.shortInstitutionName}` },
      {
        name: "description",
        content: `Official college announcements, examination schedules, academic circulars, and events from ${collegeInfo.institutionName}.`,
      },
    ],
  }),
  component: NoticesPage,
});

function NoticesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    "All",
    "Examinations",
    "Collaborations",
    "Events",
    "FDP & Workshops",
  ];

  // Notices are pre-sorted latest first in siteContent.ts
  const filtered = useMemo(() => {
    return officialNotices.filter((n) => {
      const matchCat =
        selectedCategory === "All" || n.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === "" ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.sourceRef && n.sourceRef.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-2 text-accent border border-border mb-3">
              <Megaphone className="size-3.5" />
              <span>Official Institutional Circulars</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              Notices & Announcements
            </h1>
            <p className="mt-2 text-base sm:text-lg text-muted-foreground max-w-3xl">
              Verified circulars, examination notifications, academic partnerships, and event announcements from Arunai Engineering College.
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Notice categories">
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

        {/* Touch Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search circulars & topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-12 pl-10 pr-4 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-hidden focus:border-accent"
          />
        </div>
      </div>

      {/* Notices List */}
      {filtered.length > 0 ? (
        <div className="flex flex-col gap-4">
          {filtered.map((notice) => (
            <div
              key={notice.id}
              className="flex flex-col sm:flex-row sm:items-start gap-5 p-6 rounded-2xl border border-border bg-surface shadow-xs hover:border-accent transition-all"
            >
              {/* Date Column */}
              <div className="flex sm:flex-col items-center justify-center min-w-[110px] p-3 rounded-xl bg-surface-2 border border-border text-center">
                <span className="text-xs uppercase font-bold text-accent">
                  {new Intl.DateTimeFormat("en", { month: "short" }).format(
                    new Date(notice.date),
                  )}
                </span>
                <span className="text-2xl font-bold font-mono text-foreground">
                  {new Intl.DateTimeFormat("en", { day: "2-digit" }).format(
                    new Date(notice.date),
                  )}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Intl.DateTimeFormat("en", { year: "numeric" }).format(
                    new Date(notice.date),
                  )}
                </span>
              </div>

              {/* Copy Column */}
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                    {notice.category}
                  </span>
                  {notice.sourceRef && (
                    <span className="text-xs text-muted-foreground font-medium">
                      • {notice.sourceRef}
                    </span>
                  )}
                </div>

                <h2 className="font-display text-xl font-bold text-foreground">
                  {notice.title}
                </h2>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {notice.description}
                </p>

                {notice.officialUrl && (
                  <div className="pt-2">
                    <a
                      href={notice.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline"
                    >
                      <span>View Official Circular Notice</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border bg-surface text-center">
          <CalendarDays className="size-10 text-muted-foreground opacity-50 mb-3" />
          <h3 className="font-display text-lg font-bold text-foreground">No Notices Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            There are no active notices matching your selected category or search query.
          </p>
        </div>
      )}
    </div>
  );
}
