import campusData from "./campusData.json";

export type CampusCategory =
  | "academic"
  | "hostel"
  | "food"
  | "sports"
  | "landmark"
  | "gate";

export interface CampusLocation {
  id: string;
  name: string;
  category: CampusCategory;
  description: string;
  lat: number | null;
  lng: number | null;
  nodeId: string | null;
}

export const categoryColors: Record<CampusCategory, string> = {
  academic: "var(--cat-academic, #0f766e)",
  hostel: "var(--cat-hostel, #6d28d9)",
  food: "var(--cat-food, #c2410c)",
  sports: "var(--cat-sports, #15803d)",
  landmark: "var(--cat-landmark, #be185d)",
  gate: "var(--cat-gate, #b91c1c)",
};

export const categoryLabels: Record<CampusCategory, string> = {
  academic: "Academic",
  hostel: "Hostel",
  food: "Food & Store",
  sports: "Sports",
  landmark: "Landmark",
  gate: "Gate",
};

interface LocationDefinition {
  id: string;
  name: string;
  category: CampusCategory;
  description: string;
}

const locationDefinitions: LocationDefinition[] = [
  // Academic
  { id: "ac-auditorium", name: "AC Auditorium", category: "academic", description: "-- add from college" },
  { id: "it-department", name: "IT Department", category: "academic", description: "-- add from college" },
  { id: "has-block", name: "Has Block", category: "academic", description: "-- add from college" },
  { id: "aiml-and-cse", name: "AI&ML and CSE", category: "academic", description: "-- add from college" },
  { id: "ece-department", name: "ECE Department", category: "academic", description: "-- add from college" },
  { id: "mechanical", name: "Mechanical", category: "academic", description: "-- add from college" },
  { id: "open-auditorium", name: "Open Auditorium", category: "academic", description: "-- add from college" },
  { id: "civil", name: "Civil", category: "academic", description: "-- add from college" },
  { id: "bio-tec", name: "Bio Tec", category: "academic", description: "-- add from college" },
  { id: "aids", name: "AI&DS", category: "academic", description: "-- add from college" },
  { id: "eee", name: "EEE", category: "academic", description: "-- add from college" },
  { id: "cse-department", name: "CSE Department", category: "academic", description: "-- add from college" },

  // Hostel
  { id: "boys-hostel", name: "Boys Hostel", category: "hostel", description: "-- add from college" },
  { id: "girls-hostel", name: "Girls Hostel", category: "hostel", description: "-- add from college" },

  // Food
  { id: "canteen", name: "Canteen", category: "food", description: "-- add from college" },
  { id: "parking", name: "Parking", category: "food", description: "-- add from college" },
  { id: "sbi-bank-and-store", name: "SBI Bank and Store", category: "food", description: "-- add from college" },

  // Sports
  { id: "basketball-ground", name: "Basketball Ground", category: "sports", description: "-- add from college" },
  { id: "volleyball-ground", name: "Volleyball Ground", category: "sports", description: "-- add from college" },

  // Landmark
  { id: "arunai-center", name: "Arunai Center", category: "landmark", description: "-- add from college" },
  { id: "temple", name: "Temple", category: "landmark", description: "-- add from college" },
  { id: "arunai-gateway-and-library", name: "Arunai Gateway and Library", category: "landmark", description: "-- add from college" },
  { id: "main-circle", name: "Main Circle", category: "landmark", description: "-- add from college" },

  // Gate
  { id: "main-gate", name: "Main Gate", category: "gate", description: "-- add from college" },
];

const dataLocationMap = new Map<string, { lat: number | null; lng: number | null; nodeId: string | null }>();
for (const item of campusData.locations) {
  dataLocationMap.set(item.id, {
    lat: item.lat ?? null,
    lng: item.lng ?? null,
    nodeId: item.nodeId ?? null,
  });
}

export const campusLocations: CampusLocation[] = locationDefinitions.map((def) => {
  const data = dataLocationMap.get(def.id);
  return {
    id: def.id,
    name: def.name,
    category: def.category,
    description: def.description,
    lat: data?.lat ?? null,
    lng: data?.lng ?? null,
    nodeId: data?.nodeId ?? null,
  };
});
