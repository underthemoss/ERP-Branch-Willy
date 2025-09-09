"use client";

import { useGoogleMaps } from "@/providers/GoogleMapsProvider";
import { LocalShipping, LocationOn } from "@mui/icons-material";
import { Box, Chip, Paper, Typography } from "@mui/material";
import { GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import { useCallback, useEffect, useState } from "react";

// Map container style
const mapContainerStyle = {
  width: "100%",
  height: "350px",
};

// Default center (US)
const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795,
};

interface DeliveryLocation {
  id: string;
  address: string;
  itemDescription?: string;
  deliveryMethod?: string;
  deliveryDate?: string;
}

interface SalesOrderDeliveryMapProps {
  deliveryLocations: DeliveryLocation[];
}

// Geocoding cache to avoid repeated API calls
const geocodeCache = new Map<string, google.maps.LatLngLiteral>();

export default function SalesOrderDeliveryMap({ deliveryLocations }: SalesOrderDeliveryMapProps) {
  const [mapLocations, setMapLocations] = useState<
    Array<{
      id: string;
      address: string;
      lat: number;
      lng: number;
      itemDescription?: string;
      deliveryMethod?: string;
      deliveryDate?: string;
    }>
  >([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Use the Google Maps provider hook
  const { apiKey, isReady: isLoaded, error: loadError } = useGoogleMaps();

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Geocode all delivery locations when script is loaded
  useEffect(() => {
    if (!isLoaded || deliveryLocations.length === 0) {
      return;
    }

    const geocodeAddresses = async () => {
      const geocodedLocations = [];
      let hasErrors = false;

      for (const location of deliveryLocations) {
        if (!location.address) continue;

        // Check cache first
        if (geocodeCache.has(location.address)) {
          const cached = geocodeCache.get(location.address)!;
          geocodedLocations.push({
            ...location,
            lat: cached.lat,
            lng: cached.lng,
          });
          continue;
        }

        // Use Places API to find the address
        try {
          if (!window.google?.maps?.places) {
            console.error("Google Maps Places API not available");
            hasErrors = true;
            continue;
          }

          // Create a PlacesService using a temporary div element
          const service = new google.maps.places.PlacesService(document.createElement("div"));

          // Search for the address using findPlaceFromQuery
          const request: google.maps.places.FindPlaceFromQueryRequest = {
            query: location.address,
            fields: ["geometry", "formatted_address", "place_id"],
          };

          await new Promise<void>((resolve) => {
            service.findPlaceFromQuery(request, (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                const place = results[0];
                if (place.geometry?.location) {
                  const coords = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  };

                  // Cache the result
                  geocodeCache.set(location.address, coords);

                  geocodedLocations.push({
                    ...location,
                    ...coords,
                  });
                } else {
                  hasErrors = true;
                }
              } else {
                console.error("Places search failed for address:", location.address);
                hasErrors = true;
              }
              resolve();
            });
          });
        } catch (error) {
          console.error("Error finding place:", error);
          hasErrors = true;
        }
      }

      setMapLocations(geocodedLocations);
      if (hasErrors && geocodedLocations.length === 0) {
        setGeocodeError("Unable to locate delivery addresses on map");
      }

      // Adjust map bounds to show all markers
      if (map && geocodedLocations.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        geocodedLocations.forEach((loc) => {
          bounds.extend({ lat: loc.lat, lng: loc.lng });
        });
        map.fitBounds(bounds);

        // If only one location, set a reasonable zoom
        if (geocodedLocations.length === 1) {
          map.setZoom(15);
        }
      }
    };

    geocodeAddresses();
  }, [deliveryLocations, isLoaded, map]);

  if (!apiKey) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Delivery Locations
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 200,
            bgcolor: "grey.50",
            borderRadius: 1,
          }}
        >
          <LocationOn sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Map feature not configured
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (deliveryLocations.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Delivery Locations
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 200,
            bgcolor: "grey.50",
            borderRadius: 1,
          }}
        >
          <LocalShipping sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No delivery locations added yet
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Delivery Locations
      </Typography>

      {/* Show delivery count */}
      {mapLocations.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Chip
            size="small"
            label={`${mapLocations.length} ${mapLocations.length === 1 ? "location" : "locations"}`}
            color="primary"
            variant="outlined"
          />
        </Box>
      )}

      {!isLoaded ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 350,
            bgcolor: "grey.50",
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Loading map...
          </Typography>
        </Box>
      ) : loadError ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 200,
            bgcolor: "grey.50",
            borderRadius: 1,
          }}
        >
          <LocationOn sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Error loading map
          </Typography>
        </Box>
      ) : geocodeError && mapLocations.length === 0 ? (
        <Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 200,
              bgcolor: "grey.50",
              borderRadius: 1,
              mb: 2,
            }}
          >
            <LocationOn sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {geocodeError}
            </Typography>
          </Box>
          {/* List addresses that couldn't be mapped */}
          <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Delivery Addresses:</strong>
            </Typography>
            {deliveryLocations.map((loc, index) => (
              <Typography key={loc.id} variant="body2" sx={{ mb: 0.5 }}>
                {index + 1}. {loc.address}
              </Typography>
            ))}
          </Box>
        </Box>
      ) : (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={
            mapLocations.length > 0
              ? { lat: mapLocations[0].lat, lng: mapLocations[0].lng }
              : defaultCenter
          }
          zoom={mapLocations.length === 1 ? 15 : 10}
          onLoad={onMapLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {mapLocations.map((location, index) => (
            <Marker
              key={location.id}
              position={{ lat: location.lat, lng: location.lng }}
              onClick={() => setSelectedLocation(location.id)}
              label={{
                text: String(index + 1),
                color: "white",
                fontWeight: "bold",
              }}
            />
          ))}

          {selectedLocation && (
            <>
              {mapLocations
                .filter((loc) => loc.id === selectedLocation)
                .map((location, index) => (
                  <InfoWindow
                    key={location.id}
                    position={{ lat: location.lat, lng: location.lng }}
                    onCloseClick={() => setSelectedLocation(null)}
                  >
                    <Box sx={{ p: 1, minWidth: 200 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Delivery Location #{mapLocations.findIndex((l) => l.id === location.id) + 1}
                      </Typography>
                      {location.itemDescription && (
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Item:</strong> {location.itemDescription}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        <LocationOn sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
                        {location.address}
                      </Typography>
                      {location.deliveryMethod && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          <strong>Method:</strong> {location.deliveryMethod}
                        </Typography>
                      )}
                      {location.deliveryDate && (
                        <Typography variant="body2">
                          <strong>Date:</strong>{" "}
                          {new Date(location.deliveryDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </InfoWindow>
                ))}
            </>
          )}
        </GoogleMap>
      )}
    </Paper>
  );
}
