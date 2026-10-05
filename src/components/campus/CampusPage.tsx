import { useMemo, useState } from "react";

import { CampusMap } from "@/components/campus/CampusMap";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TouchTextInput } from "@/components/TouchTextInput";
import { campusLocations } from "@/config/campusLocations";
import { SHOW_PLACEHOLDERS } from "@/config/home";
import { siteContent } from "@/config/siteContent";

const isPlaceholder = (value: string) => value.startsWith("-- add from college");

export function CampusPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(campusLocations[0]?.id ?? null);
  const filteredLocations = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return campusLocations.filter((location) =>
      `${location.name} ${location.category} ${location.description}`
        .toLocaleLowerCase()
        .includes(normalizedSearch),
    );
  }, [search]);
  return (
    <div className="campus-page">
      <SiteHeader campus />
      <main className="campus-page-inner">
        <h1 className="campus-page-title">{siteContent.campusPage.title}</h1>
        <div className="campus-explorer">
          <section className="campus-location-panel">
            <div className="campus-search-box">
              <TouchTextInput
                label={siteContent.campusPage.searchLabel}
                value={search}
                onChange={setSearch}
                placeholder="Tap to search"
                layout="full"
              />
            </div>
            <h2>{siteContent.campusPage.listLabel}</h2>
            {filteredLocations.length > 0 ? (
              <div className="campus-location-list">
                {filteredLocations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    className={`campus-location-item ${location.id === selectedId ? "is-selected" : ""}`}
                    aria-pressed={location.id === selectedId}
                    onClick={() => setSelectedId(location.id)}
                  >
                    <strong>{location.name}</strong>
                    {(SHOW_PLACEHOLDERS || !isPlaceholder(location.category)) && (
                      <span>{location.category}</span>
                    )}
                    {(SHOW_PLACEHOLDERS || !isPlaceholder(location.description)) && (
                      <span>{location.description}</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="campus-location-empty">{siteContent.campusPage.noResults}</p>
            )}
          </section>
          <CampusMap
            locations={campusLocations}
            selectedId={selectedId}
            onSelect={(location) => setSelectedId(location.id)}
          />
        </div>
      </main>
    </div>
  );
}
