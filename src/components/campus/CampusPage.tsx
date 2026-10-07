import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  ExternalLink,
  Footprints,
  MapPin,
  Navigation,
  QrCode,
  RotateCcw,
  X,
  AlertCircle,
  LocateFixed,
  CheckCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { CampusMap, type ActiveRoute } from "@/components/campus/CampusMap";
import { SiteHeader } from "@/components/site/SiteHeader";
import { KioskKeyboard } from "@/components/KioskKeyboard";
import { Button } from "@/components/ui/button";
import {
  campusLocations,
  categoryColors,
  categoryLabels,
  type CampusLocation,
} from "@/config/campusLocations";
import { campusMap } from "@/config/campusMap";
import { campusNodes, campusEdges } from "@/config/campusGraph";
import { siteContent } from "@/config/siteContent";
import {
  buildGraph,
  describeRoute,
  haversine,
  shortestPath,
  walkingTimeMinutes,
} from "@/lib/campusRouting";

interface QuickChip {
  id: string;
  label: string;
}

const QUICK_CHIPS: QuickChip[] = [
  { id: "arunai-gateway-and-library", label: "Library" },
  { id: "canteen", label: "Canteen" },
  { id: "aids", label: "AI&DS" },
  { id: "boys-hostel", label: "Boys Hostel" },
  { id: "girls-hostel", label: "Girls Hostel" },
  { id: "parking", label: "Parking" },
];

