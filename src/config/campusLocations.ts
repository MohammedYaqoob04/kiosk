export type CampusCategory =
  | "academic"
  | "hostel"
  | "service"
  | "food"
  | "sport"
  | "sports"
  | "landmark"
  | "gate";

export interface CampusLocation {
  id: string;
  name: string;
  category: CampusCategory;
  x: number;
  y: number;
  lat: number | null;
  lng: number | null;
  nodeId: string | null;
  description?: string;
  position?: { x: number; y: number } | null;
}

export const categoryColors: Record<CampusCategory, string> = {
  academic: "var(--cat-academic, #0f766e)",
  hostel: "var(--cat-hostel, #6d28d9)",
  service: "var(--cat-food, #c2410c)",
  food: "var(--cat-food, #c2410c)",
  sport: "var(--cat-sports, #15803d)",
  sports: "var(--cat-sports, #15803d)",
  landmark: "var(--cat-landmark, #be185d)",
  gate: "var(--cat-gate, #b91c1c)",
};

export const categoryLabels: Record<CampusCategory, string> = {
  academic: "Academic",
  hostel: "Hostel",
  service: "Food & services",
  food: "Food & services",
  sport: "Sports",
  sports: "Sports",
  landmark: "Landmark",
  gate: "Main Gate",
};

export const campusLocations: CampusLocation[] = [
  { id: "l0", name: "Boys Hostel", category: "hostel", x: 440, y: 148, lat: 148, lng: 440, nodeId: "j36" },
  { id: "l1", name: "Girls Hostel", category: "hostel", x: 163, y: 408, lat: 408, lng: 163, nodeId: "j33" },
  { id: "l2", name: "Temple", category: "landmark", x: 380, y: 343, lat: 343, lng: 380, nodeId: "j31" },
  { id: "l3", name: "ECE Department", category: "academic", x: 451, y: 323, lat: 323, lng: 451, nodeId: "j50" },
  { id: "l4", name: "Open Auditorium", category: "academic", x: 530, y: 312, lat: 312, lng: 530, nodeId: "j41" },
  { id: "l5", name: "Mechanical", category: "academic", x: 623, y: 292, lat: 292, lng: 623, nodeId: "j18" },
  { id: "l6", name: "AI&ML and CSE", category: "academic", x: 686, y: 175, lat: 175, lng: 686, nodeId: "j19" },
  { id: "l7", name: "Civil", category: "academic", x: 708, y: 276, lat: 276, lng: 708, nodeId: "j46" },
  { id: "l8", name: "Bio Tec", category: "academic", x: 780, y: 339, lat: 339, lng: 780, nodeId: "j46" },
  { id: "l9", name: "Arunai Gateway and Library", category: "landmark", x: 360, y: 474, lat: 474, lng: 360, nodeId: "j20" },
  { id: "l10", name: "Canteen", category: "service", x: 277, y: 587, lat: 587, lng: 277, nodeId: "j24" },
  { id: "l11", name: "AI&DS", category: "academic", x: 481, y: 421, lat: 421, lng: 481, nodeId: "j9" },
  { id: "l12", name: "EEE", category: "academic", x: 597, y: 412, lat: 412, lng: 597, nodeId: "j11" },
  { id: "l13", name: "IT Department", category: "academic", x: 720, y: 435, lat: 435, lng: 720, nodeId: "j16" },
  { id: "l14", name: "AC Auditorium", category: "academic", x: 381, y: 623, lat: 623, lng: 381, nodeId: "j25" },
  { id: "l15", name: "Has Block", category: "academic", x: 674, y: 584, lat: 584, lng: 674, nodeId: "j13" },
  { id: "l16", name: "Parking", category: "service", x: 534, y: 699, lat: 699, lng: 534, nodeId: "j26" },
  { id: "l17", name: "Basketball Ground", category: "sport", x: 421, y: 724, lat: 724, lng: 421, nodeId: "j28" },
  { id: "l18", name: "Volleyball Ground", category: "sport", x: 620, y: 708, lat: 708, lng: 620, nodeId: "j51" },
  { id: "l19", name: "SBI Bank and Store", category: "service", x: 346, y: 801, lat: 801, lng: 346, nodeId: "j29" },
  { id: "l20", name: "Arunai Center", category: "landmark", x: 459, y: 590, lat: 590, lng: 459, nodeId: "j7" },
  { id: "l21", name: "Main Gate", category: "gate", x: 577, y: 756, lat: 756, lng: 577, nodeId: "j3" },
];

export const CAMPUS_STORAGE_KEY = "campus_custom_locations";
export const CAMPUS_BASE_MAP_STORAGE_KEY = "campus_custom_base_map";
export const CAMPUS_JUNCTIONS_STORAGE_KEY = "campus_custom_junctions";
export const CAMPUS_UPDATE_EVENT = "campus_map_updated";

export function getActiveCampusLocations(): CampusLocation[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(CAMPUS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CampusLocation[];
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.nodeId !== "north") {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
  }
  return campusLocations;
}

export function getActiveBaseMapImage(): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(CAMPUS_BASE_MAP_STORAGE_KEY);
      if (stored) return stored;
    } catch {
      // fallback
    }
  }
  return "/assets/campus-map.jpg";
}

export function saveCampusLocations(locations: CampusLocation[]): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(CAMPUS_STORAGE_KEY, JSON.stringify(locations));
    window.dispatchEvent(new Event(CAMPUS_UPDATE_EVENT));
  }
}

export function saveBaseMapImage(dataUrl: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(CAMPUS_BASE_MAP_STORAGE_KEY, dataUrl);
    window.dispatchEvent(new Event(CAMPUS_UPDATE_EVENT));
  }
}

export function resetCampusLocations(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CAMPUS_STORAGE_KEY);
    window.dispatchEvent(new Event(CAMPUS_UPDATE_EVENT));
  }
}

export function resetBaseMapImage(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CAMPUS_BASE_MAP_STORAGE_KEY);
    window.dispatchEvent(new Event(CAMPUS_UPDATE_EVENT));
  }
}

