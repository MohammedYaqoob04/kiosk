import type { CampusNode, CampusEdge } from "@/config/campusGraph";
import type { CampusLocation } from "@/config/campusLocations";

export const WALK_SPEED_M_PER_MIN = 80;

export interface EdgeNeighbor {
  to: string;
  weight: number;
}

export type RoutingGraph = Map<string, EdgeNeighbor[]>;

export interface ShortestPathResult {
  path: string[];
  distance: number;
}

/**
 * Calculates Great-circle distance between two GPS coordinates in metres using the Haversine formula.
 */
export function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000; // Radius of the Earth in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates forward azimuth / initial bearing in degrees (0..360) from point a to point b.
 */
export function bearing(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
}

/**
 * Returns 8-point compass direction for a bearing angle in degrees.
 */
export function compassDirection(deg: number): string {
  const directions = [
    "north",
    "north-east",
    "east",
    "south-east",
    "south",
    "south-west",
    "west",
    "north-west",
  ];
  const normalized = (deg % 360 + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return directions[index] || "north";
}

/**
 * Builds an undirected adjacency graph from nodes and edges with weights as distances in metres.
 */
export function buildGraph(
  nodes: CampusNode[],
  edges: CampusEdge[],
): RoutingGraph {
  const nodeMap = new Map<string, CampusNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  const graph: RoutingGraph = new Map();
  for (const node of nodes) {
    graph.set(node.id, []);
  }

  for (const [a, b] of edges) {
    const nodeA = nodeMap.get(a);
    const nodeB = nodeMap.get(b);
    if (!nodeA || !nodeB) continue;

    const weight = haversine(nodeA.lat, nodeA.lng, nodeB.lat, nodeB.lng);

    if (!graph.has(a)) graph.set(a, []);
    if (!graph.has(b)) graph.set(b, []);

    graph.get(a)!.push({ to: b, weight });
    graph.get(b)!.push({ to: a, weight });
  }

  return graph;
}

/**
 * Dijkstra's shortest path algorithm.
 * Returns the sequence of node IDs from startId to endId and the total distance in metres.
 * Returns null if no path exists or if start/end nodes are missing.
 */
export function shortestPath(
  graph: RoutingGraph,
  startId: string,
  endId: string,
): ShortestPathResult | null {
  if (!graph.has(startId) || !graph.has(endId)) {
    return null;
  }

  if (startId === endId) {
    return { path: [startId], distance: 0 };
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const node of graph.keys()) {
    distances.set(node, Infinity);
    previous.set(node, null);
  }

  distances.set(startId, 0);

  while (visited.size < graph.size) {
    let closestNode: string | null = null;
    let minDistance = Infinity;

    for (const [node, dist] of distances.entries()) {
      if (!visited.has(node) && dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    }

    if (closestNode === null || minDistance === Infinity) {
      break;
    }

    if (closestNode === endId) {
      break;
    }

    visited.add(closestNode);

    const neighbors = graph.get(closestNode) || [];
    for (const { to, weight } of neighbors) {
      if (visited.has(to)) continue;

      const newDist = minDistance + weight;
      if (newDist < (distances.get(to) ?? Infinity)) {
        distances.set(to, newDist);
        previous.set(to, closestNode);
      }
    }
  }

  const finalDist = distances.get(endId);
  if (finalDist === undefined || finalDist === Infinity) {
    return null;
  }

  // Reconstruct path
  const path: string[] = [];
  let curr: string | null = endId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous.get(curr) ?? null;
  }

  if (path[0] !== startId) {
    return null;
  }

  return {
    path,
    distance: finalDist,
  };
}

/**
 * Generates natural human-friendly turn-by-turn walking steps for a node path.
 */
export function describeRoute(
  path: string[],
  nodes: CampusNode[],
  locations: CampusLocation[],
): string[] {
  if (!path || path.length === 0) return [];

  const nodeMap = new Map<string, CampusNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  const locationByNodeId = new Map<string, CampusLocation>();
  for (const loc of locations) {
    if (loc.nodeId) {
      locationByNodeId.set(loc.nodeId, loc);
    }
  }

  const destNodeId = path[path.length - 1];
  const destLocation = destNodeId ? locationByNodeId.get(destNodeId) : undefined;
  const destName = destLocation?.name ?? "your destination";

  if (path.length === 1) {
    return [`You have arrived at ${destName}`];
  }

  const steps: string[] = [];

  const startId = path[0];
  const nextId = path[1];
  if (!startId || !nextId) return [`You have arrived at ${destName}`];

  const n0 = nodeMap.get(startId);
  const n1 = nodeMap.get(nextId);
  if (!n0 || !n1) return [`You have arrived at ${destName}`];

  let currentDist = haversine(n0.lat, n0.lng, n1.lat, n1.lng);
  let currentBearing = bearing(n0, n1);
  let currentDir = compassDirection(currentBearing);
  let accumulatedDist = currentDist;

  for (let i = 1; i < path.length - 1; i++) {
    const prevId = path[i - 1];
    const currId = path[i];
    const nextNodeId = path[i + 1];
    if (!prevId || !currId || !nextNodeId) continue;

    const prev = nodeMap.get(prevId);
    const curr = nodeMap.get(currId);
    const next = nodeMap.get(nextNodeId);

    if (!prev || !curr || !next) continue;

    const b1 = bearing(prev, curr);
    const b2 = bearing(curr, next);
    const angleDiff = ((b2 - b1 + 540) % 360) - 180;
    const nextDist = haversine(curr.lat, curr.lng, next.lat, next.lng);

    // Check for a noticeable turn (more than 35 degrees)
    if (Math.abs(angleDiff) > 35) {
      steps.push(`Walk ${currentDir} for ${Math.round(accumulatedDist)} m`);

      const turnSide = angleDiff > 0 ? "right" : "left";
      const targetLoc = locationByNodeId.get(next.id) || locationByNodeId.get(curr.id);

      if (targetLoc) {
        steps.push(`Turn ${turnSide} toward ${targetLoc.name}`);
      } else {
        const nextDir = compassDirection(b2);
        steps.push(`Turn ${turnSide} heading ${nextDir}`);
      }

      currentBearing = b2;
      currentDir = compassDirection(b2);
      accumulatedDist = nextDist;
    } else {
      accumulatedDist += nextDist;
    }
  }

  // Push remaining walking distance step
  steps.push(`Walk ${currentDir} for ${Math.round(accumulatedDist)} m`);

  // Final destination arrival
  steps.push(`You have arrived at ${destName}`);

  return steps;
}

/**
 * Calculates walking time in minutes based on 80 m/min walking speed.
 */
export function walkingTimeMinutes(distanceMetres: number): number {
  return Math.ceil(distanceMetres / WALK_SPEED_M_PER_MIN);
}
