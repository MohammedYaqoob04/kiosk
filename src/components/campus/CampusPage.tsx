import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { CampusMap } from "@/components/campus/CampusMap";
import { SiteHeader } from "@/components/site/SiteHeader";
import { KioskKeyboard } from "@/components/KioskKeyboard";
import { Button } from "@/components/ui/button";
import {
  campusLocations,
  categoryColors,
  categoryLabels,
  type CampusLocation,
} from "@/config/campusLocations";
import { siteContent } from "@/config/siteContent";

export function CampusPage() {
  const [search, setSearch] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(campusLocations[0]?.id ?? null);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Requirement 8: After 60 seconds without touch, clear the selection and reset the view.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const resetIdleTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSelectedId(null);
        setSearch("");
        setKeyboardOpen(false);
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
    if (!normalizedSearch) return campusLocations;
    return campusLocations.filter((location) =>
      `${location.name} ${location.category} ${location.description}`
        .toLocaleLowerCase()
        .includes(normalizedSearch),
    );
  }, [search]);

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
              <label className="block text-sm font-semibold text-foreground mb-2">
                {siteContent.campusPage.searchLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={search}
                  placeholder="Tap to search"
                  onClick={() => setKeyboardOpen((prev) => !prev)}
                  className="min-h-14 w-full rounded-xl border border-input bg-background px-4 text-left text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  aria-label={siteContent.campusPage.searchLabel}
                  aria-expanded={keyboardOpen}
                />
                {search && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearch("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>

              {keyboardOpen && (
                <div
                  className="mt-3 rounded-2xl border border-border bg-card p-3 shadow-lg"
                  aria-label="On-screen keyboard"
                >
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-sm font-semibold text-muted-foreground">Search campus</span>
                    <button
                      type="button"
                      onClick={() => setKeyboardOpen(false)}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      Close
                    </button>
                  </div>

                  <KioskKeyboard
                    layout="full"
                    onCharacter={(char) => setSearch((prev) => prev + char)}
                    onBackspace={() => setSearch((prev) => prev.slice(0, -1))}
                    onClear={() => setSearch("")}
                    onSpace={() => setSearch((prev) => prev + " ")}
                  />

                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setKeyboardOpen(false)}
                      className="min-h-14 rounded-lg bg-primary px-6 text-lg font-semibold text-primary-foreground"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
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
            locations={campusLocations}
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
