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
  position: { x: number; y: number } | null;
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

export const campusLocations: CampusLocation[] = [
  // Academic
  {
    id: "ac-auditorium",
    name: "AC Auditorium",
    category: "academic",
    description: "-- add from college",
    position: null,
    lat: 12.192349457527632,
    lng: 79.08381835076169,
    nodeId: "n34",
  },
  {
    id: "it-block",
    name: "IT Block",
    category: "academic",
    description: "-- add from college",
    position: null,
    lat: 12.193600009945381,
    lng: 79.08325441633029,
    nodeId: "n68",
  },
  {
    id: "has-block",
    name: "HAS Block",
    category: "academic",
    description: "-- add from college",
    position: null,
    lat: 12.193379,
    lng: 79.083642,
    nodeId: "n14",
  },
  {
    id: "aiml-and-cse",
    name: "AI & ML + CSE Block",
    category: "academic",
    description: "-- add from college",
    position: null,
    lat: 12.193495142047322,
    lng: 79.08226132845456,
    nodeId: "n76",
  },
  {
    id: "ece-department",
    name: "ECE Department",
    category: "academic",
    description: "-- add from college",
    position: null,
    lat: 12.192609006628636,
    lng: 79.0827816769972,
    nodeId: "n55",
  },
  {
    id: "mech-department",
    name: "MECH Department",
    category: "academic",
    description: "-- add from college",
    position: null,
    lat: 12.193333694866126,
    lng: 79.08267641918741,
    nodeId: "n74",
  },
  {
    id: "open-auditorium",
    name: "Open Auditorium",
    category: "academic",
    description: "-- add from college",
    position: null,
    lat: 12.192968622945118,
    lng: 79.08283466951389,
    nodeId: "n53",
  },
  {
    id: "bio-department",
    name: "BIO Department",
    category: "academic",
    description: "-- add from college",
    position: null,
    lat: 12.193794458170983,
    lng: 79.0828588093942,
    nodeId: "n73",
  },
  {
    id: "civil-department",
    name: "Civil Department",
    category: "academic",
    description: "-- add from college",
    position: null,
    lat: 12.193602418939252,
    lng: 79.08256108420372,
    nodeId: "n73",
  },
  {
    id: "eee-department",
    name: "EEE Department",
    category: "academic",
    description: "-- add from college",
    position: null,
    lat: 12.19315148668112,
    lng: 79.08307606831698,
    nodeId: "n63",
  },
  {
    id: "aids-department",
    name: "AIDS Department",
    category: "academic",
    description: "-- add from college",
    position: null,
    lat: 12.192787069928688,
    lng: 79.08315921680148,
    nodeId: "n65",
  },

  // Hostel
  {
    id: "boys-hostel",
    name: "Boys Hostel",
    category: "hostel",
    description: "-- add from college",
    position: null,
    lat: 12.192608138499796,
    lng: 79.08213461297413,
    nodeId: "n43",
  },
  {
    id: "girls-hostel",
    name: "Girls Hostel",
    category: "hostel",
    description: "-- add from college",
    position: null,
    lat: 12.19156511275028,
    lng: 79.08308419038293,
    nodeId: "n61",
  },

  // Food
  {
    id: "canteen",
    name: "Canteen",
    category: "food",
    description: "-- add from college",
    position: null,
    lat: 12.192063238537905,
    lng: 79.08372456779382,
    nodeId: "n32",
  },
  {
    id: "parking",
    name: "Parking",
    category: "food",
    description: "-- add from college",
    position: null,
    lat: 12.192936229065289,
    lng: 79.08424064222933,
    nodeId: "n19",
  },
  {
    id: "store",
    name: "Store",
    category: "food",
    description: "-- add from college",
    position: null,
    lat: 12.192255240698223,
    lng: 79.0845075220172,
    nodeId: "n23",
  },

  // Sports
  {
    id: "basketball-court",
    name: "Basketball Court",
    category: "sports",
    description: "-- add from college",
    position: null,
    lat: 12.19256394690231,
    lng: 79.0842466771994,
    nodeId: "n24",
  },
  {
    id: "volleyball-court",
    name: "Volleyball Court",
    category: "sports",
    description: "-- add from college",
    position: null,
    lat: 12.193271806905132,
    lng: 79.08416486982725,
    nodeId: "n18",
  },

  // Landmark
  {
    id: "arunai-center",
    name: "Arunai Center",
    category: "landmark",
    description: "-- add from college",
    position: null,
    lat: 12.192612486667413,
    lng: 79.08379095246468,
    nodeId: "n6",
  },
  {
    id: "temple",
    name: "Temple",
    category: "landmark",
    description: "-- add from college",
    position: null,
    lat: 12.192384914877055,
    lng: 79.08274524804378,
    nodeId: "n38",
  },
  {
    id: "arunai-gateway-and-lab",
    name: "Arunai Gateway & Lab",
    category: "landmark",
    description: "-- add from college",
    position: null,
    lat: 12.192352143512725,
    lng: 79.08329577142528,
    nodeId: "n27",
  },
  {
    id: "main-center",
    name: "Main Center",
    category: "landmark",
    description: "-- add from college",
    position: null,
    lat: 12.193033131630933,
    lng: 79.08356265121316,
    nodeId: "n17",
  },

  // Gate
  {
    id: "main-gate",
    name: "Main Gate",
    category: "gate",
    description: "-- add from college",
    position: null,
    lat: 12.193130863698174,
    lng: 79.08442153103873,
    nodeId: "n1",
  },
];
