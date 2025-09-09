"use client";

import { LocationOnOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useCallback, useEffect, useState } from "react";

// Google Maps API Key from environment variables
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Libraries to load
const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

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

// Helper function to get initials from name
const getInitials = (name: string): string => {
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

interface BusinessLocationMapProps {
  businessName: string;
  address: string;
}

// Geocoding cache to avoid repeated API calls
const geocodeCache = new Map<string, google.maps.LatLngLiteral>();

export default function BusinessLocationMap({ businessName, address }: BusinessLocationMapProps) {
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  // Use the useJsApiLoader hook for better loading management
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Use Places API to search for the address when script is loaded
  useEffect(() => {
    if (!address || !GOOGLE_MAPS_API_KEY || !isLoaded) {
      return;
    }

    // Check cache first
    if (geocodeCache.has(address)) {
      const cached = geocodeCache.get(address)!;
      setMapCenter(cached);
      return;
    }

    // Use Places API to find the address
    const findPlace = async () => {
      try {
        if (!window.google?.maps?.places) {
          console.error("Google Maps Places API not available");
          setGeocodeError("Map service not available");
          return;
        }

        // Create a PlacesService using a temporary div element
        const service = new google.maps.places.PlacesService(document.createElement("div"));

        // Search for the address using findPlaceFromQuery
        const request: google.maps.places.FindPlaceFromQueryRequest = {
          query: address,
          fields: ["geometry", "formatted_address", "place_id"],
        };

        service.findPlaceFromQuery(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            const place = results[0];
            if (place.geometry?.location) {
              const location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              };

              // Cache the result
              geocodeCache.set(address, location);

              setMapCenter(location);
              setGeocodeError(null);
            } else {
              setGeocodeError("Location not found for this address");
            }
          } else {
            console.error("Places search failed:", status, "for address:", address);
            // If Places API fails, show the address but no map
            setGeocodeError("Unable to locate address on map");
          }
        });
      } catch (error) {
        console.error("Error finding place:", error);
        setGeocodeError("Error loading map location");
      }
    };

    findPlace();
  }, [address, isLoaded]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Location
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
          <LocationOnOutlined sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Map feature not configured
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (!address) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Location
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
          <LocationOnOutlined sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No address available
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Location
      </Typography>

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
          <LocationOnOutlined sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Error loading map
          </Typography>
        </Box>
      ) : geocodeError ? (
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
            <LocationOnOutlined sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {geocodeError}
            </Typography>
          </Box>
          <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Address:</strong>
            </Typography>
            <Typography variant="body2">{address}</Typography>
          </Box>
        </Box>
      ) : (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter || defaultCenter}
          zoom={mapCenter ? 15 : 4}
          onLoad={onMapLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {mapCenter && (
            <>
              <Marker position={mapCenter} onClick={() => setShowInfoWindow(true)} />

              {showInfoWindow && (
                <InfoWindow position={mapCenter} onCloseClick={() => setShowInfoWindow(false)}>
                  <Box sx={{ p: 1, minWidth: 200 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {businessName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <LocationOnOutlined sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
                      {address}
                    </Typography>
                  </Box>
                </InfoWindow>
              )}
            </>
          )}
        </GoogleMap>
      )}
    </Paper>
  );
}
