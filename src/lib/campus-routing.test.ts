import { describe, expect, it } from "vitest";
import {
  WALK_SPEED_M_PER_MIN,
  bearing,
  buildGraph,
  compassDirection,
  describeRoute,
  haversine,
  shortestPath,
  walkingTimeMinutes,
} from "./campusRouting";
import type { CampusNode, CampusEdge } from "@/config/campusGraph";
import type { CampusLocation } from "@/config/campusLocations";

describe("campusRouting", () => {
  it("calculates haversine distance correctly", () => {
    // Distance between Tiruvannamalai campus coordinates
    const dist = haversine(12.1931, 79.0842, 12.1931, 79.0843);
    expect(dist).toBeGreaterThan(5);
    expect(dist).toBeLessThan(15);
  });

  it("calculates bearing and compass directions accurately", () => {
    // North
    const bNorth = bearing({ lat: 12.19, lng: 79.08 }, { lat: 12.2, lng: 79.08 });
    expect(Math.round(bNorth)).toBe(0);
    expect(compassDirection(bNorth)).toBe("north");

    // East
    const bEast = bearing({ lat: 12.19, lng: 79.08 }, { lat: 12.19, lng: 79.09 });
    expect(Math.round(bEast)).toBe(90);
    expect(compassDirection(bEast)).toBe("east");

    // South
    const bSouth = bearing({ lat: 12.2, lng: 79.08 }, { lat: 12.19, lng: 79.08 });
    expect(Math.round(bSouth)).toBe(180);
    expect(compassDirection(bSouth)).toBe("south");

    // West
    const bWest = bearing({ lat: 12.19, lng: 79.09 }, { lat: 12.19, lng: 79.08 });
    expect(Math.round(bWest)).toBe(270);
    expect(compassDirection(bWest)).toBe("west");
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

    const edges: CampusEdge[] = [["A", "B"]];

    const graph = buildGraph(nodes, edges);
    const result = shortestPath(graph, "A", "X");

    expect(result).toBeNull();
  });

  it("generates natural step text and walking time in describeRoute", () => {
    expect(WALK_SPEED_M_PER_MIN).toBe(80);

    const nodes: CampusNode[] = [
      { id: "n1", lat: 12.193, lng: 79.081 },
      { id: "n2", lat: 12.193, lng: 79.082 }, // going east
      { id: "n3", lat: 12.194, lng: 79.082 }, // turns north (left turn)
    ];

    const locations: CampusLocation[] = [
      {
        id: "aids-dept",
        name: "AI&DS Department",
        category: "academic",
        description: "",
        lat: 12.194,
        lng: 79.082,
        nodeId: "n3",
      },
    ];

    const steps = describeRoute(["n1", "n2", "n3"], nodes, locations);

    expect(steps.length).toBeGreaterThanOrEqual(3);
    // Starts with walking east
    expect(steps[0]).toMatch(/Walk east for \d+ m/i);
    // Left turn toward AI&DS Department
    expect(steps.some((s) => s.includes("Turn left toward AI&DS Department"))).toBe(true);
    // Ends with arrival
    expect(steps[steps.length - 1]).toBe("You have arrived at AI&DS Department");

    // Walking time check
    const time = walkingTimeMinutes(160);
    expect(time).toBe(2);
  });
});
