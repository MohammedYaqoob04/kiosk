export const W = 900;
export const H = 810;

export const KIOSK_START_NAME = "Main Gate";
export const METERS_PER_MAP_UNIT: number | null = null;

export function formatDistance(
  units: number,
  metersPerUnit: number | null = METERS_PER_MAP_UNIT,
): string {
  if (metersPerUnit === null) {
    return `${Math.round(units)} map units`;
  }
  return `about ${Math.round(units * metersPerUnit)} m`;
}

export type Point = [number, number];

export type Category = "academic" | "hostel" | "service" | "sport" | "landmark" | "gate";

export interface LocationItem {
  id: string;
  n: string;
  c: Category;
  x: number;
  y: number;
  j: string;
}

export const CATEGORY_DISPLAY_WORDS: Record<Category, string> = {
  academic: "Academic",
  hostel: "Hostel",
  service: "Food & services",
  sport: "Sports",
  landmark: "Landmark",
  gate: "Main Gate",
};

export const BASE_LOCATIONS: Omit<LocationItem, "id">[] = [
  { n: "Boys Hostel", c: "hostel", x: 440, y: 148, j: "j36" },
  { n: "Girls Hostel", c: "hostel", x: 163, y: 408, j: "j33" },
  { n: "Temple", c: "landmark", x: 380, y: 343, j: "j31" },
  { n: "ECE Department", c: "academic", x: 451, y: 323, j: "j50" },
  { n: "Open Auditorium", c: "academic", x: 530, y: 312, j: "j41" },
  { n: "Mechanical", c: "academic", x: 623, y: 292, j: "j18" },
  { n: "AI&ML and CSE", c: "academic", x: 686, y: 175, j: "j19" },
  { n: "Civil", c: "academic", x: 708, y: 276, j: "j46" },
  { n: "Bio Tec", c: "academic", x: 780, y: 339, j: "j46" },
  { n: "Arunai Gateway and Library", c: "landmark", x: 360, y: 474, j: "j20" },
  { n: "Canteen", c: "service", x: 277, y: 587, j: "j24" },
  { n: "AI&DS", c: "academic", x: 481, y: 421, j: "j9" },
  { n: "EEE", c: "academic", x: 597, y: 412, j: "j11" },
  { n: "IT Department", c: "academic", x: 720, y: 435, j: "j16" },
  { n: "AC Auditorium", c: "academic", x: 381, y: 623, j: "j25" },
  { n: "Has Block", c: "academic", x: 674, y: 584, j: "j13" },
  { n: "Parking", c: "service", x: 534, y: 699, j: "j26" },
  { n: "Basketball Ground", c: "sport", x: 421, y: 724, j: "j28" },
  { n: "Volleyball Ground", c: "sport", x: 620, y: 708, j: "j51" },
  { n: "SBI Bank and Store", c: "service", x: 346, y: 801, j: "j29" },
  { n: "Arunai Center", c: "landmark", x: 459, y: 590, j: "j7" },
  { n: "Main Gate", c: "gate", x: 577, y: 756, j: "j3" },
];

export const JUNCTIONS: Record<string, Point> = {
  j3: [570, 716],
  j4: [565, 664],
  j5: [561, 617],
  j6: [520, 592],
  j7: [485, 560],
  j8: [472, 505],
  j9: [502, 462],
  j10: [543, 440],
  j11: [588, 449],
  j12: [625, 503],
  j13: [627, 547],
  j14: [604, 584],
  j15: [651, 460],
  j16: [676, 427],
  j17: [674, 352],
  j18: [669, 285],
  j19: [657, 179],
  j20: [405, 469],
  j21: [387, 499],
  j22: [433, 496],
  j23: [347, 508],
  j24: [312, 518],
  j25: [365, 559],
  j26: [543, 733],
  j27: [502, 740],
  j28: [458, 748],
  j29: [392, 760],
  j30: [416, 421],
  j31: [408, 344],
  j32: [340, 363],
  j33: [220, 384],
  j34: [399, 279],
  j35: [387, 176],
  j36: [440, 172],
  j37: [473, 168],
  j38: [477, 210],
  j39: [482, 268],
  j40: [490, 330],
  j41: [532, 330],
  j42: [580, 318],
  j43: [536, 352],
  j44: [582, 352],
  j45: [635, 352],
  j46: [702, 344],
  j47: [562, 155],
  j48: [569, 216],
  j49: [575, 269],
  j50: [452, 337],
  j51: [616, 659],
};

