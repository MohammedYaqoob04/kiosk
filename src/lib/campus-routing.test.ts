import { describe, expect, it } from "vitest";
import { buildGraph, haversine, shortestPath } from "./campusRouting";
import type { CampusNode, CampusEdge } from "@/config/campusGraph";

describe("campusRouting", () => {
  it("calculates haversine distance correctly", () => {
    // Distance between Tiruvannamalai campus coordinates
    const dist = haversine(12.1931, 79.0842, 12.1931, 79.0843);
    expect(dist).toBeGreaterThan(5);
    expect(dist).toBeLessThan(15);
  });

  it("finds shortest path with Dijkstra", () => {
    const nodes: CampusNode[] = [
      { id: "A", lat: 12.193, lng: 79.081 },
      { id: "B", lat: 12.193, lng: 79.082 },
      { id: "C", lat: 12.193, lng: 79.083 },
      { id: "D", lat: 12.194, lng: 79.082 },
    ];

    const edges: CampusEdge[] = [
      ["A", "B"],
      ["B", "C"],
      ["A", "D"],
      ["D", "C"],
    ];

    const graph = buildGraph(nodes, edges);
    const result = shortestPath(graph, "A", "C");

    expect(result).not.toBeNull();
    expect(result?.path).toEqual(["A", "B", "C"]);
    expect(result?.distance).toBeGreaterThan(0);
  });

  it("returns null when no path exists (disconnected graph)", () => {
    const nodes: CampusNode[] = [
      { id: "A", lat: 12.193, lng: 79.081 },
      { id: "B", lat: 12.193, lng: 79.082 },
      { id: "X", lat: 12.195, lng: 79.085 },
    ];

    const edges: CampusEdge[] = [
      ["A", "B"],
    ];

    const graph = buildGraph(nodes, edges);
    const result = shortestPath(graph, "A", "X");

    expect(result).toBeNull();
  });
});
