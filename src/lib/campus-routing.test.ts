import { describe, expect, it } from "vitest";
import {
  formatDistance,
  H,
  KIOSK_START_NAME,
  METERS_PER_MAP_UNIT,
  W,
} from "@/config/campusMap";
import { campusLocations } from "@/config/campusLocations";
import { LOCATIONS, routeBetween } from "@/lib/campusRouting";

describe("Campus navigation & routing", () => {
  it("has exactly 22 locations", () => {
    expect(campusLocations).toHaveLength(22);
    expect(LOCATIONS).toHaveLength(22);
  });

  it("all location names are unique", () => {
    const names = campusLocations.map((l) => l.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(22);
  });

  it("all location coordinates are inside 900x810 bounds", () => {
    expect(W).toBe(900);
    expect(H).toBe(810);
    campusLocations.forEach((loc) => {
      expect(loc.x).toBeGreaterThanOrEqual(0);
      expect(loc.x).toBeLessThanOrEqual(W);
      expect(loc.y).toBeGreaterThanOrEqual(0);
      expect(loc.y).toBeLessThanOrEqual(H);
    });
  });

  it("every place is reachable from Main Gate", () => {
    const mainGate = campusLocations.find((l) => l.name === KIOSK_START_NAME);
    expect(mainGate).toBeDefined();

    campusLocations.forEach((loc) => {
      const result = routeBetween(mainGate!.id, loc.id);
      expect(result.points.length).toBeGreaterThan(0);
      expect(result.nodeIds.length).toBeGreaterThan(0);
      expect(result.nodeIds[0]).toBe(mainGate!.id);
      expect(result.nodeIds[result.nodeIds.length - 1]).toBe(loc.id);
    });
  });

  it("route Main Gate to AI&DS starts and ends correctly", () => {
    const mainGate = campusLocations.find((l) => l.name === "Main Gate")!;
    const aids = campusLocations.find((l) => l.name === "AI&DS")!;
    expect(mainGate).toBeDefined();
    expect(aids).toBeDefined();

    const route = routeBetween(mainGate.id, aids.id);
    expect(route.points.length).toBeGreaterThan(1);
    expect(route.points[0]).toEqual([mainGate.x, mainGate.y]);
    expect(route.points[route.points.length - 1]).toEqual([aids.x, aids.y]);
    expect(route.nodeIds[0]).toBe(mainGate.id);
    expect(route.nodeIds[route.nodeIds.length - 1]).toBe(aids.id);
  });

  it("route length is equal in both directions", () => {
    const mainGate = campusLocations.find((l) => l.name === "Main Gate")!;
    const aids = campusLocations.find((l) => l.name === "AI&DS")!;

    const forward = routeBetween(mainGate.id, aids.id);
    const backward = routeBetween(aids.id, mainGate.id);

    expect(forward.totalLength).toBeGreaterThan(0);
    expect(backward.totalLength).toBeGreaterThan(0);
    expect(forward.totalLength).toBeCloseTo(backward.totalLength, 5);
  });

  it("formats distance according to METERS_PER_MAP_UNIT setting", () => {
    expect(METERS_PER_MAP_UNIT).toBeNull();
    expect(formatDistance(100)).toBe("100 map units");
    expect(formatDistance(100, null)).toBe("100 map units");
    expect(formatDistance(100, 0.5)).toBe("about 50 m");
    expect(formatDistance(100, 2)).toBe("about 200 m");
  });
});
