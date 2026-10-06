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
  apiKey: string;
  mapId: string;
}

export const campusMap: CampusMapConfig = {
  center: [12.1928, 79.0835],
  zoom: 18,
  minZoom: 15,
  maxZoom: 21,
  bounds: null,
  kioskLocationId: "main-gate",
  apiKey: (import.meta.env["VITE_GOOGLE_MAPS_API_KEY"] as string | undefined) ?? "",
  mapId: (import.meta.env["VITE_GOOGLE_MAP_ID"] as string | undefined) ?? "",
};
