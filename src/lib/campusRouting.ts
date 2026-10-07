import type { CampusNode, CampusEdge } from "@/config/campusGraph";

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
