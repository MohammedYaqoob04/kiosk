import type { CampusLocation } from "@/config/campusLocations";
import { siteContent } from "@/config/siteContent";

interface CampusMapProps {
  locations: CampusLocation[];
  selectedId: string | null;
  onSelect: (location: CampusLocation) => void;
  route?: CampusLocation[];
}

export function CampusMap({
  locations,
  selectedId,
}: CampusMapProps) {
  const selectedLocation = locations.find((location) => location.id === selectedId);

  return (
    <section className="campus-map-section" aria-label={siteContent.campusPage.mapTitle}>
      <div className="campus-map-empty">
        {/* Replace this panel with the college map and navigation layer when verified map data is available. */}
        <div className="campus-map-marker" aria-hidden="true" />
        <h2>{siteContent.campusPage.emptyMapTitle}</h2>
        {selectedLocation && <p>{selectedLocation.name}</p>}
      </div>
      <div className="campus-map-actions">
        <p>{siteContent.campusPage.noMapData}</p>
        <button type="button" disabled>
          {siteContent.campusPage.directionsLabel}
        </button>
      </div>
    </section>
  );
}
