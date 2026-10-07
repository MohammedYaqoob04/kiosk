import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BASE_EDGES,
  H,
  JUNCTIONS,
  RING_CENTER,
  RING_RADIUS,
  W,
  type Point,
} from "@/config/campusMap";
import {
  CAMPUS_BASE_MAP_STORAGE_KEY,
  CAMPUS_JUNCTIONS_STORAGE_KEY,
  CAMPUS_STORAGE_KEY,
  CAMPUS_UPDATE_EVENT,
  campusLocations,
  type CampusLocation,
} from "@/config/campusLocations";
import { validateCampusMap } from "@/lib/campusGeometry";

export const CAMPUS_MAP_DATA_STORAGE_KEY = "campus_custom_map_data";

export interface CampusMapData {
  width: number;
  height: number;
  image: string;
  version: number | string;
  locations: CampusLocation[];
  junctions: Record<string, Point>;
  edges: [string, string][];
  ringCenter?: Point;
  ringRadius?: number;
}

export const defaultCampusMap: CampusMapData = {
  width: W,
  height: H,
  image: "/assets/campus-map.jpg",
  version: 1,
  locations: campusLocations,
  junctions: JUNCTIONS,
  edges: BASE_EDGES,
  ringCenter: RING_CENTER,
  ringRadius: RING_RADIUS,
};

/**
 * Synchronously reads any stored custom map from localStorage.
 * Prevents flashing the old default map while loading if a custom map exists.
 */
export function getStoredCustomMap(): CampusMapData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CAMPUS_MAP_DATA_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (validateCampusMap(parsed)) {
        return parsed as CampusMapData;
      }
    }

    // Check legacy individual keys
    const customImage = localStorage.getItem(CAMPUS_BASE_MAP_STORAGE_KEY);
    const customLocationsRaw = localStorage.getItem(CAMPUS_STORAGE_KEY);
    const customJunctionsRaw = localStorage.getItem(CAMPUS_JUNCTIONS_STORAGE_KEY);
    const customEdgesRaw = localStorage.getItem("campus_custom_edges");

    if (customImage || customLocationsRaw || customJunctionsRaw || customEdgesRaw) {
      const locations = customLocationsRaw ? (JSON.parse(customLocationsRaw) as CampusLocation[]) : campusLocations;
      const junctions = customJunctionsRaw ? (JSON.parse(customJunctionsRaw) as Record<string, Point>) : JUNCTIONS;
      const edges = customEdgesRaw ? (JSON.parse(customEdgesRaw) as [string, string][]) : BASE_EDGES;
      return {
        width: W,
        height: H,
        image: customImage || "/assets/campus-map.jpg",
        version: Date.now(),
        locations,
        junctions,
        edges,
        ringCenter: RING_CENTER,
        ringRadius: RING_RADIUS,
      };
    }
  } catch (err) {
    console.warn("Failed to read stored campus map:", err);
  }
  return null;
}

/**
 * Returns initial map data: custom map if one exists, otherwise default.
 * Never flashes old default if a custom map exists in storage.
 */
function getInitialMapData(): CampusMapData {
  return getStoredCustomMap() ?? defaultCampusMap;
}

export interface UseCampusMapReturn {
  mapData: CampusMapData;
  mapImage: string;
  versionedImageSrc: string;
  version: number | string;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  saveMap: (updated: CampusMapData) => Promise<void>;
  resetToDefault: () => void;
}

