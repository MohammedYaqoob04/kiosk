import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  formatDistance,
  KIOSK_START_NAME,
  type Point,
} from "@/config/campusMap";
import {
  type CampusCategory,
  type CampusLocation,
  categoryColors,
  categoryLabels,
} from "@/config/campusLocations";
import { routeBetween } from "@/lib/campusRouting";
import { siteContent } from "@/config/siteContent";
import { useCampusMap } from "@/lib/useCampusMap";
import { CampusMapStage } from "@/components/campus/CampusMapStage";

export interface CampusMapProps {
  locations?: CampusLocation[];
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
  locations: propLocations,
  selectedId,
  onSelect,
  onClose,
  route: parentRoute,
  resetTrigger = 0,
}: CampusMapProps) {
  void parentRoute;

  // Single source of truth for campus map data and version-stamped image
  const { mapData, versionedImageSrc, version } = useCampusMap();
  const W = mapData.width;
  const H = mapData.height;

  // Prioritize live mapData locations
  const locations = useMemo(
    () => (mapData.locations && mapData.locations.length > 0 ? mapData.locations : propLocations ?? []),
    [mapData.locations, propLocations],
  );

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

  // Compute base scale to fit the stage exactly into the navigation frame
  const baseScale = useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) return 1;
    return Math.min((viewportSize.width - 24) / W, (viewportSize.height - 24) / H);
  }, [viewportSize, W, H]);

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
      const ro = new ResizeObserver(updateFit);
      ro.observe(el);
      return () => ro.disconnect();
    }
    return undefined;
  }, [W, H]);

  const centerOnLocation = useCallback(
    (loc: CampusLocation, targetZoom = 1.65) => {
      const el = viewportRef.current;
      if (!el) return;
      const vw = el.clientWidth;
      const vh = el.clientHeight;
      if (vw <= 0 || vh <= 0) return;

      const base = Math.min((vw - 24) / W, (vh - 24) / H);
      const targetZoomLevel = Math.max(1.0, Math.min(3.0, targetZoom));
      const scale = base * targetZoomLevel;

      const targetPanX = vw / 2 - loc.x * scale;
      const targetPanY = vh / 2 - loc.y * scale;

      setUserZoom(targetZoomLevel);
      setPan({ x: targetPanX, y: targetPanY });
    },
    [W, H],
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

      const res = routeBetween(startId, endId, mapData.junctions, mapData.edges, locations);
      setRoutePoints(res.points);

      const fromName = locations.find((l) => l.id === startId)?.name ?? startId;
      const toName = locations.find((l) => l.id === endId)?.name ?? endId;
      setInfo(`${fromName} → ${toName} · ${formatDistance(res.totalLength)}`);
    },
    [fromId, toId, mapData.junctions, mapData.edges, locations],
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
  }, [defaultFromId, defaultToId, W, H]);

  useEffect(() => {
    if (resetTrigger > 0) {
      handleResetView();
    }
  }, [resetTrigger, handleResetView]);

  // Touch & Pointer pan handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with left click or touch
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    setIsPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;

    if (Math.hypot(dx, dy) > 5) {
      hasMovedRef.current = true;
    }

    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPanning(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Zoom buttons (+ and -)
  const handleZoomIn = () => {
    setUserZoom((prev) => Math.min(3.0, prev + 0.35));
  };

  const handleZoomOut = () => {
    setUserZoom((prev) => Math.max(1.0, prev - 0.35));
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setUserZoom((prev) => Math.min(3.0, Math.max(1.0, prev * zoomFactor)));
  };

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
              width: `${W}px`,
              height: `${H}px`,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${currentScale})`,
              transformOrigin: "0 0",
              transition: isPanning ? "none" : "transform 0.35s cubic-bezier(0.2, 0, 0, 1)",
            }}
          >
            {/* ONE shared component: CampusMapStage */}
            <CampusMapStage
              mapData={mapData}
              versionedImageSrc={versionedImageSrc}
              version={version}
              selectedId={selectedId}
              onSelectLocation={(loc) => {
                if (hasMovedRef.current) return;
                onSelect(loc);
                centerOnLocation(loc, 1.65);
              }}
              routePoints={routePoints}
              hiddenCategories={hiddenCategories}
              showPins={true}
              showNodes={false}
              showEdges={false}
              showRing={false}
              showLabels={true}
            />
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
            <ZoomIn className="size-5" />
          </button>
          <button
            type="button"
            className="campus-control-btn"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="size-5" />
          </button>
          <button
            type="button"
            className="campus-control-btn"
            onClick={handleResetView}
            aria-label="Reset view"
            title="Reset view"
          >
            <RotateCcw className="size-5" />
          </button>
        </div>

        {/* Selected location details drawer or banner */}
        {selectedLocation && (
          <div className="campus-selected-popup" role="dialog" aria-label="Selected place info">
            <div className="campus-selected-popup-header">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{
                    backgroundColor: categoryColors[selectedLocation.category] || "var(--accent)",
                  }}
                  aria-hidden="true"
                />
                <h3 className="font-semibold text-foreground text-sm sm:text-base">
                  {selectedLocation.name}
                </h3>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close place details"
                  className="rounded-lg p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            {selectedLocation.description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedLocation.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 text-xs font-semibold text-white shadow-xs hover:bg-accent-hover cursor-pointer"
                onClick={() => handleShowRoute(KIOSK_START_NAME, selectedLocation.id)}
              >
                Directions from Main Gate
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground hover:bg-surface-2 cursor-pointer"
                onClick={() => handleShowRoute(selectedLocation.id, "l11")}
              >
                Directions to AI&amp;DS
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info card at bottom */}
      <div className="campus-map-info-card" role="status" aria-live="polite">
        <p className="text-sm font-medium text-foreground">{info}</p>
        {routePoints.length > 0 && (
          <button
            type="button"
            onClick={handleClearRoute}
            className="text-xs text-accent hover:underline font-semibold"
          >
            Clear route
          </button>
        )}
      </div>
    </section>
  );
}