export const RING_CENTER: Point = [501, 441];
export const RING_RADIUS = 68;
export const RING_POINTS = 36;

export const BASE_EDGES: [string, string][] = [
  ["j26", "j3"],
  ["j27", "j26"],
  ["j28", "j27"],
  ["j29", "j28"],
  ["j3", "j4"],
  ["j4", "j5"],
  ["j5", "j14"],
  ["j13", "j14"],
  ["j12", "j13"],
  ["j12", "j15"],
  ["j15", "j16"],
  ["j17", "j16"],
  ["j11", "j12"],
  ["j11", "j15"],
  ["j11", "j10"],
  ["j10", "j9"],
  ["j9", "j8"],
  ["j8", "j22"],
  ["j8", "j7"],
  ["j7", "j6"],
  ["j6", "j5"],
  ["j6", "j14"],
  ["j22", "j20"],
  ["j22", "j21"],
  ["j20", "j30"],
  ["j21", "j23"],
  ["j23", "j24"],
  ["j23", "j25"],
  ["j30", "j31"],
  ["j31", "j32"],
  ["j32", "j33"],
  ["j4", "j51"],
  ["j31", "j50"],
  ["j50", "j40"],
  ["j40", "j41"],
  ["j41", "j42"],
  ["j41", "j43"],
  ["j43", "j44"],
  ["j42", "j44"],
  ["j44", "j45"],
  ["j45", "j17"],
  ["j17", "j46"],
  ["j17", "j18"],
  ["j42", "j49"],
  ["j49", "j48"],
  ["j40", "j39"],
  ["j39", "j38"],
  ["j31", "j34"],
  ["j34", "j35"],
  ["j35", "j36"],
  ["j36", "j37"],
  ["j37", "j38"],
  ["j37", "j47"],
  ["j47", "j48"],
  ["j18", "j19"],
];

export function getActiveJunctions(): Record<string, Point> {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("campus_custom_junctions");
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, Point>;
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0 && !parsed["north"]) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
  }
  return { ...JUNCTIONS };
}

export function saveCampusJunctions(junctions: Record<string, Point>): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("campus_custom_junctions", JSON.stringify(junctions));
    window.dispatchEvent(new Event("campus_map_updated"));
  }
}

export function resetCampusJunctions(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("campus_custom_junctions");
    window.dispatchEvent(new Event("campus_map_updated"));
  }
}

export function getActiveEdges(): [string, string][] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("campus_custom_edges");
      if (stored) {
        const parsed = JSON.parse(stored) as [string, string][];
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.[0] !== "north") {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
  }
  return [...BASE_EDGES];
}

export function saveCampusEdges(edges: [string, string][]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("campus_custom_edges", JSON.stringify(edges));
    window.dispatchEvent(new Event("campus_map_updated"));
  }
}

export function resetCampusEdges(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("campus_custom_edges");
    window.dispatchEvent(new Event("campus_map_updated"));
  }
}


// Preserved for backwards compatibility with CampusEditorPage
export interface CampusMapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface CampusMapConfig {
  center: [number, number];
  zoom: number;
  minZoom: number;
  maxZoom: number;
  bounds: CampusMapBounds | null;
  kioskLocationId: string;
}

export const campusMap: CampusMapConfig = {
  center: [12.1928, 79.0835],
  zoom: 18,
  minZoom: 15,
  maxZoom: 21,
  bounds: null,
  kioskLocationId: "main-gate",
};
