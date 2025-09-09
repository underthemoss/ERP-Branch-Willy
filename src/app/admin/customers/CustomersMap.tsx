"use client";

import { MarkerClusterer, SuperClusterAlgorithm } from "@googlemaps/markerclusterer";
import { EmailOutlined, LocationOnOutlined, PersonOutlined } from "@mui/icons-material";
import { Box, Button, Card, Chip, Typography } from "@mui/joy";
import { GoogleMap, InfoWindow, LoadScript } from "@react-google-maps/api";
import { useCallback, useEffect, useRef, useState } from "react";
import "./CustomersMap.css";

// Google Maps API Key and Map ID from environment variables
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const GOOGLE_MAPS_MAP_ID = "112d521aecda4dd8bcda7b92";

// Libraries to load
const libraries: ("marker" | "places" | "drawing" | "geometry" | "visualization")[] = ["marker"];

// Map container style
const mapContainerStyle = {
  width: "100%",
  height: "calc(100vh - 250px)",
};

// Map center (US)
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

// Custom AdvancedMarker component with avatar style
interface AdvancedMarkerProps {
  position: google.maps.LatLngLiteral;
  map: google.maps.Map | null;
  customer: any;
  onClick: () => void;
}

// Create advanced marker function
const createAdvancedMarker = (
  position: google.maps.LatLngLiteral,
  customer: any,
  onClick: () => void,
): google.maps.marker.AdvancedMarkerElement => {
  // Create custom avatar HTML element
  const avatarElement = document.createElement("div");
  avatarElement.className = "customer-avatar-marker";
  avatarElement.style.setProperty("--status-color", getMarkerColor(customer.status));

  // Create the avatar HTML structure
  avatarElement.innerHTML = `
    <div class="avatar-container">
      <div class="avatar-circle">
        <span class="avatar-initials">${getInitials(customer.name)}</span>
      </div>
      <div class="avatar-pointer"></div>
    </div>
  `;

  // Add hover effect
  avatarElement.addEventListener("mouseenter", () => {
    avatarElement.classList.add("hover");
  });

  avatarElement.addEventListener("mouseleave", () => {
    avatarElement.classList.remove("hover");
  });

  // Create the advanced marker with custom HTML content
  const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
    position,
    content: avatarElement,
    title: customer.name,
  });

  // Add click listener
  advancedMarker.addListener("click", onClick);

  return advancedMarker;
};

