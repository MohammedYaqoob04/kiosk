import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Crosshair, Minus, Plus, RotateCcw, X } from "lucide-react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { campusMap } from "@/config/campusMap";
import {
  type CampusCategory,
  type CampusLocation,
  categoryColors,
  categoryLabels,
} from "@/config/campusLocations";
import { siteContent } from "@/config/siteContent";

export interface ActiveRoute {
  path: string[];
  coordinates: Array<{ lat: number; lng: number }>;
  distance: number;
  walkingTime: number;
  steps: string[];
  fromPlaceName: string;
  toPlaceName: string;
  fromId: string;
  toId: string;
}

export interface CampusMapProps {
  locations: CampusLocation[];
  selectedId: string | null;
  onSelect: (location: CampusLocation) => void;
  onClose?: () => void;
  activeRoute?: ActiveRoute | null;
  userLocation?: { lat: number; lng: number } | null;
  onDirectionsHere?: (location: CampusLocation) => void;
  route?: CampusLocation[];
  resetTrigger?: number;
  fromId?: string;
  toId?: string;
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
  activeRoute,
  userLocation,
  onDirectionsHere,
  route,
  resetTrigger = 0,
  fromId,
  toId,
}: CampusMapProps) {
  // Backwards compatibility for route prop
  void route;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerLibRef = useRef<google.maps.MarkerLibrary | null>(null);
  const markersMapRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  // Route drawing references
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const routeCasingRef = useRef<google.maps.Polyline | null>(null);
  const startMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const endMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

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

  // Recenter on user's live GPS position
  const handleRecenterUser = useCallback(() => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.panTo(userLocation);
      mapInstanceRef.current.setZoom(19);
    }
  }, [userLocation]);

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
      routeCasingRef.current?.setMap(null);
      routePolylineRef.current?.setMap(null);
      if (startMarkerRef.current) startMarkerRef.current.map = null;
      if (endMarkerRef.current) endMarkerRef.current.map = null;
      if (userMarkerRef.current) userMarkerRef.current.map = null;
      mapInstanceRef.current = null;
      markerLibRef.current = null;
    };
  }, [isKeyConfigured]);

  // Pan when selected location has coordinates (if no active route taking precedence)
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedLocation || activeRoute) return;
    if (selectedLocation.lat != null && selectedLocation.lng != null) {
      mapInstanceRef.current.panTo({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      });
    }
  }, [selectedLocation, activeRoute]);

  // Draw active route on map as a vibrant blue line like Google Maps with dark navy casing
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markerLibRef.current) return;
    const map = mapInstanceRef.current;
    const { AdvancedMarkerElement } = markerLibRef.current;

    // Clean up previous route polylines and markers
    if (routeCasingRef.current) {
      routeCasingRef.current.setMap(null);
      routeCasingRef.current = null;
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }
    if (startMarkerRef.current) {
      startMarkerRef.current.map = null;
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      endMarkerRef.current.map = null;
      endMarkerRef.current = null;
    }

    if (!activeRoute || activeRoute.coordinates.length < 2) return;

    // 1. High-contrast navy casing line underneath for visibility on satellite imagery
    const casingPolyline = new google.maps.Polyline({
      path: activeRoute.coordinates,
      strokeColor: "#1E3A8A",
      strokeOpacity: 0.9,
      strokeWeight: 8,
      map,
      zIndex: 119,
    });
    routeCasingRef.current = casingPolyline;

    // 2. Vibrant Google Maps navigation blue line
    const routePolyline = new google.maps.Polyline({
      path: activeRoute.coordinates,
      strokeColor: "#2563EB",
      strokeOpacity: 1.0,
      strokeWeight: 6,
      map,
      zIndex: 120,
    });
    routePolylineRef.current = routePolyline;

    // Fit bounds to the route
    const bounds = new google.maps.LatLngBounds();
    activeRoute.coordinates.forEach((pt) => bounds.extend(pt));
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });

    const startCoord = activeRoute.coordinates[0];
    const endCoord = activeRoute.coordinates[activeRoute.coordinates.length - 1];
    if (!startCoord || !endCoord) return;

    // Start marker (green, A)
    const startEl = document.createElement("div");
    startEl.className = "campus-route-pin is-start";
    startEl.style.width = "32px";
    startEl.style.height = "32px";
    startEl.style.borderRadius = "50%";
    startEl.style.backgroundColor = "#15803D";
    startEl.style.border = "3px solid #FFFFFF";
    startEl.style.boxShadow = "0 3px 8px rgba(0,0,0,0.5)";
    startEl.style.display = "flex";
    startEl.style.alignItems = "center";
    startEl.style.justifyContent = "center";
    startEl.style.color = "#FFFFFF";
    startEl.style.fontWeight = "700";
    startEl.style.fontSize = "13px";
    startEl.textContent = "A";
    startEl.setAttribute("aria-label", `Start: ${activeRoute.fromPlaceName}`);

    const startMarker = new AdvancedMarkerElement({
      map,
      position: startCoord,
      content: startEl,
      title: `Start: ${activeRoute.fromPlaceName}`,
      zIndex: 150,
    });
    startMarkerRef.current = startMarker;

    // End marker (red, B)
    const endEl = document.createElement("div");
    endEl.className = "campus-route-pin is-end";
    endEl.style.width = "32px";
    endEl.style.height = "32px";
    endEl.style.borderRadius = "50%";
    endEl.style.backgroundColor = "#B91C1C";
    endEl.style.border = "3px solid #FFFFFF";
    endEl.style.boxShadow = "0 3px 8px rgba(0,0,0,0.5)";
    endEl.style.display = "flex";
    endEl.style.alignItems = "center";
    endEl.style.justifyContent = "center";
    endEl.style.color = "#FFFFFF";
    endEl.style.fontWeight = "700";
    endEl.style.fontSize = "13px";
    endEl.textContent = "B";
    endEl.setAttribute("aria-label", `Destination: ${activeRoute.toPlaceName}`);

    const endMarker = new AdvancedMarkerElement({
      map,
      position: endCoord,
      content: endEl,
      title: `Destination: ${activeRoute.toPlaceName}`,
      zIndex: 150,
    });
    endMarkerRef.current = endMarker;
  }, [mapLoaded, activeRoute]);

  // Render and update live user GPS position (blue dot)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markerLibRef.current) return;
    const map = mapInstanceRef.current;
    const { AdvancedMarkerElement } = markerLibRef.current;

    if (!userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
        userMarkerRef.current = null;
      }
      return;
    }

    const dotContainer = document.createElement("div");
    dotContainer.className = "campus-live-gps-marker";
    dotContainer.style.position = "relative";
    dotContainer.style.width = "40px";
    dotContainer.style.height = "40px";
    dotContainer.style.display = "flex";
    dotContainer.style.alignItems = "center";
    dotContainer.style.justifyContent = "center";
    dotContainer.style.pointerEvents = "none";

    const pulse = document.createElement("div");
    pulse.className = "campus-gps-pulse";

    const blueDot = document.createElement("div");
    blueDot.className = "campus-gps-dot";

    dotContainer.appendChild(pulse);
    dotContainer.appendChild(blueDot);

    if (userMarkerRef.current) {
      userMarkerRef.current.position = userLocation;
    } else {
      const userMarker = new AdvancedMarkerElement({
        map,
        position: userLocation,
        content: dotContainer,
        title: "Your live position",
        zIndex: 200,
      });
      userMarkerRef.current = userMarker;
    }
  }, [mapLoaded, userLocation]);

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

      // When source and destination are chosen, hide all other place labels so the blue path is visible.
      // Only show the label of the selected source and destination.
      const isRouteActive = Boolean(activeRoute || (fromId && toId && fromId !== toId));
      const isSourceOrDest = Boolean(
        isRouteActive &&
          (loc.id === activeRoute?.fromId ||
            loc.id === activeRoute?.toId ||
            loc.id === fromId ||
            loc.id === toId)
      );
      const shouldShowLabel = !isRouteActive || isSourceOrDest;
      const isHighlighted = isSelected || isSourceOrDest;

      if (shouldShowLabel) {
        // 16px label on dark pill placed right below the dot, centered horizontally
        const label = document.createElement("div");
        label.className = `campus-marker-label ${isHighlighted ? "is-selected" : ""}`;
        label.textContent = loc.name;
        label.style.position = "absolute";
        label.style.top = `${dotRadius + 4}px`;
        label.style.left = "0";
        label.style.transform = "translateX(-50%)";
        label.style.fontSize = "16px";
        label.style.fontWeight = isHighlighted ? "600" : "500";
        label.style.color = "#FFFFFF";
        label.style.backgroundColor = isHighlighted
          ? "rgba(27, 11, 16, 0.96)"
          : "rgba(27, 11, 16, 0.85)";
        label.style.padding = "4px 10px";
        label.style.borderRadius = "9999px";
        label.style.whiteSpace = "nowrap";
        label.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
        label.style.border = isHighlighted
          ? "1.5px solid var(--accent, #8B1E2D)"
          : "1px solid rgba(255,255,255,0.25)";
        label.style.pointerEvents = "auto";
        label.style.maxWidth = "220px";
        label.style.overflow = "hidden";
        label.style.textOverflow = "ellipsis";

        hitArea.appendChild(label);
      }

      hitArea.appendChild(touchTarget);
      hitArea.appendChild(dot);

      hitArea.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect(loc);
      });

      const markerZIndex = isSelected ? 120 : isSourceOrDest ? 110 : 1;

      const existingMarker = markersMapRef.current.get(loc.id);
      if (existingMarker) {
        existingMarker.position = { lat: loc.lat, lng: loc.lng };
        existingMarker.content = hitArea;
        existingMarker.zIndex = markerZIndex;
      } else {
        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: loc.lat, lng: loc.lng },
          title: loc.name,
          content: hitArea,
          zIndex: markerZIndex,
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
  }, [mapLoaded, locations, hiddenCategories, selectedId, onSelect, activeRoute, fromId, toId]);

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

            {userLocation && (
              <button
                type="button"
                className="campus-control-btn campus-recenter-user-btn"
                onClick={handleRecenterUser}
                aria-label="Recenter map on my location"
                title="Recenter on me"
              >
                <Crosshair className="size-6 text-blue-600" strokeWidth={2} aria-hidden="true" />
              </button>
            )}
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
              onClick={() => onDirectionsHere?.(selectedLocation)}
              className="campus-action-btn campus-btn-primary"
              aria-label={`Directions to ${selectedLocation.name}`}
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
