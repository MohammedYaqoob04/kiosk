import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Minus, Plus, RotateCcw, X } from "lucide-react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { campusMap } from "@/config/campusMap";
import {
  type CampusCategory,
  type CampusLocation,
  categoryColors,
  categoryLabels,
} from "@/config/campusLocations";
import { siteContent } from "@/config/siteContent";

export interface CampusMapProps {
  locations: CampusLocation[];
  selectedId: string | null;
  onSelect: (location: CampusLocation) => void;
  onClose?: () => void;
  route?: CampusLocation[];
  resetTrigger?: number;
}

const ALL_CATEGORIES: CampusCategory[] = [
  "academic",
  "hostel",
  "food",
  "sports",
  "landmark",
  "gate",
];

export function CampusMap({
  locations,
  selectedId,
  onSelect,
  onClose,
  route,
  resetTrigger = 0,
}: CampusMapProps) {
  // Route prop preserved for future navigation extensions
  void route;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerLibRef = useRef<google.maps.MarkerLibrary | null>(null);
  const markersMapRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<Set<CampusCategory>>(new Set());

  const isKeyConfigured = Boolean(campusMap.apiKey.trim());
  const selectedLocation = locations.find((location) => location.id === selectedId) ?? null;

  // Zoom controls (56px touch hit area)
  const handleZoomIn = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const current = mapInstanceRef.current.getZoom() ?? campusMap.zoom;
    mapInstanceRef.current.setZoom(current + 1);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!mapInstanceRef.current) return;
    const current = mapInstanceRef.current.getZoom() ?? campusMap.zoom;
    mapInstanceRef.current.setZoom(current - 1);
  }, []);

  // Reset view to default center and zoom
  const handleResetView = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({
        lat: campusMap.center[0],
        lng: campusMap.center[1],
      });
      mapInstanceRef.current.setZoom(campusMap.zoom);
    }
    setHiddenCategories(new Set());
  }, []);

  // Sync resetTrigger from parent (e.g. 60s idle timeout)
  useEffect(() => {
    if (resetTrigger > 0) {
      handleResetView();
    }
  }, [resetTrigger, handleResetView]);

  // Toggle category visibility
  const toggleCategory = useCallback((category: CampusCategory) => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Initialize Map client-side only (never touch window or google at module scope)
  useEffect(() => {
    if (!isKeyConfigured || !mapContainerRef.current) return;
    let isCancelled = false;

    async function initGoogleMap() {
      try {
        setOptions({
          key: campusMap.apiKey,
          v: "weekly",
        });

        const [{ Map }, markerLib] = await Promise.all([
          importLibrary("maps") as Promise<google.maps.MapsLibrary>,
          importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
        ]);

        if (isCancelled || !mapContainerRef.current) return;

        const mapOptions: google.maps.MapOptions = {
          center: { lat: campusMap.center[0], lng: campusMap.center[1] },
          zoom: campusMap.zoom,
          minZoom: campusMap.minZoom,
          maxZoom: campusMap.maxZoom,
          mapTypeId: "satellite",
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: "greedy",
          keyboardShortcuts: false,
          mapId: campusMap.mapId || "DEMO_MAP_ID",
          ...(campusMap.bounds
            ? {
                restriction: {
                  latLngBounds: campusMap.bounds,
                  strictBounds: false,
                },
              }
            : {}),
        };

        const map = new Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;
        markerLibRef.current = markerLib;
        setMapLoaded(true);
      } catch (err) {
        console.error("Failed to initialize Google Maps:", err);
        if (!isCancelled) {
          setLoadError(true);
        }
      }
    }

    initGoogleMap();

    return () => {
      isCancelled = true;
      markersMapRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersMapRef.current.clear();
      mapInstanceRef.current = null;
      markerLibRef.current = null;
    };
  }, [isKeyConfigured]);

  // Pan when selected location has coordinates
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation) return;
    if (selectedLocation.lat != null && selectedLocation.lng != null) {
      mapInstanceRef.current.panTo({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      });
    }
  }, [selectedLocation]);

  // Render and update AdvancedMarkerElements
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markerLibRef.current) return;
    const { AdvancedMarkerElement } = markerLibRef.current;
    const map = mapInstanceRef.current;

    const validLocations = locations.filter(
      (loc): loc is CampusLocation & { lat: number; lng: number } =>
        loc.lat != null && loc.lng != null,
    );

    const currentMarkerIds = new Set<string>();

    for (const loc of validLocations) {
      const isVisible = !hiddenCategories.has(loc.category);
      if (!isVisible) {
        const existing = markersMapRef.current.get(loc.id);
        if (existing) {
          existing.map = null;
          markersMapRef.current.delete(loc.id);
        }
        continue;
      }

      currentMarkerIds.add(loc.id);
      const isSelected = loc.id === selectedId;

      // Custom HTML element: exact coordinate anchor at center of the dot, 56px touch hit area
      const hitArea = document.createElement("div");
      hitArea.className = `campus-marker-hit-area ${isSelected ? "is-selected" : ""}`;
      hitArea.style.position = "relative";
      hitArea.style.width = "0";
      hitArea.style.height = "0";
      hitArea.style.cursor = "pointer";
      hitArea.style.userSelect = "none";
      hitArea.setAttribute("role", "button");
      hitArea.setAttribute("aria-label", loc.name);

      // 56px invisible touch hit target centered directly on the coordinate
      const touchTarget = document.createElement("div");
      touchTarget.style.position = "absolute";
      touchTarget.style.top = "-28px";
      touchTarget.style.left = "-28px";
      touchTarget.style.width = "56px";
      touchTarget.style.height = "56px";
      touchTarget.style.borderRadius = "50%";
      touchTarget.style.pointerEvents = "auto";

      // Round dot centered exactly on the coordinate (0, 0)
      const dotSize = isSelected ? 30 : 22;
      const dotRadius = dotSize / 2;
      const dot = document.createElement("div");
      dot.className = `campus-marker-dot ${isSelected ? "is-selected" : ""}`;
      dot.style.position = "absolute";
      dot.style.top = `${-dotRadius}px`;
      dot.style.left = `${-dotRadius}px`;
      dot.style.width = `${dotSize}px`;
      dot.style.height = `${dotSize}px`;
      dot.style.borderRadius = "50%";
      dot.style.backgroundColor = categoryColors[loc.category] || "#8B1E2D";
      dot.style.border = isSelected ? "3px solid #FFFFFF" : "2px solid #FFFFFF";
      dot.style.boxShadow = isSelected
        ? "0 0 0 4px rgba(139, 30, 45, 0.45), 0 4px 12px rgba(0,0,0,0.4)"
        : "0 2px 6px rgba(0,0,0,0.35)";
      dot.style.transition = "transform 0.2s ease, width 0.2s ease, height 0.2s ease";
      dot.style.pointerEvents = "none";

      // 16px label on dark pill placed right below the dot, centered horizontally
      const label = document.createElement("div");
      label.className = `campus-marker-label ${isSelected ? "is-selected" : ""}`;
      label.textContent = loc.name;
      label.style.position = "absolute";
      label.style.top = `${dotRadius + 4}px`;
      label.style.left = "0";
      label.style.transform = "translateX(-50%)";
      label.style.fontSize = "16px";
      label.style.fontWeight = isSelected ? "600" : "500";
      label.style.color = "#FFFFFF";
      label.style.backgroundColor = isSelected
        ? "rgba(27, 11, 16, 0.96)"
        : "rgba(27, 11, 16, 0.85)";
      label.style.padding = "4px 10px";
      label.style.borderRadius = "9999px";
      label.style.whiteSpace = "nowrap";
      label.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
      label.style.border = isSelected
        ? "1.5px solid var(--accent, #8B1E2D)"
        : "1px solid rgba(255,255,255,0.25)";
      label.style.pointerEvents = "auto";
      label.style.maxWidth = "220px";
      label.style.overflow = "hidden";
      label.style.textOverflow = "ellipsis";

      hitArea.appendChild(touchTarget);
      hitArea.appendChild(dot);
      hitArea.appendChild(label);

      hitArea.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect(loc);
      });

      const existingMarker = markersMapRef.current.get(loc.id);
      if (existingMarker) {
        existingMarker.position = { lat: loc.lat, lng: loc.lng };
        existingMarker.content = hitArea;
        existingMarker.zIndex = isSelected ? 100 : 1;
      } else {
        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: loc.lat, lng: loc.lng },
          title: loc.name,
          content: hitArea,
          zIndex: isSelected ? 100 : 1,
        });
        markersMapRef.current.set(loc.id, marker);
      }
    }

    markersMapRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.map = null;
        markersMapRef.current.delete(id);
      }
    });
  }, [mapLoaded, locations, hiddenCategories, selectedId, onSelect]);

  return (
    <section className="campus-map-section" aria-label={siteContent.campusPage.mapTitle}>
      {/* Category legend chips (>= 56px touch hit areas) */}
      <div className="campus-map-legend" role="toolbar" aria-label="Category filters">
        {ALL_CATEGORIES.map((category) => {
          const isHidden = hiddenCategories.has(category);
          return (
            <button
              key={category}
              type="button"
              className={`campus-legend-chip ${isHidden ? "is-hidden" : "is-active"}`}
              onClick={() => toggleCategory(category)}
              aria-pressed={!isHidden}
              aria-label={`Toggle ${categoryLabels[category]} visibility on map`}
            >
              <span
                className="campus-legend-dot"
                style={{ backgroundColor: categoryColors[category] }}
                aria-hidden="true"
              />
              <span>{categoryLabels[category]}</span>
            </button>
          );
        })}
      </div>

      {/* Map display area */}
      <div className="campus-map-container">
        <div ref={mapContainerRef} className="campus-map-canvas" />

        {/* Notice when key is not configured */}
        {!isKeyConfigured && (
          <div className="campus-map-notice" role="alert">
            <AlertCircle className="size-8 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="text-xl font-semibold">Map key not configured</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to <code>.env</code> to load the campus
              satellite map. The location list is fully interactive below.
            </p>
          </div>
        )}

        {/* Notice when map fails to load */}
        {isKeyConfigured && loadError && (
          <div className="campus-map-notice" role="alert">
            <AlertCircle className="size-8 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="text-xl font-semibold">Map unavailable</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Could not connect to Google Maps. Please verify your API key restrictions and internet
              connection.
            </p>
          </div>
        )}

        {/* Big controls (56px touch targets) */}
        {isKeyConfigured && !loadError && (
          <div className="campus-map-controls" role="toolbar" aria-label="Map navigation controls">
            <button
              type="button"
              className="campus-control-btn"
              onClick={handleZoomIn}
              aria-label="Zoom in"
              title="Zoom in"
            >
              <Plus className="size-6" strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="campus-control-btn"
              onClick={handleZoomOut}
              aria-label="Zoom out"
              title="Zoom out"
            >
              <Minus className="size-6" strokeWidth={2} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="campus-control-btn campus-reset-btn"
              onClick={handleResetView}
              aria-label="Reset view"
              title="Reset view"
            >
              <RotateCcw className="size-5" strokeWidth={1.5} aria-hidden="true" />
              <span>Reset view</span>
            </button>
          </div>
        )}
      </div>

      {/* Selected-place card */}
      {selectedLocation && (
        <article
          className="campus-selected-card"
          aria-label={`Details for ${selectedLocation.name}`}
        >
          <div className="campus-selected-card-header">
            <div>
              <h3 className="campus-selected-card-title">{selectedLocation.name}</h3>
              <div className="campus-selected-badges">
                <span
                  className="campus-category-badge"
                  style={{
                    borderColor: categoryColors[selectedLocation.category],
                    color: categoryColors[selectedLocation.category],
                  }}
                >
                  {categoryLabels[selectedLocation.category]}
                </span>
                {(selectedLocation.lat === null || selectedLocation.lng === null) && (
                  <span className="campus-no-coords-badge">Not on the map yet</span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="campus-card-close-btn"
              onClick={() => onClose?.()}
              aria-label="Close location details"
              title="Close"
            >
              <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <p className="campus-selected-desc">
            {selectedLocation.description === "-- add from college"
              ? "Official location information will be updated soon."
              : selectedLocation.description}
          </p>

          <div className="campus-selected-actions">
            <button
              type="button"
              disabled
              className="campus-action-btn campus-btn-primary"
              aria-label="Directions here (disabled until routing exists)"
              title="Routing feature coming soon"
            >
              {siteContent.campusPage.directionsLabel}
            </button>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="campus-action-btn campus-btn-secondary"
              aria-label="Close"
            >
              Close
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
