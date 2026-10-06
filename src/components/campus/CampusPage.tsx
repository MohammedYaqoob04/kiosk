import { useEffect, useMemo, useState } from "react";

import { CampusMap } from "@/components/campus/CampusMap";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TouchTextInput } from "@/components/TouchTextInput";
import {
  CAMPUS_UPDATE_EVENT,
  getActiveCampusLocations,
  categoryColors,
  categoryLabels,
  type CampusLocation,
} from "@/config/campusLocations";
import { siteContent } from "@/config/siteContent";

export function CampusPage() {
  const [locations, setLocations] = useState<CampusLocation[]>(() => getActiveCampusLocations());
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => getActiveCampusLocations()[0]?.id ?? null);
  const [resetTrigger, setResetTrigger] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setLocations(getActiveCampusLocations());
    };
    window.addEventListener(CAMPUS_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(CAMPUS_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Requirement 8: After 60 seconds without touch, clear the selection and reset the view.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const resetIdleTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSelectedId(null);
        setSearch("");
        setResetTrigger((prev) => prev + 1);
      }, 60000);
    };

    const activityEvents = ["touchstart", "pointerdown", "mousedown", "click", "keydown"];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetIdleTimer, { passive: true }));

    resetIdleTimer();

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetIdleTimer));
    };
  }, []);

  const filteredLocations = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (!normalizedSearch) return locations;
    return locations.filter((location) =>
      `${location.name} ${location.category} ${location.description ?? ""}`
        .toLocaleLowerCase()
        .includes(normalizedSearch),
    );
  }, [search, locations]);

  const handleSelectLocation = (location: CampusLocation) => {
    setSelectedId(location.id);
  };

  const handleCloseSelected = () => {
    setSelectedId(null);
  };

  return (
    <div className="campus-page">
      <SiteHeader campus />
      <main className="campus-page-inner">
        <h1 className="campus-page-title">{siteContent.campusPage.title}</h1>
        <div className="campus-explorer">
          <section className="campus-location-panel" aria-label="Campus locations search and list">
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
                    onClick={() => handleSelectLocation(location)}
                  >
                    <div className="campus-location-item-header">
                      <strong>{location.name}</strong>
                      <span
                        className="campus-category-badge"
                        style={{
                          borderColor: categoryColors[location.category],
                          color: categoryColors[location.category],
                        }}
                      >
                        {categoryLabels[location.category]}
                      </span>
                    </div>

                    {location.lat === null || location.lng === null ? (
                      <span className="campus-no-coords-badge">Not on the map yet</span>
                    ) : null}

                    {location.description !== "-- add from college" ? (
                      <span className="campus-location-desc">{location.description}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className="campus-location-empty">{siteContent.campusPage.noResults}</p>
            )}
          </section>

          <CampusMap
            locations={locations}
            selectedId={selectedId}
            onSelect={handleSelectLocation}
            onClose={handleCloseSelected}
            resetTrigger={resetTrigger}
          />
        </div>
      </main>
    </div>
  );
}
