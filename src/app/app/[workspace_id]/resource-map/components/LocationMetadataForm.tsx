"use client";

import { MAPBOX_STYLE, MAPBOX_TOKEN } from "@/providers/MapboxProvider";
import {
  Circle,
  Hash,
  Hexagon,
  MapPin,
  Navigation,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import * as React from "react";
import Map, { Marker, NavigationControl, Source, Layer } from "react-map-gl/mapbox";
import type { GeofenceType, LatLng, LocationMetadata, LocationMetadataKind } from "./types";

interface LocationMetadataFormProps {
  value: LocationMetadata | null;
  onChange: (metadata: LocationMetadata | null) => void;
}

const LOCATION_TYPE_OPTIONS: {
  value: LocationMetadataKind;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "ADDRESS", label: "Address", icon: <MapPin className="w-4 h-4" /> },
  { value: "LAT_LNG", label: "Coordinates", icon: <Navigation className="w-4 h-4" /> },
  { value: "PLUS_CODE", label: "Plus Code", icon: <Hash className="w-4 h-4" /> },
  { value: "GEOFENCE", label: "Geofence", icon: <Hexagon className="w-4 h-4" /> },
];

// Default center (USA center)
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };
const DEFAULT_ZOOM = 4;

export function LocationMetadataForm({ value, onChange }: LocationMetadataFormProps) {
  const [locationType, setLocationType] = React.useState<LocationMetadataKind | "">(
    value?.kind || "",
  );

  const handleTypeChange = (kind: LocationMetadataKind | "") => {
    setLocationType(kind);
    if (!kind) {
      onChange(null);
      return;
    }

    // Initialize with default structure based on type
    switch (kind) {
      case "ADDRESS":
        onChange({
          kind,
          address: {
            line1: "",
            line2: "",
            city: "",
            state: "",
            postalCode: "",
            country: "USA",
          },
        });
        break;
      case "LAT_LNG":
        onChange({
          kind,
          latLng: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng },
        });
        break;
      case "PLUS_CODE":
        onChange({
          kind,
          plusCode: { code: "" },
        });
        break;
      case "GEOFENCE":
        onChange({
          kind,
          geofence: {
            type: "CIRCLE",
            center: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng },
            radiusMeters: 500,
          },
        });
        break;
    }
  };

  return (
    <div className="space-y-4">
      {/* Location Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Location Type</label>
        <div className="grid grid-cols-2 gap-2">
          {LOCATION_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTypeChange(option.value)}
              className={`
                flex items-center gap-2 p-3 rounded-lg border-2 transition-colors text-sm
                ${
                  locationType === option.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }
              `}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
        {locationType && (
          <button
            onClick={() => handleTypeChange("")}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Clear location data
          </button>
        )}
      </div>

      {/* Type-specific Forms */}
      {locationType === "ADDRESS" && value?.address && (
        <AddressForm
          value={value.address}
          onChange={(address) => onChange({ ...value, address })}
        />
      )}

      {locationType === "LAT_LNG" && value?.latLng && (
        <LatLngForm value={value.latLng} onChange={(latLng) => onChange({ ...value, latLng })} />
      )}

      {locationType === "PLUS_CODE" && value?.plusCode && (
        <PlusCodeForm
          value={value.plusCode}
          onChange={(plusCode) => onChange({ ...value, plusCode })}
        />
      )}

      {locationType === "GEOFENCE" && value?.geofence && (
        <GeofenceForm
          value={value.geofence}
          onChange={(geofence) => onChange({ ...value, geofence })}
        />
      )}
    </div>
  );
}