export function useCampusMap(): UseCampusMapReturn {
  const [mapData, setMapData] = useState<CampusMapData>(getInitialMapData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBackendMap = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // JSON fetch uses cache: "no-store"
      const apiUrl = import.meta.env["VITE_API_URL"] || "http://localhost:8000";
      const endpoints = [`${apiUrl}/api/v1/campus-map`, `${apiUrl}/campus-map`, "/api/v1/campus-map"];

      let fetchedData: CampusMapData | null = null;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-store",
              Pragma: "no-cache",
            },
          });

          if (res.ok) {
            const json = (await res.json()) as unknown;
            if (validateCampusMap(json)) {
              fetchedData = json as CampusMapData;
              break;
            }
          }
        } catch {
          // try next
        }
      }

      if (fetchedData) {
        setMapData(fetchedData);
        // Persist to local storage as fallback
        localStorage.setItem(CAMPUS_MAP_DATA_STORAGE_KEY, JSON.stringify(fetchedData));
      } else {
        // If backend returned 404 NO_CUSTOM_MAP or failed, use stored custom map, or default
        const localCustom = getStoredCustomMap();
        if (localCustom) {
          setMapData(localCustom);
        } else {
          setMapData(defaultCampusMap);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch campus map from backend:", err);
      const localCustom = getStoredCustomMap();
      if (localCustom) {
        setMapData(localCustom);
      } else {
        setMapData(defaultCampusMap);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBackendMap();

    const handleUpdate = () => {
      const stored = getStoredCustomMap();
      if (stored) {
        setMapData(stored);
      } else {
        setMapData(defaultCampusMap);
      }
    };

    window.addEventListener(CAMPUS_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(CAMPUS_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [fetchBackendMap]);

  // Version-stamped URL for the map image
  const versionedImageSrc = useMemo(() => {
    const rawSrc = mapData.image;
    if (!rawSrc) return "/assets/campus-map.jpg?v=1";
    // Data URLs (base64) don't need ?v= param
    if (rawSrc.startsWith("data:") || rawSrc.startsWith("blob:")) {
      return rawSrc;
    }
    const separator = rawSrc.includes("?") ? "&" : "?";
    return `${rawSrc}${separator}v=${mapData.version}`;
  }, [mapData.image, mapData.version]);

  const saveMap = useCallback(async (updated: CampusMapData) => {
    const stamped: CampusMapData = {
      ...updated,
      version: Date.now(),
    };

    // Save to localStorage
    localStorage.setItem(CAMPUS_MAP_DATA_STORAGE_KEY, JSON.stringify(stamped));
    localStorage.setItem(CAMPUS_BASE_MAP_STORAGE_KEY, stamped.image);
    localStorage.setItem(CAMPUS_STORAGE_KEY, JSON.stringify(stamped.locations));
    localStorage.setItem(CAMPUS_JUNCTIONS_STORAGE_KEY, JSON.stringify(stamped.junctions));
    localStorage.setItem("campus_custom_edges", JSON.stringify(stamped.edges));

    setMapData(stamped);
    window.dispatchEvent(new Event(CAMPUS_UPDATE_EVENT));

    // Also attempt backend publish
    try {
      const apiUrl = import.meta.env["VITE_API_URL"] || "http://localhost:8000";
      await fetch(`${apiUrl}/api/v1/campus-map`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify(stamped),
      });
    } catch (err) {
      console.warn("Could not publish campus map to backend server:", err);
    }
  }, []);

  const resetToDefault = useCallback(() => {
    localStorage.removeItem(CAMPUS_MAP_DATA_STORAGE_KEY);
    localStorage.removeItem(CAMPUS_BASE_MAP_STORAGE_KEY);
    localStorage.removeItem(CAMPUS_STORAGE_KEY);
    localStorage.removeItem(CAMPUS_JUNCTIONS_STORAGE_KEY);
    localStorage.removeItem("campus_custom_edges");

    const resetData: CampusMapData = {
      ...defaultCampusMap,
      version: Date.now(),
    };
    setMapData(resetData);
    window.dispatchEvent(new Event(CAMPUS_UPDATE_EVENT));
  }, []);

  return {
    mapData,
    mapImage: mapData.image,
    versionedImageSrc,
    version: mapData.version,
    loading,
    error,
    reload: fetchBackendMap,
    saveMap,
    resetToDefault,
  };
}
