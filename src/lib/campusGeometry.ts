/**
 * Pure geometry helpers for Campus Map coordinate conversions and validation.
 * All coordinates represent exact pixels of the underlying image file.
 */

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Rounds a coordinate to at most 1 decimal place.
 */
export function roundCoordinate(val: number): number {
  return Math.round(val * 10) / 10;
}

/**
 * Converts a pointer event (mouse, touch, or pointer) to exact SVG map pixel coordinates
 * using ONLY the overlay SVG's getScreenCTM().inverse().
 * Never uses container rect or percentage math.
 */
export function pointerToMapCoordinates(
  event:
    | MouseEvent
    | TouchEvent
    | PointerEvent
    | React.PointerEvent
    | { clientX: number; clientY: number },
  svgElement: SVGSVGElement,
): Point2D {
  let clientX = 0;
  let clientY = 0;

  if ("touches" in event && event.touches && event.touches.length > 0) {
    clientX = event.touches[0]!.clientX;
    clientY = event.touches[0]!.clientY;
  } else if ("clientX" in event && "clientY" in event) {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  // Create an SVGPoint using the SVG DOM interface
  let pt: DOMPoint | SVGPoint;
  if (typeof DOMPoint !== "undefined") {
    pt = new DOMPoint(clientX, clientY);
  } else {
    pt = svgElement.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
  }

  const ctm = svgElement.getScreenCTM();
  if (!ctm) {
    return { x: 0, y: 0 };
  }

  const inverseCTM = ctm.inverse();
  const transformed = pt.matrixTransform(inverseCTM);

  return {
    x: roundCoordinate(transformed.x),
    y: roundCoordinate(transformed.y),
  };
}

/**
 * Converts image pixel coordinates to percentage of image dimensions.
 */
export function imageToPercent(
  x: number,
  y: number,
  width: number,
  height: number,
): { xPercent: number; yPercent: number } {
  if (width <= 0 || height <= 0) return { xPercent: 0, yPercent: 0 };
  return {
    xPercent: (x / width) * 100,
    yPercent: (y / height) * 100,
  };
}

/**
 * Converts percentage coordinates back to image pixel coordinates.
 */
export function percentToImage(
  xPercent: number,
  yPercent: number,
  width: number,
  height: number,
): Point2D {
  return {
    x: roundCoordinate((xPercent * width) / 100),
    y: roundCoordinate((yPercent * height) / 100),
  };
}

/**
 * Attaches to nearest node helper.
 */
export function findNearestNode(
  point: Point2D,
  nodes: Record<string, [number, number]>,
): { nodeId: string; distance: number; point: [number, number] } | null {
  const entries = Object.entries(nodes);
  if (entries.length === 0) return null;

  let nearestId = "";
  let minDistance = Number.POSITIVE_INFINITY;
  let nearestPoint: [number, number] = [0, 0];

  for (const [id, pt] of entries) {
    const dist = Math.hypot(pt[0] - point.x, pt[1] - point.y);
    if (dist < minDistance) {
      minDistance = dist;
      nearestId = id;
      nearestPoint = pt;
    }
  }

  if (!nearestId) return null;

  return {
    nodeId: nearestId,
    distance: roundCoordinate(minDistance),
    point: nearestPoint,
  };
}

/**
 * Validates a campus map data object.
 */
export function validateCampusMap(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;

  if (typeof d["width"] !== "number" || d["width"] <= 0) return false;
  if (typeof d["height"] !== "number" || d["height"] <= 0) return false;
  if (typeof d["image"] !== "string" || d["image"].trim().length === 0) return false;
  if (!Array.isArray(d["locations"])) return false;
  if (typeof d["junctions"] !== "object" || d["junctions"] === null) return false;
  if (!Array.isArray(d["edges"])) return false;

  for (const loc of d["locations"] as unknown[]) {
    if (!loc || typeof loc !== "object") return false;
    const l = loc as Record<string, unknown>;
    if (typeof l["id"] !== "string" || !l["id"]) return false;
    if (typeof l["name"] !== "string" || !l["name"]) return false;
    if (typeof l["x"] !== "number" || Number.isNaN(l["x"])) return false;
    if (typeof l["y"] !== "number" || Number.isNaN(l["y"])) return false;
  }

  for (const pt of Object.values(d["junctions"] as Record<string, unknown>)) {
    if (!Array.isArray(pt) || pt.length !== 2) return false;
    if (typeof pt[0] !== "number" || typeof pt[1] !== "number") return false;
  }

  for (const edge of d["edges"] as unknown[]) {
    if (!Array.isArray(edge) || edge.length !== 2) return false;
    if (typeof edge[0] !== "string" || typeof edge[1] !== "string") return false;
  }

  return true;
}
