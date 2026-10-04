export interface CampusLocation {
  id: string;
  name: string;
  category: string;
  description: string;
  position: { x: number; y: number } | null;
  lat: number | null;
  lng: number | null;
}

export const campusLocations: CampusLocation[] = [
  {
    id: "main-gate",
    name: "Main Gate",
    category: "-- add from college",
    description: "-- add from college",
    position: null,
    lat: null,
    lng: null,
  },
  {
    id: "administrative-block",
    name: "Administrative Block",
    category: "-- add from college",
    description: "-- add from college",
    position: null,
    lat: null,
    lng: null,
  },
  {
    id: "aids-department",
    name: "AI&DS Department",
    category: "-- add from college",
    description: "-- add from college",
    position: null,
    lat: null,
    lng: null,
  },
  {
    id: "library",
    name: "Library",
    category: "-- add from college",
    description: "-- add from college",
    position: null,
    lat: null,
    lng: null,
  },
  {
    id: "hostel",
    name: "Hostel",
    category: "-- add from college",
    description: "-- add from college",
    position: null,
    lat: null,
    lng: null,
  },
  {
    id: "cafeteria",
    name: "Cafeteria",
    category: "-- add from college",
    description: "-- add from college",
    position: null,
    lat: null,
    lng: null,
  },
  {
    id: "sports-ground",
    name: "Sports Ground",
    category: "-- add from college",
    description: "-- add from college",
    position: null,
    lat: null,
    lng: null,
  },
  {
    id: "parking",
    name: "Parking",
    category: "-- add from college",
    description: "-- add from college",
    position: null,
    lat: null,
    lng: null,
  },
];