// Custom cluster renderer
const createClusterRenderer = () => {
  return {
    render: ({ count, position }: any, stats: any) => {
      // Determine cluster size and color based on count
      const color = count > 50 ? "#ff5722" : count > 20 ? "#ff9800" : "#2196f3";
      const size = count > 50 ? 56 : count > 20 ? 48 : 40;

      // Create cluster HTML element
      const clusterElement = document.createElement("div");
      clusterElement.className = "cluster-marker";
      clusterElement.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size > 48 ? "16px" : "14px"};
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.3s ease;
      `;

      clusterElement.innerHTML = `<span>${count}</span>`;

      // Add hover effect
      clusterElement.addEventListener("mouseenter", () => {
        clusterElement.style.transform = "scale(1.1)";
        clusterElement.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
      });

      clusterElement.addEventListener("mouseleave", () => {
        clusterElement.style.transform = "scale(1)";
        clusterElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
      });

      // Return an AdvancedMarkerElement for the cluster
      return new google.maps.marker.AdvancedMarkerElement({
        position,
        content: clusterElement,
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
      });
    },
  };
};

// Get marker color based on status
const getMarkerColor = (status: string) => {
  const colors: { [key: string]: string } = {
    active: "#4CAF50",
    trial: "#2196F3",
    inactive: "#F44336",
  };
  return colors[status] || "#9E9E9E";
};

// Get status color for chips
const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "success";
    case "trial":
      return "primary";
    case "inactive":
      return "danger";
    default:
      return "neutral";
  }
};

interface CustomersMapProps {
  customers: Array<{
    id: string;
    name: string;
    contact: string;
    email: string;
    phone: string;
    status: string;
    plan: string;
    users: number;
    revenue: string;
    created: string;
    lastActive: string;
    address: string;
    lat: number;
    lng: number;
  }>;
  onViewDetails: (customer: any) => void;
}

export default function CustomersMap({ customers, onViewDetails }: CustomersMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Initialize clustering when map and customers are ready
  useEffect(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Clean up existing markers and clusterer
    if (clusterer) {
      clusterer.clearMarkers();
      clusterer.setMap(null);
    }
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = [];

    // Create markers for all customers
    const markers = customers.map((customer) => {
      const marker = createAdvancedMarker({ lat: customer.lat, lng: customer.lng }, customer, () =>
        setSelectedMarker(customer),
      );
      return marker;
    });

    markersRef.current = markers;

    // Create and configure the clusterer with advanced options
    const newClusterer = new MarkerClusterer({
      map,
      markers,
      renderer: createClusterRenderer(),
      algorithm: new SuperClusterAlgorithm({
        radius: 100, // Cluster radius in pixels
        maxZoom: 14, // Max zoom level to cluster
        minPoints: 2, // Minimum points to form a cluster
      }),
      onClusterClick: (event: any, cluster: any, map: google.maps.Map) => {
        // Zoom into cluster on click
        const bounds = new google.maps.LatLngBounds();
        cluster.markers.forEach((marker: any) => {
          bounds.extend(marker.position);
        });
        map.fitBounds(bounds);
        map.setZoom(Math.min(map.getZoom()! + 2, 16));
      },
    });

    setClusterer(newClusterer);

    // Cleanup on unmount
    return () => {
      if (newClusterer) {
        newClusterer.clearMarkers();
        newClusterer.setMap(null);
      }
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];
    };
  }, [map, customers]);

  return (
    <Card sx={{ p: 0, height: "calc(100vh - 250px)" }}>
      {!GOOGLE_MAPS_API_KEY ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            bgcolor: "background.level1",
          }}
        >
          <LocationOnOutlined sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography level="h4" sx={{ mb: 1 }}>
            Map Configuration Required
          </Typography>
          <Typography
            level="body-md"
            sx={{ color: "text.secondary", textAlign: "center", maxWidth: 400 }}
          >
            The map feature is not currently configured. Please contact your system administrator to
            enable this feature.
          </Typography>
        </Box>
      ) : (
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={defaultCenter}
            zoom={4}
            onLoad={onMapLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: true,
              mapId: GOOGLE_MAPS_MAP_ID,
            }}
          >
            {/* Info Window */}
            {selectedMarker && (
              <InfoWindow
                position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <Box sx={{ p: 1, minWidth: 250 }}>
                  <Typography level="title-md" sx={{ mb: 1 }}>
                    {selectedMarker.name}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Chip size="sm" color={getStatusColor(selectedMarker.status)} variant="soft">
                      {selectedMarker.status}
                    </Chip>
                    <Typography level="body-sm">{selectedMarker.plan}</Typography>
                  </Box>
                  <Typography level="body-sm" sx={{ mb: 0.5 }}>
                    <PersonOutlined sx={{ fontSize: 14, mr: 0.5 }} />
                    {selectedMarker.contact}
                  </Typography>
                  <Typography level="body-sm" sx={{ mb: 0.5 }}>
                    <EmailOutlined sx={{ fontSize: 14, mr: 0.5 }} />
                    {selectedMarker.email}
                  </Typography>
                  <Typography level="body-sm" sx={{ mb: 1 }}>
                    <LocationOnOutlined sx={{ fontSize: 14, mr: 0.5 }} />
                    {selectedMarker.address}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button size="sm" variant="soft" onClick={() => onViewDetails(selectedMarker)}>
                      View Details
                    </Button>
                    <Button size="sm" variant="outlined">
                      Edit
                    </Button>
                  </Box>
                </Box>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      )}
    </Card>
  );
}
