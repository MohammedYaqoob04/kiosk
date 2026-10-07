import { useMemo, type CSSProperties, type ReactNode, type RefObject } from "react";
import type { Point } from "@/config/campusMap";
import {
  categoryColors,
  type CampusCategory,
  type CampusLocation,
} from "@/config/campusLocations";
import type { CampusMapData } from "@/lib/useCampusMap";

export interface CampusMapStageProps {
  mapData: CampusMapData;
  versionedImageSrc: string;
  version: number | string;
  // Selection
  selectedId?: string | null;
  selectedType?: "place" | "junction";
  onSelectLocation?: (location: CampusLocation) => void;
  onSelectJunction?: (junctionId: string) => void;
  // Feature visibility toggles
  showPins?: boolean;
  showNodes?: boolean;
  showEdges?: boolean;
  showRing?: boolean;
  showLabels?: boolean;
  // Navigation
  routePoints?: Point[];
  hiddenCategories?: Set<CampusCategory>;
  // SVG element ref for coordinate transformations
  svgRef?: RefObject<SVGSVGElement | null>;
  // Interactive events for canvas editor
  onSvgClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
  onSvgPointerDown?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onSvgPointerMove?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onSvgPointerUp?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPinPointerDown?: (type: "place" | "junction", id: string, e: React.PointerEvent) => void;
  onEdgeClick?: (fromId: string, toId: string, e: React.MouseEvent) => void;
  selectedNodeForLink?: string | null;
  selectedLocationForAttach?: string | null;
  // Custom editor SVG children (preview lines, linking line, cursor)
  customOverlayChildren?: ReactNode;
  onImageSizeCheck?: (naturalWidth: number, naturalHeight: number) => void;
  className?: string;
  style?: CSSProperties;
}

