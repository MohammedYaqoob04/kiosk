import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  formatDistance,
  getActiveEdges,
  getActiveJunctions,
  H,
  KIOSK_START_NAME,
  type Point,
  W,
} from "@/config/campusMap";
import {
  CAMPUS_UPDATE_EVENT,
  type CampusCategory,
  type CampusLocation,
  categoryColors,
  categoryLabels,
  getActiveBaseMapImage,
} from "@/config/campusLocations";
import { routeBetween } from "@/lib/campusRouting";
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
  "service",
  "sport",
  "landmark",
  "gate",
];

export function CampusMap({
  locations,
  selectedId,
  onSelect,
  onClose,
  route: parentRoute,
  resetTrigger = 0,
}: CampusMapProps) {
  void parentRoute;

  const defaultFromId = useMemo(() => {
    const mainGate = locations.find((l) => l.name === KIOSK_START_NAME);
    return mainGate ? mainGate.id : locations[0]?.id ?? "";
  }, [locations]);

  const defaultToId = useMemo(() => {
    const aids = locations.find((l) => l.name === "AI&DS");
    return aids ? aids.id : locations[1]?.id ?? "";
  }, [locations]);

  const [fromId, setFromId] = useState(defaultFromId);
  const [toId, setToId] = useState(defaultToId);
  const [routePoints, setRoutePoints] = useState<Point[]>([]);
  const [info, setInfo] = useState("Tap a pin or select places to get directions.");
  const [hiddenCategories, setHiddenCategories] = useState<Set<CampusCategory>>(new Set());
  const [mapImage, setMapImage] = useState<string>(() => getActiveBaseMapImage());
  const [junctions, setJunctions] = useState<Record<string, Point>>(() => getActiveJunctions());
  const [edges, setEdges] = useState<[string, string][]>(() => getActiveEdges());

  // Interactive Viewport & Zoom State
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [userZoom, setUserZoom] = useState(1.0);
  const [isPanning, setIsPanning] = useState(false);

  const isDraggingRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const prevSelectedIdRef = useRef<string | null>(selectedId);

  useEffect(() => {
    const handleUpdate = () => {
      setMapImage(getActiveBaseMapImage());
      setJunctions(getActiveJunctions());
      setEdges(getActiveEdges());
    };
    window.addEventListener(CAMPUS_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(CAMPUS_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Compute base scale to fit the 900x810 stage exactly into the navigation frame
  const baseScale = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) return 1;
    return Math.min((viewportSize.width - 24) / W, (viewportSize.height - 24) / H);
  }, [viewportSize]);

  const currentScale = baseScale * userZoom;

  // Viewport resize observer to auto-fit stage
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateFit = () => {
      const vw = el.clientWidth;
      const vh = el.clientHeight;
      if (vw <= 0 || vh <= 0) return;
      setViewportSize({ width: vw, height: vh });

      const base = Math.min((vw - 24) / W, (vh - 24) / H);
      // If at base zoom, center within viewport
      setUserZoom((currZoom) => {
        if (currZoom <= 1.05) {
          setPan({
            x: (vw - W * base) / 2,
            y: (vh - H * base) / 2,
          });
        }
        return currZoom;
      });
    };

    updateFit();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateFit);
      observer.observe(el);
      return () => observer.disconnect();
    }
    return undefined;
  }, []);

  // Smoothly center and slightly zoom into a location
  const centerOnLocation = useCallback(
    (loc: { x: number; y: number }, targetZoomLevel = 1.65) => {
      if (!viewportRef.current) return;
      const { clientWidth: vw, clientHeight: vh } = viewportRef.current;
      if (vw <= 0 || vh <= 0) return;

      const base = Math.min((vw - 24) / W, (vh - 24) / H);
      const newScale = base * targetZoomLevel;
      const targetPanX = vw / 2 - loc.x * newScale;
      const targetPanY = vh / 2 - loc.y * newScale;

      setUserZoom(targetZoomLevel);
      setPan({ x: targetPanX, y: targetPanY });
    },
    [],
  );

  // Sync selection info & center when selected from list
  useEffect(() => {
    if (selectedId) {
      setToId(selectedId);
      const loc = locations.find((l) => l.id === selectedId);
      if (loc) {
        setInfo(`${loc.name} · ${categoryLabels[loc.category]}`);
      }

      // If user selected a location after initial render, move and zoom to it
      if (!isInitialMountRef.current && loc && selectedId !== prevSelectedIdRef.current) {
        centerOnLocation(loc, 1.65);
      }
      prevSelectedIdRef.current = selectedId;
    }
  }, [selectedId, locations, centerOnLocation]);

  useEffect(() => {
    // Initial mount flag clears after first frame
    const timer = setTimeout(() => {
      isInitialMountRef.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === selectedId) ?? null,
    [locations, selectedId],
  );

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

  const handleShowRoute = useCallback(
    (customFrom?: string, customTo?: string) => {
      const startId = customFrom ?? fromId;
      const endId = customTo ?? toId;

      if (!startId || !endId || startId === endId) {
        setRoutePoints([]);
        setInfo("Pick two different places.");
        return;
      }

      const res = routeBetween(startId, endId, junctions, edges, locations);
      setRoutePoints(res.points);

      const fromName = locations.find((l) => l.id === startId)?.name ?? startId;
      const toName = locations.find((l) => l.id === endId)?.name ?? endId;
      setInfo(`${fromName} → ${toName} · ${formatDistance(res.totalLength)}`);
    },
    [fromId, toId, junctions, edges, locations],
  );

  const handleClearRoute = useCallback(() => {
    setRoutePoints([]);
    setInfo("Route cleared.");
  }, []);

  const handleResetView = useCallback(() => {
    setHiddenCategories(new Set());
    setRoutePoints([]);
    setFromId(defaultFromId);
    setToId(defaultToId);
    setInfo("Tap a pin or select places to get directions.");

    if (viewportRef.current) {
      const { clientWidth: vw, clientHeight: vh } = viewportRef.current;
      if (vw > 0 && vh > 0) {
        const base = Math.min((vw - 24) / W, (vh - 24) / H);
        setUserZoom(1.0);
        setPan({
          x: (vw - W * base) / 2,
          y: (vh - H * base) / 2,
        });
      }
    }
  }, [defaultFromId, defaultToId]);

  useEffect(() => {
    if (resetTrigger > 0) {
      handleResetView();
    }
  }, [resetTrigger, handleResetView]);

  const handleRouteToSelected = useCallback(
    (targetId: string) => {
      setToId(targetId);
      handleShowRoute(fromId, targetId);
    },
    [fromId, handleShowRoute],
  );

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (!viewportRef.current) return;
    const { clientWidth: vw, clientHeight: vh } = viewportRef.current;
    if (vw <= 0 || vh <= 0) return;

    const base = Math.min((vw - 24) / W, (vh - 24) / H);
    const nextUserZoom = Math.min(3.5, userZoom + 0.35);
    const nextScale = base * nextUserZoom;

    const mapCenterX = (vw / 2 - pan.x) / currentScale;
    const mapCenterY = (vh / 2 - pan.y) / currentScale;

    const nextPanX = vw / 2 - mapCenterX * nextScale;
    const nextPanY = vh / 2 - mapCenterY * nextScale;

    setUserZoom(nextUserZoom);
    setPan({ x: nextPanX, y: nextPanY });
  }, [userZoom, pan, currentScale]);

  const handleZoomOut = useCallback(() => {
    if (!viewportRef.current) return;
    const { clientWidth: vw, clientHeight: vh } = viewportRef.current;
    if (vw <= 0 || vh <= 0) return;

    const base = Math.min((vw - 24) / W, (vh - 24) / H);
    const nextUserZoom = Math.max(1.0, userZoom - 0.35);

    if (nextUserZoom <= 1.02) {
      setUserZoom(1.0);
      setPan({
        x: (vw - W * base) / 2,
        y: (vh - H * base) / 2,
      });
      return;
    }

    const nextScale = base * nextUserZoom;
    const mapCenterX = (vw / 2 - pan.x) / currentScale;
    const mapCenterY = (vh / 2 - pan.y) / currentScale;

    const nextPanX = vw / 2 - mapCenterX * nextScale;
    const nextPanY = vh / 2 - mapCenterY * nextScale;

    setUserZoom(nextUserZoom);
    setPan({ x: nextPanX, y: nextPanY });
  }, [userZoom, pan, currentScale]);

  // Pointer drag handling for pan
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }
    setIsPanning(true);
  }, [pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    if (Math.hypot(dx, dy) > 4) {
      hasMovedRef.current = true;
    }
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
      setIsPanning(false);
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (!viewportRef.current) return;
    const { clientWidth: vw, clientHeight: vh } = viewportRef.current;
    if (vw <= 0 || vh <= 0) return;

    const base = Math.min((vw - 24) / W, (vh - 24) / H);
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const nextUserZoom = Math.min(3.5, Math.max(1.0, userZoom * zoomFactor));

    if (nextUserZoom <= 1.02) {
      setUserZoom(1.0);
      setPan({
        x: (vw - W * base) / 2,
        y: (vh - H * base) / 2,
      });
      return;
    }

    const rect = viewportRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const mapX = (cursorX - pan.x) / currentScale;
    const mapY = (cursorY - pan.y) / currentScale;

    const nextScale = base * nextUserZoom;
    const nextPanX = cursorX - mapX * nextScale;
    const nextPanY = cursorY - mapY * nextScale;

    setUserZoom(nextUserZoom);
    setPan({ x: nextPanX, y: nextPanY });
  }, [userZoom, pan, currentScale]);

  const handlePlacePinClick = useCallback(
    (loc: CampusLocation, e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasMovedRef.current) return;
      onSelect(loc);
      centerOnLocation(loc, 1.65);
    },
    [onSelect, centerOnLocation],
  );

  const routePointsString = useMemo(
    () => routePoints.map((pt) => `${pt[0]},${pt[1]}`).join(" "),
    [routePoints],
  );

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

      {/* Map display container */}
      <div className="campus-map-container">
        {/* Interactive Viewport (Pannable & Zoomable) */}
        <div
          className={`campus-map-viewport ${isPanning ? "is-panning" : ""}`}
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          <div
            className="campus-map-stage"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${currentScale})`,
              transformOrigin: "0 0",
              transition: isPanning ? "none" : "transform 0.35s cubic-bezier(0.2, 0, 0, 1)",
            }}
          >
            <img
              src={mapImage}
              alt="Arunai Engineering College campus satellite map"
              className="campus-map-image"
              draggable={false}
            />

            {/* Navigation route polyline only - no raw network nodes/edges */}
            <svg
              className="campus-map-route"
              viewBox={`0 0 ${W} ${H}`}
              aria-hidden="true"
            >
              {routePoints.length > 1 && (
                <>
                  <polyline
                    points={routePointsString}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points={routePointsString}
                    fill="none"
                    stroke="var(--accent, #8B1E2D)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="16 10"
                  />
                </>
              )}
            </svg>

            {/* Place Markers placed at exact coordinates as marked in campus-editor */}
            {locations.map((loc) => {
              if (hiddenCategories.has(loc.category)) return null;
              const isSelected = loc.id === selectedId;

              return (
                <div
                  key={loc.id}
                  className={`campus-marker-wrapper ${isSelected ? "is-selected" : ""}`}
                  style={{
                    left: `${loc.x}px`,
                    top: `${loc.y}px`,
                  }}
                >
                  <button
                    type="button"
                    className={`campus-marker-hit-area ${isSelected ? "is-selected" : ""}`}
                    onClick={(e) => handlePlacePinClick(loc, e)}
                    aria-label={loc.name}
                    aria-pressed={isSelected}
                    title={loc.name}
                  >
                    <span
                      className={`campus-marker-dot ${isSelected ? "is-selected" : ""}`}
                      style={{
                        backgroundColor: categoryColors[loc.category] || "var(--accent, #8B1E2D)",
                      }}
                    />
                    <span className={`campus-marker-label ${isSelected ? "is-selected" : ""}`}>
                      {loc.name}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map controls: Zoom In, Zoom Out, Reset view */}
        <div className="campus-map-controls" role="toolbar" aria-label="Map navigation controls">
          <button
            type="button"
            className="campus-control-btn"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="size-5" strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="campus-control-btn"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
            disabled={userZoom <= 1.02}
          >
            <ZoomOut className="size-5" strokeWidth={1.5} aria-hidden="true" />
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
      </div>

      {/* Directions controls card */}
      <section className="campus-directions-card" aria-label="Campus route directions">
        <div className="campus-directions-grid">
          <label className="campus-directions-field">
            <span>From</span>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="campus-directions-select"
              aria-label="Starting location"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </label>

          <label className="campus-directions-field">
            <span>To</span>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="campus-directions-select"
              aria-label="Destination location"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="campus-selected-actions">
          <button
            type="button"
            className="campus-action-btn campus-btn-primary"
            onClick={() => handleShowRoute()}
          >
            Show route
          </button>
          <button
            type="button"
            className="campus-action-btn campus-btn-secondary"
            onClick={handleClearRoute}
          >
            Clear route
          </button>
        </div>

        <p className="campus-directions-info" role="status">
          {info}
        </p>
      </section>

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

          <div className="campus-selected-actions">
            <button
              type="button"
              className="campus-action-btn campus-btn-primary"
              onClick={() => handleRouteToSelected(selectedLocation.id)}
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
