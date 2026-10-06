import {
  BASE_LOCATIONS,
  getActiveEdges,
  getActiveJunctions,
  H,
  type Point,
  RING_CENTER,
  RING_POINTS,
  RING_RADIUS,
  W,
} from "@/config/campusMap";
import { getActiveCampusLocations, type CampusLocation } from "@/config/campusLocations";

export { W, H };
export type { Point };

export interface RouteResult {
  nodeIds: string[];
  points: Point[];
  totalLength: number;
}

export const distance = (a: Point, b: Point): number => Math.hypot(a[0] - b[0], a[1] - b[1]);

export const LOCATIONS = BASE_LOCATIONS.map((location, index) => ({
  ...location,
  id: `l${index}`,
}));

export function buildGraph(
  customJunctions?: Record<string, Point>,
  customEdges?: [string, string][],
  customLocations?: CampusLocation[],
) {
  const J: Record<string, Point> = { ...(customJunctions ?? getActiveJunctions()) };
  const RC = RING_CENTER;
  const RR = RING_RADIUS;
  const RN = RING_POINTS;

  for (let i = 0; i < RN; i += 1) {
    const angle = (i / RN) * Math.PI * 2;
    J[`r${i}`] = [
      RC[0] + RR * Math.cos(angle),
      RC[1] + RR * Math.sin(angle),
    ];
  }

  const near = (pt: Point): string => {
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < RN; i += 1) {
      const ringPt = J[`r${i}`]!;
      const nextDistance = distance(ringPt, pt);
      if (nextDistance < bestDistance) {
        bestDistance = nextDistance;
        best = i;
      }
    }

    return `r${best}`;
  };

  const configuredEdges = customEdges ?? getActiveEdges();
  const edgeList: [string, string][] = [...configuredEdges];
  if (J["ece"] && !edgeList.some(([a, b]) => (a === "ece" && b.startsWith("r")) || (b === "ece" && a.startsWith("r")))) {
    edgeList.push(["ece", near([395, 386])]);
  }
  if (J["east"] && !edgeList.some(([a, b]) => (a === "east" && b.startsWith("r")) || (b === "east" && a.startsWith("r")))) {
    edgeList.push(["east", near([633, 394])]);
  }
  if (J["south"] && !edgeList.some(([a, b]) => (a === "south" && b.startsWith("r")) || (b === "south" && a.startsWith("r")))) {
    edgeList.push(["south", near([497, 556])]);
  }

  for (let i = 0; i < RN; i += 1) {
    edgeList.push([`r${i}`, `r${(i + 1) % RN}`]);
  }

  const rawLocs = customLocations ?? getActiveCampusLocations();
  const mutableLocations = rawLocs.map((loc, idx) => ({
    id: loc.id || `l${idx}`,
    n: loc.name,
    c: loc.category,
    x: loc.x,
    y: loc.y,
    j:
      loc.nodeId ??
      (BASE_LOCATIONS.find((b) => b.n === loc.name)?.j === "circle"
        ? near([loc.x, loc.y])
        : BASE_LOCATIONS.find((b) => b.n === loc.name)?.j ?? "j3"),
  }));

  const position = (id: string): Point => {
    const junctionPt = J[id];
    if (junctionPt) {
      return junctionPt;
    }
    const location = mutableLocations.find((item) => item.id === id);
    return location ? [location.x, location.y] : [0, 0];
  };

  const adjacency: Record<string, [string, number][]> = {};

  const link = (a: string, b: string) => {
    const d = distance(position(a), position(b));
    (adjacency[a] ??= []).push([b, d]);
    (adjacency[b] ??= []).push([a, d]);
  };

  edgeList.forEach(([a, b]) => link(a, b));
  mutableLocations.forEach((location) => link(location.id, location.j));

  const shortestPath = (start: string, end: string): string[] => {
    const distMap: Record<string, number> = { [start]: 0 };
    const previous: Record<string, string | undefined> = {};
    const visited = new Set<string>();

    while (true) {
      let current: string | null = null;

      Object.keys(distMap).forEach((key) => {
        const dKey = distMap[key];
        const dCurrent = current !== null ? distMap[current] : undefined;
        if (
          !visited.has(key) &&
          dKey !== undefined &&
          (current === null || dCurrent === undefined || dKey < dCurrent)
        ) {
          current = key;
        }
      });

      if (current === null || current === end) {
        break;
      }

      visited.add(current);

      const currentNode: string = current;
      const currentDist = distMap[currentNode];
      if (currentDist !== undefined) {
        (adjacency[currentNode] ?? []).forEach(([next, weight]) => {
          const nextDistance = currentDist + weight;
          const targetDist = distMap[next];
          if (targetDist === undefined || nextDistance < targetDist) {
            distMap[next] = nextDistance;
            previous[next] = currentNode;
          }
        });
      }
    }

    const output: string[] = [];
    for (let node: string | undefined = end; node; node = previous[node]) {
      output.unshift(node);
      if (node === start) {
        break;
      }
    }

    return output;
  };

  return { mutableLocations, position, shortestPath };
}

export const defaultGraph = buildGraph();

export function resolveLocationId(
  idOrName: string,
  locationsList?: CampusLocation[],
): string {
  const list = locationsList ?? getActiveCampusLocations();
  const match = list.find(
    (loc) => loc.id === idOrName || loc.name.toLowerCase() === idOrName.toLowerCase(),
  );
  return match ? match.id : idOrName;
}

export function routeBetween(
  fromIdOrName: string,
  toIdOrName: string,
  graphOrJunctions?: ReturnType<typeof buildGraph> | Record<string, Point>,
  customEdges?: [string, string][],
  customLocations?: CampusLocation[],
): RouteResult {
  let graph: ReturnType<typeof buildGraph>;
  let locs: CampusLocation[] | undefined = customLocations;

  if (
    graphOrJunctions &&
    typeof graphOrJunctions === "object" &&
    "shortestPath" in graphOrJunctions
  ) {
    graph = graphOrJunctions as ReturnType<typeof buildGraph>;
  } else {
    graph = buildGraph(
      graphOrJunctions as Record<string, Point> | undefined,
      customEdges,
      customLocations,
    );
  }

  const fromId = resolveLocationId(fromIdOrName, locs);
  const toId = resolveLocationId(toIdOrName, locs);

  if (!fromId || !toId || fromId === toId) {
    const pt = fromId ? graph.position(fromId) : ([0, 0] as Point);
    return {
      nodeIds: fromId ? [fromId] : [],
      points: fromId ? [pt] : [],
      totalLength: 0,
    };
  }

  const nodeIds = graph.shortestPath(fromId, toId);
  const points = nodeIds.map(graph.position);
  const totalLength = points.reduce((sum, pt, idx) => {
    if (idx === 0) return 0;
    const prev = points[idx - 1];
    return prev ? sum + distance(prev, pt) : sum;
  }, 0);

  return {
    nodeIds,
    points,
    totalLength,
  };
}