// Address Form with Mapbox Geocoding
function AddressForm({
  value,
  onChange,
}: {
  value: NonNullable<LocationMetadata["address"]>;
  onChange: (value: NonNullable<LocationMetadata["address"]>) => void;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<
    Array<{
      id: string;
      place_name: string;
      center: [number, number];
      context?: Array<{ id: string; text: string }>;
      properties?: { address?: string };
      text?: string;
    }>
  >([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Search for addresses using Mapbox Geocoding API
  const searchAddresses = React.useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=US&types=address,place&limit=5`,
      );
      const data = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  React.useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchAddresses(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchAddresses]);

  const handleSelectSuggestion = (suggestion: (typeof suggestions)[0]) => {
    // Parse address components from Mapbox response
    const context = suggestion.context || [];
    const findContext = (prefix: string) =>
      context.find((c) => c.id.startsWith(prefix))?.text || "";

    onChange({
      line1: suggestion.properties?.address || suggestion.text || "",
      line2: "",
      city: findContext("place"),
      state: findContext("region"),
      postalCode: findContext("postcode"),
      country: findContext("country") || "USA",
      placeId: suggestion.id,
      latLng: {
        lat: suggestion.center[1],
        lng: suggestion.center[0],
      },
    });

    setSearchQuery(suggestion.place_name);
    setShowSuggestions(false);
  };

  // Get map center from latLng if available
  const mapCenter = value.latLng || DEFAULT_CENTER;

  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
      {/* Address Search */}
      <div className="relative">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Search Address
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Start typing an address..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{suggestion.place_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Preview */}
      {value.latLng && (
        <div className="rounded-lg overflow-hidden border border-gray-200 h-48">
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: mapCenter.lng,
              latitude: mapCenter.lat,
              zoom: 14,
            }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={MAPBOX_STYLE}
            interactive={false}
          >
            <Marker longitude={mapCenter.lng} latitude={mapCenter.lat}>
              <div className="bg-blue-500 p-1.5 rounded-full shadow-lg">
                <MapPin className="w-4 h-4 text-white" />
              </div>
            </Marker>
          </Map>
        </div>
      )}

      {/* Manual Address Fields */}
      <div className="pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Or enter address manually:</p>
        <div className="space-y-2">
          <input
            type="text"
            value={value.line1 || ""}
            onChange={(e) => onChange({ ...value, line1: e.target.value })}
            placeholder="Address Line 1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="text"
            value={value.line2 || ""}
            onChange={(e) => onChange({ ...value, line2: e.target.value })}
            placeholder="Address Line 2"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={value.city || ""}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
              placeholder="City"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              value={value.state || ""}
              onChange={(e) => onChange({ ...value, state: e.target.value })}
              placeholder="State"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={value.postalCode || ""}
              onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
              placeholder="Postal Code"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="text"
              value={value.country || ""}
              onChange={(e) => onChange({ ...value, country: e.target.value })}
              placeholder="Country"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Lat/Lng Form with Interactive Map Picker
function LatLngForm({
  value,
  onChange,
}: {
  value: NonNullable<LocationMetadata["latLng"]>;
  onChange: (value: NonNullable<LocationMetadata["latLng"]>) => void;
}) {
  const [viewState, setViewState] = React.useState({
    longitude: value.lng || DEFAULT_CENTER.lng,
    latitude: value.lat || DEFAULT_CENTER.lat,
    zoom: value.lat && value.lng ? 12 : DEFAULT_ZOOM,
  });

  const handleMapClick = (event: { lngLat: { lng: number; lat: number } }) => {
    onChange({
      ...value,
      lat: event.lngLat.lat,
      lng: event.lngLat.lng,
    });
  };

  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
      {/* Interactive Map */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Click on the map to set coordinates
        </label>
        <div className="rounded-lg overflow-hidden border border-gray-200 h-64">
          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            onClick={handleMapClick}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: "100%", height: "100%" }}
            mapStyle={MAPBOX_STYLE}
            cursor="crosshair"
          >
            <NavigationControl position="top-right" />
            {value.lat && value.lng && (
              <Marker longitude={value.lng} latitude={value.lat} draggable onDragEnd={(e) => {
                onChange({
                  ...value,
                  lat: e.lngLat.lat,
                  lng: e.lngLat.lng,
                });
              }}>
                <div className="bg-red-500 p-2 rounded-full shadow-lg cursor-grab active:cursor-grabbing">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
              </Marker>
            )}
          </Map>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          💡 Click anywhere to set location, or drag the marker to adjust
        </p>
      </div>

      {/* Coordinate Fields */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={value.lat}
            onChange={(e) => onChange({ ...value, lat: parseFloat(e.target.value) || 0 })}
            placeholder="38.6270"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={value.lng}
            onChange={(e) => onChange({ ...value, lng: parseFloat(e.target.value) || 0 })}
            placeholder="-90.1994"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
          />
        </div>
      </div>

      {/* Accuracy Field */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Accuracy (meters, optional)
        </label>
        <input
          type="number"
          value={value.accuracyMeters || ""}
          onChange={(e) =>
            onChange({
              ...value,
              accuracyMeters: e.target.value ? parseFloat(e.target.value) : undefined,
            })
          }
          placeholder="10"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      {/* Use Current Location */}
      <button
        type="button"
        onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const newLat = position.coords.latitude;
                const newLng = position.coords.longitude;
                onChange({
                  lat: newLat,
                  lng: newLng,
                  accuracyMeters: position.coords.accuracy,
                });
                setViewState({
                  ...viewState,
                  latitude: newLat,
                  longitude: newLng,
                  zoom: 14,
                });
              },
              (error) => {
                console.error("Geolocation error:", error);
                alert("Could not get your location. Please select on map.");
              },
            );
          } else {
            alert("Geolocation is not supported by your browser");
          }
        }}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
      >
        <Navigation className="w-4 h-4" />
        Use current location
      </button>
    </div>
  );
}

// Plus Code Form
function PlusCodeForm({
  value,
  onChange,
}: {
  value: NonNullable<LocationMetadata["plusCode"]>;
  onChange: (value: NonNullable<LocationMetadata["plusCode"]>) => void;
}) {
  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Plus Code</label>
        <input
          type="text"
          value={value.code}
          onChange={(e) => onChange({ ...value, code: e.target.value.toUpperCase() })}
          placeholder="8FW4V75V+RVW"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter a{" "}
          <a
            href="https://maps.google.com/pluscodes/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Plus Code
          </a>{" "}
          from Google Maps
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Local Area (optional)
        </label>
        <input
          type="text"
          value={value.localArea || ""}
          onChange={(e) => onChange({ ...value, localArea: e.target.value })}
          placeholder="St. Louis, MO"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

// Geofence Form with Interactive Map
function GeofenceForm({
  value,
  onChange,
}: {
  value: NonNullable<LocationMetadata["geofence"]>;
  onChange: (value: NonNullable<LocationMetadata["geofence"]>) => void;
}) {
  const [geofenceType, setGeofenceType] = React.useState<GeofenceType>(value.type);
  const center = value.center || DEFAULT_CENTER;

  const [viewState, setViewState] = React.useState({
    longitude: center.lng,
    latitude: center.lat,
    zoom: 12,
  });

  const handleTypeChange = (type: GeofenceType) => {
    setGeofenceType(type);
    if (type === "CIRCLE") {
      onChange({
        type,
        center: value.center || { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng },
        radiusMeters: value.radiusMeters || 500,
      });
    } else {
      // Create a default polygon around the center
      const centerPoint = value.center || DEFAULT_CENTER;
      const offset = 0.005; // ~500m at equator
      onChange({
        type,
        points: value.points || [
          { lat: centerPoint.lat + offset, lng: centerPoint.lng - offset },
          { lat: centerPoint.lat + offset, lng: centerPoint.lng + offset },
          { lat: centerPoint.lat - offset, lng: centerPoint.lng + offset },
          { lat: centerPoint.lat - offset, lng: centerPoint.lng - offset },
        ],
      });
    }
  };

  const handleMapClick = (event: { lngLat: { lng: number; lat: number } }) => {
    if (geofenceType === "CIRCLE") {
      onChange({
        ...value,
        center: { lat: event.lngLat.lat, lng: event.lngLat.lng },
      });
    } else {
      // Add point to polygon
      const newPoints = [...(value.points || []), { lat: event.lngLat.lat, lng: event.lngLat.lng }];
      onChange({ ...value, points: newPoints });
    }
  };

  // Generate circle GeoJSON
  const circleGeoJson = React.useMemo(() => {
    if (geofenceType !== "CIRCLE" || !value.center) return null;
    const points = 64;
    const km = (value.radiusMeters || 100) / 1000;
    const coords: [number, number][] = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = km / (111.32 * Math.cos((value.center.lat * Math.PI) / 180));
      const dy = km / 110.574;
      coords.push([value.center.lng + dx * Math.cos(angle), value.center.lat + dy * Math.sin(angle)]);
    }
    return {
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [coords],
      },
      properties: {},
    };
  }, [geofenceType, value.center, value.radiusMeters]);

  // Generate polygon GeoJSON
  const polygonGeoJson = React.useMemo(() => {
    if (geofenceType !== "POLYGON" || !value.points || value.points.length < 3) return null;
    const coords: [number, number][] = value.points.map((p) => [p.lng, p.lat]);
    // Close the polygon
    if (coords.length > 0) {
      coords.push(coords[0]);
    }
    return {
      type: "Feature" as const,
      geometry: {
        type: "Polygon" as const,
        coordinates: [coords],
      },
      properties: {},
    };
  }, [geofenceType, value.points]);

  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
      {/* Geofence Type */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Geofence Type</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange("CIRCLE")}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border-2 text-sm ${
              geofenceType === "CIRCLE"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-600"
            }`}
          >
            <Circle className="w-4 h-4" />
            Circle
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("POLYGON")}
            className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border-2 text-sm ${
              geofenceType === "POLYGON"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-600"
            }`}
          >
            <Hexagon className="w-4 h-4" />
            Polygon
          </button>
        </div>
      </div>

      {/* Interactive Map */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          {geofenceType === "CIRCLE"
            ? "Click to set center, drag marker to adjust"
            : "Click to add polygon points"}
        </label>
        <div className="rounded-lg overflow-hidden border border-gray-200 h-64">
          <Map
            {...viewState}
            onMove={(evt) => setViewState(evt.viewState)}
            onClick={handleMapClick}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: "100%", height: "100%" }}
            mapStyle={MAPBOX_STYLE}
            cursor="crosshair"
          >
            <NavigationControl position="top-right" />

            {/* Circle visualization */}
            {geofenceType === "CIRCLE" && circleGeoJson && (
              <Source id="circle" type="geojson" data={circleGeoJson}>
                <Layer
                  id="circle-fill"
                  type="fill"
                  paint={{
                    "fill-color": "#3B82F6",
                    "fill-opacity": 0.2,
                  }}
                />
                <Layer
                  id="circle-stroke"
                  type="line"
                  paint={{
                    "line-color": "#3B82F6",
                    "line-width": 2,
                  }}
                />
              </Source>
            )}

            {/* Circle center marker */}
            {geofenceType === "CIRCLE" && value.center && (
              <Marker
                longitude={value.center.lng}
                latitude={value.center.lat}
                draggable
                onDragEnd={(e) => {
                  onChange({
                    ...value,
                    center: { lat: e.lngLat.lat, lng: e.lngLat.lng },
                  });
                }}
              >
                <div className="bg-blue-500 p-1.5 rounded-full shadow-lg cursor-grab active:cursor-grabbing">
                  <Circle className="w-4 h-4 text-white" />
                </div>
              </Marker>
            )}

            {/* Polygon visualization */}
            {geofenceType === "POLYGON" && polygonGeoJson && (
              <Source id="polygon" type="geojson" data={polygonGeoJson}>
                <Layer
                  id="polygon-fill"
                  type="fill"
                  paint={{
                    "fill-color": "#10B981",
                    "fill-opacity": 0.2,
                  }}
                />
                <Layer
                  id="polygon-stroke"
                  type="line"
                  paint={{
                    "line-color": "#10B981",
                    "line-width": 2,
                  }}
                />
              </Source>
            )}

            {/* Polygon point markers */}
            {geofenceType === "POLYGON" &&
              value.points?.map((point, index) => (
                <Marker
                  key={index}
                  longitude={point.lng}
                  latitude={point.lat}
                  draggable
                  onDragEnd={(e) => {
                    const newPoints = [...(value.points || [])];
                    newPoints[index] = { lat: e.lngLat.lat, lng: e.lngLat.lng };
                    onChange({ ...value, points: newPoints });
                  }}
                >
                  <div className="bg-emerald-500 w-4 h-4 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-[8px] text-white font-bold cursor-grab active:cursor-grabbing">
                    {index + 1}
                  </div>
                </Marker>
              ))}
          </Map>
        </div>
      </div>

      {/* Circle radius slider */}
      {geofenceType === "CIRCLE" && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Radius: {value.radiusMeters || 100}m
          </label>
          <input
            type="range"
            min="50"
            max="5000"
            step="50"
            value={value.radiusMeters || 100}
            onChange={(e) =>
              onChange({ ...value, radiusMeters: parseInt(e.target.value) })
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>50m</span>
            <span>5km</span>
          </div>
        </div>
      )}

      {/* Polygon points list */}
      {geofenceType === "POLYGON" && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-gray-600">
              Points ({value.points?.length || 0})
            </label>
            {(value.points?.length || 0) > 0 && (
              <button
                type="button"
                onClick={() => onChange({ ...value, points: [] })}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Clear all
              </button>
            )}
          </div>
          {(value.points?.length || 0) > 3 && (
            <p className="text-xs text-gray-500">
              Drag points on the map to adjust. Min 3 points required.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