export function CampusMapStage({
  mapData,
  versionedImageSrc,
  version,
  selectedId = null,
  selectedType = "place",
  onSelectLocation,
  onSelectJunction,
  showPins = true,
  showNodes = false,
  showEdges = false,
  showRing = false,
  showLabels = false,
  routePoints = [],
  hiddenCategories,
  svgRef,
  onSvgClick,
  onSvgPointerDown,
  onSvgPointerMove,
  onSvgPointerUp,
  onPinPointerDown,
  onEdgeClick,
  selectedNodeForLink,
  selectedLocationForAttach,
  customOverlayChildren,
  onImageSizeCheck,
  className = "",
  style,
}: CampusMapStageProps) {
  const W = mapData.width;
  const H = mapData.height;

  // Convert route points to SVG path `M x y L x y ...`
  const routePathD = useMemo(() => {
    if (!routePoints || routePoints.length < 2) return "";
    return routePoints.reduce(
      (acc, pt, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${pt[0]} ${pt[1]}`,
      "",
    );
  }, [routePoints]);

  return (
    <div
      className={`campus-map-stage-wrapper ${className}`}
      style={{
        position: "relative",
        aspectRatio: `${W} / ${H}`,
        maxWidth: "100%",
        maxHeight: "100%",
        width: "100%",
        height: "100%",
        margin: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        userSelect: "none",
        ...style,
      }}
    >
      {/* Map Image filling wrapper exactly */}
      <img
        src={versionedImageSrc}
        key={version}
        alt="Campus Map"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            if (img.naturalWidth !== W || img.naturalHeight !== H) {
              console.warn(
                `[CampusMapStage] Displayed image natural size (${img.naturalWidth}x${img.naturalHeight}) differs from map config (${W}x${H})!`,
              );
            }
            onImageSizeCheck?.(img.naturalWidth, img.naturalHeight);
          }
        }}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "fill",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      {/* ONE SVG overlay filling wrapper for pins, nodes, edges, ring, route */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
        onPointerDown={onSvgPointerDown}
        onPointerMove={onSvgPointerMove}
        onPointerUp={onSvgPointerUp}
        onClick={onSvgClick}
      >
        {/* Network Edges */}
        {showEdges &&
          mapData.edges.map(([fromId, toId], idx) => {
            const p1 = mapData.junctions[fromId];
            const p2 = mapData.junctions[toId];
            if (!p1 || !p2) return null;
            return (
              <line
                key={`edge-${fromId}-${toId}-${idx}`}
                x1={p1[0]}
                y1={p1[1]}
                x2={p2[0]}
                y2={p2[1]}
                stroke="#6366F1"
                strokeWidth={onEdgeClick ? 4 : 2.5}
                strokeLinecap="round"
                opacity="0.75"
                style={{
                  cursor: onEdgeClick ? "pointer" : "default",
                  pointerEvents: onEdgeClick ? "stroke" : "none",
                }}
                onClick={(e) => {
                  if (onEdgeClick) {
                    e.stopPropagation();
                    onEdgeClick(fromId, toId, e);
                  }
                }}
              />
            );
          })}

        {/* Ring Road */}
        {showRing && mapData.ringCenter && mapData.ringRadius && (
          <circle
            cx={mapData.ringCenter[0]}
            cy={mapData.ringCenter[1]}
            r={mapData.ringRadius}
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.8"
          />
        )}

        {/* Place-to-Junction Node Attached Lines (editor mode) */}
        {showNodes &&
          mapData.locations.map((loc) => {
            if (!loc.nodeId || !mapData.junctions[loc.nodeId]) return null;
            const jPt = mapData.junctions[loc.nodeId]!;
            const isSelected = loc.id === selectedId && selectedType === "place";
            const isAttachStart = selectedLocationForAttach === loc.id;
            return (
              <line
                key={`attach-${loc.id}`}
                x1={loc.x}
                y1={loc.y}
                x2={jPt[0]}
                y2={jPt[1]}
                stroke={isAttachStart ? "#10B981" : isSelected ? "var(--accent, #8B1E2D)" : "#10B981"}
                strokeWidth={isAttachStart ? 3 : isSelected ? 2.5 : 1.5}
                strokeDasharray="4 4"
                opacity={isAttachStart ? 1 : isSelected ? 0.9 : 0.5}
                pointerEvents="none"
              />
            );
          })}

        {/* Active Route Path */}
        {routePathD && (
          <>
            {/* Route glow outline */}
            <path
              d={routePathD}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
            {/* Route primary line */}
            <path
              d={routePathD}
              fill="none"
              stroke="var(--accent, #8B1E2D)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Start and end points */}
            {routePoints[0] && (
              <circle
                cx={routePoints[0][0]}
                cy={routePoints[0][1]}
                r="6"
                fill="#15803D"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            )}
            {routePoints[routePoints.length - 1] && (
              <circle
                cx={routePoints[routePoints.length - 1]![0]}
                cy={routePoints[routePoints.length - 1]![1]}
                r="7"
                fill="var(--accent, #8B1E2D)"
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
            )}
          </>
        )}

        {/* Custom Editor overlays (linking preview line, etc.) */}
        {customOverlayChildren}

        {/* Junction Nodes */}
        {showNodes &&
          Object.entries(mapData.junctions).map(([jId, pt]) => {
            const isSelected = selectedId === jId && selectedType === "junction";
            const isLinkStart = selectedNodeForLink === jId;
            return (
              <g
                key={`junction-${jId}`}
                transform={`translate(${pt[0]}, ${pt[1]})`}
                className="campus-junction-node"
                role="button"
                aria-label={`Junction ${jId}`}
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPinPointerDown?.("junction", jId, e);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectJunction?.(jId);
                }}
              >
                <rect
                  x="-7"
                  y="-7"
                  width="14"
                  height="14"
                  rx="3"
                  fill={isLinkStart ? "#F59E0B" : isSelected ? "#EF4444" : "#4F46E5"}
                  stroke="#FFFFFF"
                  strokeWidth={isLinkStart ? 3 : 2}
                  className="campus-junction-box"
                />
                {showLabels && (
                  <text
                    y="-11"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#1F1416"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    paintOrder="stroke"
                  >
                    {jId}
                  </text>
                )}
              </g>
            );
          })}

        {/* Places Pins */}
        {showPins &&
          mapData.locations.map((loc) => {
            if (hiddenCategories && hiddenCategories.has(loc.category)) {
              return null;
            }
            const isSelected = loc.id === selectedId && selectedType === "place";
            const isAttachStart = selectedLocationForAttach === loc.id;
            const color = categoryColors[loc.category] || "var(--accent, #8B1E2D)";

            return (
              <g
                key={`place-${loc.id}`}
                transform={`translate(${loc.x}, ${loc.y})`}
                className={`campus-marker-wrapper ${isSelected ? "is-selected" : ""} ${isAttachStart ? "is-attach-start" : ""}`}
                data-x={loc.x}
                data-y={loc.y}
                style={
                  {
                    left: `${loc.x}px`,
                    top: `${loc.y}px`,
                    cursor: "pointer",
                  } as CSSProperties
                }
                role="button"
                aria-label={loc.name}
                tabIndex={0}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPinPointerDown?.("place", loc.id, e);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLocation?.(loc);
                }}
              >
                {/* Selection / Attach pulse ring */}
                {(isSelected || isAttachStart) && (
                  <circle
                    r="18"
                    fill={isAttachStart ? "#10B981" : "var(--accent, #8B1E2D)"}
                    opacity="0.3"
                    className="animate-pulse"
                  />
                )}

                {/* Pin shadow */}
                <ellipse cx="0" cy="2" rx="6" ry="3" fill="#000000" opacity="0.3" />

                {/* Main Pin Dot */}
                <circle
                  r={isSelected ? "9" : "7.5"}
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? "2.5" : "2"}
                />

                {/* Center pip */}
                <circle r="2.5" fill="#FFFFFF" />

                {/* Label */}
                {(showLabels || isSelected) && (
                  <text
                    y="-13"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#1F1416"
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                    paintOrder="stroke"
                    style={{ pointerEvents: "none" }}
                  >
                    {loc.name}
                  </text>
                )}
              </g>
            );
          })}
      </svg>
    </div>
  );
}
