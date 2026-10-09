import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, GraduationCap, School, Search } from "lucide-react";

import {
  collegeInfo,
  officialDepartments,
  officialSourceAttribution,
  type OfficialDepartment,
} from "@/config/siteContent";

export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: `Departments | ${collegeInfo.shortInstitutionName}` },
      {
        name: "description",
        content: `Explore the 13 official undergraduate and postgraduate engineering and management departments at ${collegeInfo.institutionName}.`,
      },
    ],
  }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = ["All", "Computing & AI", "Core Engineering", "Specialized Engineering", "Management"];

  const filtered = useMemo(() => {
    return officialDepartments.filter((dept) => {
      const matchesCategory =
        selectedCategory === "All" || dept.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.degree.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 flex flex-col gap-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-2 text-accent border border-border mb-3">
              <School className="size-3.5" />
              <span>13+ Academic Disciplines</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
              Academic Departments
            </h1>
            <p className="mt-2 text-base sm:text-lg text-muted-foreground max-w-3xl">
              Arunai Engineering College offers autonomous, industry-aligned curricula designed to foster analytical thinking, professional competence, and technical mastery.
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
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Department categories">
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
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-12 pl-10 pr-4 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-hidden focus:border-accent"
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((dept) => (
            <div
              key={dept.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-xs hover:border-accent hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-surface-2 text-accent border border-border">
                    {dept.code}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {dept.category}
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold text-foreground mb-1 leading-snug">
                  {dept.name}
                </h2>
                <div className="text-xs font-semibold text-accent mb-3 flex items-center gap-1.5">
                  <GraduationCap className="size-3.5" />
                  <span>{dept.degree}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                  {dept.description}
                </p>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <a
                  href={dept.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 min-h-11 px-4 rounded-lg bg-surface-2 border border-border text-xs font-semibold text-accent hover:bg-accent hover:text-on-accent transition-colors"
                >
                  <span>View Details</span>
                  <ExternalLink className="size-3.5" />
                </a>
                <span className="text-xs text-muted-foreground">Autonomous Curriculum</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-border bg-surface text-center">
          <School className="size-10 text-muted-foreground opacity-50 mb-3" />
          <h3 className="font-display text-lg font-bold text-foreground">No Departments Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your search query or selecting a different category filter.
          </p>
        </div>
      )}
    </div>
  );
}
