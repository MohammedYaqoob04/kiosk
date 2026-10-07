declare module "@googlemaps/js-api-loader" {
  export function setOptions(options: { key: string; v?: string }): void;
  export function importLibrary(name: string): Promise<any>;
}

declare namespace google {
  namespace maps {
    interface MapOptions {
      center?: { lat: number; lng: number };
      zoom?: number;
      minZoom?: number;
      maxZoom?: number;
      mapTypeId?: string;
      mapId?: string;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      gestureHandling?: string;
      clickableIcons?: boolean;
      keyboardShortcuts?: boolean;
      restriction?: {
        latLngBounds: { north: number; south: number; east: number; west: number };
        strictBounds?: boolean;
      };
      [key: string]: any;
    }

    interface MapMouseEvent {
      latLng: {
        lat(): number;
        lng(): number;
      } | null;
      [key: string]: any;
    }

    class LatLngBounds {
      constructor(sw?: { lat: number; lng: number }, ne?: { lat: number; lng: number });
      extend(point: { lat: number; lng: number }): LatLngBounds;
      isEmpty(): boolean;
    }

    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
      getZoom(): number | undefined;
      setZoom(zoom: number): void;
      setCenter(latLng: { lat: number; lng: number }): void;
      panTo(latLng: { lat: number; lng: number }): void;
      fitBounds(
        bounds: LatLngBounds,
        padding?: number | { top?: number; right?: number; bottom?: number; left?: number },
      ): void;
      addListener(eventName: string, handler: (e: any) => void): any;
    }

    class Polyline {
      constructor(opts?: {
        path?: Array<{ lat: number; lng: number }>;
        map?: Map | null;
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        clickable?: boolean;
        zIndex?: number;
        icons?: any[];
        [key: string]: any;
      });
      setMap(map: Map | null): void;
      setPath(path: Array<{ lat: number; lng: number }>): void;
      setOptions(opts: any): void;
      addListener(eventName: string, handler: (e: any) => void): any;
    }

    namespace event {
      function removeListener(listener: any): void;
      function addListener(instance: any, eventName: string, handler: Function): any;
    }

    interface MapsLibrary {
      Map: typeof Map;
    }

    interface CoreLibrary {
      LatLngBounds: typeof LatLngBounds;
    }

    namespace marker {
      class AdvancedMarkerElement {
        constructor(options?: {
          map?: Map | null;
          position?: { lat: number | null; lng: number | null } | undefined;
          title?: string;
          content?: HTMLElement;
          zIndex?: number;
          gmpDraggable?: boolean;
        });
        map: Map | null;
        position: { lat: number | null; lng: number | null };
        content: HTMLElement;
        zIndex: number;
        gmpDraggable: boolean;
        addListener(eventName: string, handler: (e: any) => void): any;
      }
    }

    interface MarkerLibrary {
      AdvancedMarkerElement: typeof marker.AdvancedMarkerElement;
    }
  }
}