export function CampusPage() {
  const [search, setSearch] = useState("");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(campusLocations[0]?.id ?? null);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Routing State
  const [fromId, setFromId] = useState<string>(campusMap.kioskLocationId);
  const [toId, setToId] = useState<string>("");
  const [activeRoute, setActiveRoute] = useState<ActiveRoute | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Live GPS Tracking State (Step 1)
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [remainingMetres, setRemainingMetres] = useState<number | null>(null);
  const [arrived, setArrived] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Bottom Sheet Picker State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<"from" | "to">("to");
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerKeyboardOpen, setPickerKeyboardOpen] = useState(false);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Node Map for fast lookup
  const nodeMap = useMemo(() => {
    const map = new Map<string, (typeof campusNodes)[0]>();
    campusNodes.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  // Compute Route Function
  const computeRoute = useCallback(
    (startPlaceId: string, endPlaceId: string) => {
      setRouteError(null);
      setArrived(false);

      if (!startPlaceId || !endPlaceId) {
        setRouteError("Please select both a starting point and destination.");
        setActiveRoute(null);
        return;
      }

      if (startPlaceId === endPlaceId) {
        setRouteError("Starting point and destination cannot be the same place.");
        setActiveRoute(null);
        return;
      }

      const fromLoc = campusLocations.find((l) => l.id === startPlaceId);
      const toLoc = campusLocations.find((l) => l.id === endPlaceId);

      // Requirement 4: If a place has no coordinates or node, show "This place is not on the map yet"
      if (!fromLoc || !toLoc || fromLoc.lat == null || toLoc.lat == null || !fromLoc.nodeId || !toLoc.nodeId) {
        setRouteError("This place is not on the map yet");
        setActiveRoute(null);
        return;
      }

      const graph = buildGraph(campusNodes, campusEdges);
      const result = shortestPath(graph, fromLoc.nodeId, toLoc.nodeId);

      // Requirement 4: If no path exists, show "No walking route found". Never draw a straight line instead.
      if (!result) {
        setRouteError("No walking route found");
        setActiveRoute(null);
        return;
      }

      const coordinates: Array<{ lat: number; lng: number }> = [];
      for (const nodeId of result.path) {
        const node = nodeMap.get(nodeId);
        if (node) {
          coordinates.push({ lat: node.lat, lng: node.lng });
        }
      }

      const steps = describeRoute(result.path, campusNodes, campusLocations);
      const walkingTime = walkingTimeMinutes(result.distance);

      const route: ActiveRoute = {
        path: result.path,
        coordinates,
        distance: result.distance,
        walkingTime,
        steps,
        fromPlaceName: fromLoc.id === "main-gate" ? "Main Gate (You are here)" : fromLoc.name,
        toPlaceName: toLoc.name,
        fromId: startPlaceId,
        toId: endPlaceId,
      };

      setActiveRoute(route);
      setSelectedId(endPlaceId);
    },
    [nodeMap],
  );

  // Start Live GPS tracking on device (Step 1)
  const startLiveTracking = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setTrackingError("Geolocation is not supported by your mobile browser.");
      return;
    }

    setTrackingError(null);
    setIsLiveTracking(true);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);

        // Calculate live distance to destination if destination has coordinates
        const destLoc = campusLocations.find((l) => l.id === toId);
        if (destLoc && destLoc.lat != null && destLoc.lng != null) {
          const dist = haversine(coords.lat, coords.lng, destLoc.lat, destLoc.lng);
          setRemainingMetres(Math.round(dist));

          // If within 15 metres, mark arrived
          if (dist <= 15) {
            setArrived(true);
          }
        }
      },
      (err) => {
        console.warn("GPS watch position error:", err);
        setTrackingError(
          err.code === 1
            ? "Location permission denied. Please allow location access on your phone."
            : "Unable to retrieve GPS signal. Try moving to an open area.",
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      },
    );
  }, [toId]);

  // Stop Live GPS tracking
  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveTracking(false);
    setUserLocation(null);
    setRemainingMetres(null);
    setArrived(false);
  }, []);

  // Step 2: Open in Google Maps App
  const handleOpenGoogleMaps = useCallback(() => {
    const fromLoc = campusLocations.find((l) => l.id === fromId);
    const toLoc = campusLocations.find((l) => l.id === toId);

    if (!toLoc || toLoc.lat == null || toLoc.lng == null) {
      return;
    }

    const originParam =
      fromLoc?.lat != null && fromLoc?.lng != null
        ? `${fromLoc.lat},${fromLoc.lng}`
        : "Arunai+Engineering+College+Tiruvannamalai";

    const destParam = `${toLoc.lat},${toLoc.lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=walking`;

    window.open(url, "_blank", "noopener,noreferrer");
  }, [fromId, toId]);

  // Clear Route
  const handleClearRoute = useCallback(() => {
    setActiveRoute(null);
    setRouteError(null);
    setToId("");
    stopLiveTracking();
  }, [stopLiveTracking]);

  // Swap From and To
  const handleSwap = useCallback(() => {
    const nextFrom = toId || campusMap.kioskLocationId;
    const nextTo = fromId;
    setFromId(nextFrom);
    setToId(nextTo);

    if (activeRoute) {
      computeRoute(nextFrom, nextTo);
    }
  }, [fromId, toId, activeRoute, computeRoute]);

  // Quick Chips Selection
  const handleQuickChipSelect = useCallback(
    (chipId: string) => {
      setFromId(campusMap.kioskLocationId);
      setToId(chipId);
      computeRoute(campusMap.kioskLocationId, chipId);
    },
    [computeRoute],
  );

  // Directions Here from Place Card
  const handleDirectionsHere = useCallback(
    (location: CampusLocation) => {
      setFromId(campusMap.kioskLocationId);
      setToId(location.id);
      computeRoute(campusMap.kioskLocationId, location.id);
    },
    [computeRoute],
  );

  // Check URL Query params (?from=<id>&to=<id>&live=1)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const urlFrom = params.get("from");
    const urlTo = params.get("to");
    const isLive = params.get("live") === "1";

    if (urlFrom && urlTo) {
      setFromId(urlFrom);
      setToId(urlTo);
      computeRoute(urlFrom, urlTo);

      if (isLive) {
        startLiveTracking();
      }
    }
  }, [computeRoute, startLiveTracking]);

  // Cleanup GPS watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Idle timer for Kiosk: Clear route and selection after 60 seconds without touch
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const resetIdleTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // If live tracking on phone, avoid resetting
        if (isLiveTracking) return;

        setSelectedId(null);
        setSearch("");
        setKeyboardOpen(false);
        setActiveRoute(null);
        setRouteError(null);
        setPickerOpen(false);
        setPickerKeyboardOpen(false);
        setQrModalOpen(false);
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
  }, [isLiveTracking]);

  // Filtered Locations for Main List
  const filteredLocations = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (!normalizedSearch) return campusLocations;
    return campusLocations.filter((location) =>
      `${location.name} ${location.category} ${location.description}`
        .toLocaleLowerCase()
        .includes(normalizedSearch),
    );
  }, [search]);

  // Filtered Locations for Bottom Sheet Picker
  const pickerLocations = useMemo(() => {
    const normalized = pickerSearch.trim().toLocaleLowerCase();
    if (!normalized) return campusLocations;
    return campusLocations.filter((loc) =>
      `${loc.name} ${loc.category}`.toLocaleLowerCase().includes(normalized),
    );
  }, [pickerSearch]);

  const handleSelectLocation = (location: CampusLocation) => {
    setSelectedId(location.id);
  };

  const handleCloseSelected = () => {
    setSelectedId(null);
  };

  // Open Bottom Sheet Picker
  const handleOpenPicker = (target: "from" | "to") => {
    setPickerTarget(target);
    setPickerSearch("");
    setPickerKeyboardOpen(false);
    setPickerOpen(true);
  };

  // Select item in Bottom Sheet
  const handlePickerSelect = (locId: string) => {
    if (pickerTarget === "from") {
      setFromId(locId);
      if (toId && toId !== locId) {
        computeRoute(locId, toId);
      }
    } else {
      setToId(locId);
      if (fromId && fromId !== locId) {
        computeRoute(fromId, locId);
      }
    }
    setPickerOpen(false);
  };

  const fromLocation = campusLocations.find((l) => l.id === fromId);
  const toLocation = campusLocations.find((l) => l.id === toId);

  // QR Code URL points to /campus with live=1 for live mobile navigation (Step 1)
  const qrShareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/campus?from=${fromId}&to=${toId}&live=1`
      : "";

  return (
    <div className="campus-page">
      <SiteHeader campus />
      <main className="campus-page-inner">
        <h1 className="campus-page-title">{siteContent.campusPage.title}</h1>
        <div className="campus-explorer">
          <section className="campus-location-panel" aria-label="Campus navigation and locations">
            {/* Directions Box (Requirement 2) */}
            <div className="campus-directions-card">
              <div className="campus-directions-fields">
                {/* From Field */}
                <div className="campus-direction-field-wrapper">
                  <button
                    type="button"
                    className="campus-route-field"
                    onClick={() => handleOpenPicker("from")}
                    aria-label={`Starting location: ${fromId === "main-gate" ? "You are here (Main Gate)" : fromLocation?.name || "Select start"}`}
                  >
                    <Navigation className="campus-route-field-icon" strokeWidth={2} />
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        From
                      </span>
                      <strong className="text-sm font-semibold truncate max-w-[220px]">
                        {fromId === "main-gate"
                          ? "You are here (Main Gate)"
                          : fromLocation?.name || "Select starting point"}
                      </strong>
                    </div>
                  </button>

                  {/* Swap Button */}
                  <button
                    type="button"
                    className="campus-swap-btn"
                    onClick={handleSwap}
                    aria-label="Swap starting location and destination"
                    title="Swap locations"
                  >
                    <ArrowDownUp className="size-5" strokeWidth={1.5} />
                  </button>
                </div>

                {/* To Field */}
                <button
                  type="button"
                  className={`campus-route-field ${!toId ? "is-empty" : ""}`}
                  onClick={() => handleOpenPicker("to")}
                  aria-label={`Destination: ${toLocation?.name || "Where do you want to go?"}`}
                >
                  <MapPin className="campus-route-field-icon text-accent" strokeWidth={2} />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      To
                    </span>
                    <strong className="text-sm font-semibold truncate max-w-[260px]">
                      {toLocation?.name || "Where do you want to go?"}
                    </strong>
                  </div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="campus-directions-actions">
                <Button
                  type="button"
                  onClick={() => computeRoute(fromId, toId)}
                  disabled={!toId}
                  className="min-h-14 flex-1 rounded-lg bg-accent text-white text-base font-semibold"
                >
                  Show route
                </Button>
                {activeRoute && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearRoute}
                    className="min-h-14 rounded-lg px-4 border-border text-foreground"
                    title="Clear route"
                  >
                    <RotateCcw className="size-5" />
                  </Button>
                )}
              </div>

              {/* Quick Destination Chips */}
              <div className="campus-quick-chips-section">
                <span className="campus-quick-chips-title">Quick destinations</span>
                <div className="campus-quick-chips" role="toolbar" aria-label="Quick destinations">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      className="campus-quick-chip"
                      onClick={() => handleQuickChipSelect(chip.id)}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Banner (Requirement 4) */}
            {routeError && (
              <div className="campus-route-error-banner" role="alert">
                <AlertCircle className="size-5 flex-shrink-0" />
                <span>{routeError}</span>
              </div>
            )}

            {/* Live GPS Tracking Error */}
            {trackingError && (
              <div className="campus-route-error-banner" role="alert">
                <AlertCircle className="size-5 flex-shrink-0" />
                <span>{trackingError}</span>
              </div>
            )}

            {/* Arrival Banner (Step 1) */}
            {arrived && activeRoute && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 8,
                  backgroundColor: "#DCFCE7",
                  border: "1px solid #86EFAC",
                  color: "#166534",
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
                role="status"
              >
                <CheckCircle className="size-5 text-green-600 flex-shrink-0" />
                <span>You have arrived at {activeRoute.toPlaceName}!</span>
              </div>
            )}

            {/* Route Summary Card (Requirement 3 + Step 1 & Step 2) */}
            {activeRoute && (
              <article className="campus-route-summary" aria-label="Walking directions summary">
                <div className="campus-route-summary-header">
                  <div className="campus-route-stats">
                    <span className="campus-route-distance">
                      {remainingMetres !== null ? `${remainingMetres} m remaining` : `${Math.round(activeRoute.distance)} m`}
                    </span>
                    <span className="campus-route-time">
                      <Footprints className="size-4 inline mr-1" />
                      {activeRoute.walkingTime} min walk
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQrModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-border bg-surface hover:bg-surface-2 text-foreground"
                      title="Send to phone with QR code"
                    >
                      <QrCode className="size-4" />
                      <span>Send to phone</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearRoute}
                      className="p-2 text-muted-foreground hover:text-foreground"
                      title="Clear route"
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                </div>

                {/* Step 1 & Step 2 Action Controls */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {/* Step 1: Live GPS Toggle */}
                  <button
                    type="button"
                    onClick={isLiveTracking ? stopLiveTracking : startLiveTracking}
                    className="campus-gmaps-btn"
                    style={{
                      backgroundColor: isLiveTracking ? "#DBEAFE" : undefined,
                      borderColor: isLiveTracking ? "#3B82F6" : undefined,
                      color: isLiveTracking ? "#1E40AF" : undefined,
                    }}
                    title="Track live position on campus using phone GPS"
                  >
                    <LocateFixed className="size-4 text-blue-600" />
                    <span>{isLiveTracking ? "Live GPS Active" : "Start Live GPS"}</span>
                    {isLiveTracking && <span className="campus-live-indicator-dot" />}
                  </button>

                  {/* Step 2: Open in Google Maps App */}
                  <button
                    type="button"
                    onClick={handleOpenGoogleMaps}
                    className="campus-gmaps-btn"
                    title="Open walking directions in Google Maps app"
                  >
                    <ExternalLink className="size-4 text-muted-foreground" />
                    <span>Open in Google Maps</span>
                  </button>
                </div>

                {/* Step-by-step list (scrollable, large text) */}
                <div className="campus-step-list-wrapper">
                  {activeRoute.steps.map((step, index) => {
                    const isArrival = index === activeRoute.steps.length - 1;
                    return (
                      <div
                        key={index}
                        className={`campus-step-item ${isArrival ? "is-arrival" : ""}`}
                      >
                        <span className="campus-step-num">
                          {isArrival ? "✓" : index + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    );
                  })}
                </div>
              </article>
            )}

            {/* Search Box */}
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
                    <span className="text-sm font-semibold text-muted-foreground">
                      Search campus
                    </span>
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
            activeRoute={activeRoute}
            userLocation={userLocation}
            onDirectionsHere={handleDirectionsHere}
            resetTrigger={resetTrigger}
            fromId={fromId}
            toId={toId}
          />
        </div>
      </main>

      {/* Bottom Sheet Place Picker (Requirement 2) */}
      {pickerOpen && (
        <div className="campus-bottom-sheet-backdrop" onClick={() => setPickerOpen(false)}>
          <div
            className="campus-bottom-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={pickerTarget === "from" ? "Select starting point" : "Select destination"}
          >
            <div className="campus-bottom-sheet-header">
              <h3 className="campus-bottom-sheet-title">
                {pickerTarget === "from" ? "Select Starting Point" : "Select Destination"}
              </h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground"
                aria-label="Close picker"
              >
                <X className="size-6" />
              </button>
            </div>

            <div className="campus-bottom-sheet-content">
              {/* Search in picker */}
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  inputMode="none"
                  value={pickerSearch}
                  placeholder="Tap to search places..."
                  onClick={() => setPickerKeyboardOpen((prev) => !prev)}
                  className="min-h-14 w-full rounded-xl border border-input bg-background px-4 text-left text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  aria-label="Filter places"
                />
                {pickerSearch && (
                  <button
                    type="button"
                    onClick={() => setPickerSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear picker search"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>

              {pickerKeyboardOpen && (
                <div className="rounded-2xl border border-border bg-card p-3 shadow-lg">
                  <KioskKeyboard
                    layout="full"
                    onCharacter={(char) => setPickerSearch((prev) => prev + char)}
                    onBackspace={() => setPickerSearch((prev) => prev.slice(0, -1))}
                    onClear={() => setPickerSearch("")}
                    onSpace={() => setPickerSearch((prev) => prev + " ")}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setPickerKeyboardOpen(false)}
                      className="min-h-12 rounded-lg bg-primary px-6 text-base font-semibold text-primary-foreground"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}

              {/* Default You are here option for From */}
              {pickerTarget === "from" && (
                <button
                  type="button"
                  className={`campus-location-item ${fromId === "main-gate" ? "is-selected" : ""}`}
                  onClick={() => handlePickerSelect("main-gate")}
                >
                  <div className="campus-location-item-header">
                    <strong>You are here (Main Gate)</strong>
                    <span
                      className="campus-category-badge"
                      style={{
                        borderColor: categoryColors["gate"],
                        color: categoryColors["gate"],
                      }}
                    >
                      Current Location
                    </span>
                  </div>
                </button>
              )}

              {/* List of places */}
              <div className="campus-location-list">
                {pickerLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    className={`campus-location-item ${(pickerTarget === "from" ? fromId : toId) === loc.id ? "is-selected" : ""}`}
                    onClick={() => handlePickerSelect(loc.id)}
                  >
                    <div className="campus-location-item-header">
                      <strong>{loc.name}</strong>
                      <span
                        className="campus-category-badge"
                        style={{
                          borderColor: categoryColors[loc.category],
                          color: categoryColors[loc.category],
                        }}
                      >
                        {categoryLabels[loc.category]}
                      </span>
                    </div>
                    {loc.lat === null || loc.lng === null ? (
                      <span className="campus-no-coords-badge">Not on the map yet</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal (Requirement 5 & Step 1) */}
      {qrModalOpen && (
        <div className="campus-qr-backdrop" onClick={() => setQrModalOpen(false)}>
          <div
            className="campus-qr-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Send directions to phone"
          >
            <h3 className="campus-qr-title">Send to phone</h3>
            <p className="campus-qr-desc">
              Scan this QR code with your mobile camera to open interactive live GPS directions on
              your phone.
            </p>

            <div className="campus-qr-box">
              <QRCodeSVG
                value={qrShareUrl}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#1B0B10"
                level="M"
              />
            </div>

            <Button
              type="button"
              onClick={() => setQrModalOpen(false)}
              className="min-h-14 w-full rounded-xl bg-accent text-white font-semibold text-lg"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
