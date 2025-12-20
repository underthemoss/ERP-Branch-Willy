"use client";

import { MAPBOX_STYLE, MAPBOX_TOKEN } from "@/providers/MapboxProvider";
import { Maximize2 } from "lucide-react";
import * as React from "react";
import Map, {
  GeolocateControl,
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/mapbox";
import type { ResourceMapTag } from "./types";
// Import Mapbox CSS
import "mapbox-gl/dist/mapbox-gl.css";

interface LocationMapViewProps {
  tags: ResourceMapTag[];
  selectedTagId: string | null;
  onMarkerClick: (tagId: string) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

// Default view state (centered on US)
const DEFAULT_VIEW_STATE = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 4,
};

// Geofence circle layer style
const geofenceLayerStyle = {
  id: "geofence-fill",
  type: "fill" as const,
  paint: {
    "fill-color": "#3B82F6",
    "fill-opacity": 0.15,
  },
};

const geofenceOutlineStyle = {
  id: "geofence-outline",
  type: "line" as const,
  paint: {
    "line-color": "#3B82F6",
    "line-width": 2,
    "line-dasharray": [2, 2],
  },
};

// Generate circle polygon from center and radius
function createCirclePolygon(
  center: { lat: number; lng: number },
  radiusMeters: number,
  points: number = 64,
): GeoJSON.Polygon {
  const coords: [number, number][] = [];
  const earthRadius = 6371000; // meters

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);

    const lat = center.lat + (dy / earthRadius) * (180 / Math.PI);
    const lng =
      center.lng + (dx / (earthRadius * Math.cos((center.lat * Math.PI) / 180))) * (180 / Math.PI);

    coords.push([lng, lat]);
  }
  // Close the polygon
  coords.push(coords[0]);

  return {
    type: "Polygon",
    coordinates: [coords],
  };
}

export function LocationMapView({
  tags,
  selectedTagId,
  onMarkerClick,
  onBoundsChange,
}: LocationMapViewProps) {
  const mapRef = React.useRef<MapRef>(null);
  const [viewState, setViewState] = React.useState(DEFAULT_VIEW_STATE);
  const [popupInfo, setPopupInfo] = React.useState<ResourceMapTag | null>(null);

  // Find selected tag
  const selectedTag = tags.find((t) => t.id === selectedTagId);

  // Generate GeoJSON for geofences
  const geofenceGeoJson = React.useMemo(() => {
    const features: GeoJSON.Feature[] = [];

    tags.forEach((tag) => {
      if (tag.locationMetadata?.geofence) {
        const geofence = tag.locationMetadata.geofence;

        if (geofence.type === "CIRCLE" && geofence.center && geofence.radiusMeters) {
          features.push({
            type: "Feature",
            properties: { id: tag.id, name: tag.value },
            geometry: createCirclePolygon(
              { lat: geofence.center.lat, lng: geofence.center.lng },
              geofence.radiusMeters,
            ),
          });
        } else if (geofence.type === "POLYGON" && geofence.points && geofence.points.length >= 3) {
          features.push({
            type: "Feature",
            properties: { id: tag.id, name: tag.value },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  ...geofence.points.map((p) => [p.lng, p.lat] as [number, number]),
                  [geofence.points[0].lng, geofence.points[0].lat] as [number, number],
                ],
              ],
            },
          });
        }
      }
    });

    return {
      type: "FeatureCollection" as const,
      features,
    };
  }, [tags]);

  // Center map on selected tag
  React.useEffect(() => {
    if (selectedTag?.location && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedTag.location.lng, selectedTag.location.lat],
        zoom: 14,
        duration: 1000,
      });
    }
  }, [selectedTag]);

  // Fit bounds to all markers
  const handleFitBounds = () => {
    if (tags.length === 0 || !mapRef.current) return;

    const lngs = tags.map((t) => t.location?.lng).filter(Boolean) as number[];
    const lats = tags.map((t) => t.location?.lat).filter(Boolean) as number[];

    if (lngs.length === 0) return;

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    mapRef.current.fitBounds(
      [
        [minLng - 0.1, minLat - 0.1],
        [maxLng + 0.1, maxLat + 0.1],
      ],
      { padding: 50, duration: 1000 },
    );
  };

  // Report bounds change
  const handleMoveEnd = () => {
    if (!mapRef.current || !onBoundsChange) return;

    const bounds = mapRef.current.getBounds();
    if (bounds) {
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    }
  };

  if (tags.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
        <div className="text-4xl mb-3">🗺️</div>
        <p className="text-sm font-medium">No locations with coordinates</p>
        <p className="text-xs text-gray-400 mt-1">Add location data to see markers on the map</p>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        mapStyle={MAPBOX_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {/* Navigation Controls */}
        <NavigationControl position="bottom-right" />
        <GeolocateControl position="bottom-right" />

        {/* Geofence Layer */}
        {geofenceGeoJson.features.length > 0 && (
          <Source id="geofences" type="geojson" data={geofenceGeoJson}>
            <Layer {...geofenceLayerStyle} />
            <Layer {...geofenceOutlineStyle} />
          </Source>
        )}

        {/* Markers */}
        {tags.map((tag) => {
          if (!tag.location?.lat || !tag.location?.lng) return null;

          const isSelected = selectedTagId === tag.id;

          return (
            <Marker
              key={tag.id}
              longitude={tag.location.lng}
              latitude={tag.location.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onMarkerClick(tag.id);
                setPopupInfo(tag);
              }}
            >
              <div
                className={`
                  cursor-pointer transform transition-transform duration-200
                  ${isSelected ? "scale-125" : "hover:scale-110"}
                `}
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center shadow-lg
                    ${isSelected ? "bg-blue-600 ring-4 ring-blue-200" : "bg-blue-500"}
                  `}
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                {/* Pin shadow */}
                <div
                  className={`
                    absolute -bottom-1 left-1/2 -translate-x-1/2
                    w-2 h-2 bg-black/20 rounded-full blur-sm
                  `}
                />
              </div>
            </Marker>
          );
        })}

        {/* Popup */}
        {popupInfo && popupInfo.location && (
          <Popup
            longitude={popupInfo.location.lng}
            latitude={popupInfo.location.lat}
            anchor="bottom"
            offset={[0, -35]}
            closeOnClick={false}
            onClose={() => setPopupInfo(null)}
            className="location-popup"
          >
            <div className="p-2 min-w-[150px]">
              <h3 className="font-semibold text-gray-900 text-sm">{popupInfo.value}</h3>
              {popupInfo.path.length > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  {popupInfo.path.slice(0, -1).join(" › ")}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    onMarkerClick(popupInfo.id);
                    setPopupInfo(null);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Custom Controls Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {/* Fit All Button */}
        <button
          onClick={handleFitBounds}
          className="bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
          title="Fit all markers"
        >
          <Maximize2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs">
        <div className="font-semibold text-gray-700 mb-2">Legend</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span className="text-gray-600">Location</span>
        </div>
        {geofenceGeoJson.features.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-dashed border-blue-500 bg-blue-500/15" />
            <span className="text-gray-600">Geofence</span>
          </div>
        )}
      </div>

      {/* Selected Tag Info */}
      {selectedTag && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md p-3 max-w-[200px]">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Selected</div>
          <div className="font-semibold text-gray-900 text-sm truncate">{selectedTag.value}</div>
          {selectedTag.location && (
            <div className="text-xs text-gray-500 mt-1">
              {selectedTag.location.lat.toFixed(4)}, {selectedTag.location.lng.toFixed(4)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
