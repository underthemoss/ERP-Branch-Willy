"use client";

import { LoadScript } from "@react-google-maps/api";
import React, { createContext, ReactNode, useCallback, useContext, useState } from "react";

// Libraries to load for Google Maps
const GOOGLE_MAPS_LIBRARIES: ("marker" | "places" | "drawing" | "geometry" | "visualization")[] = [
  "marker",
  "places",
];

// Default Map ID for advanced markers
const GOOGLE_MAPS_MAP_ID = "112d521aecda4dd8bcda7b92";

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
  mapId: string;
  apiKey: string;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

interface GoogleMapsProviderProps {
  children: ReactNode;
  apiKey: string;
}

export function GoogleMapsProvider({ children, apiKey }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | undefined>(undefined);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    console.log("Google Maps scripts loaded successfully");
  }, []);

  const handleError = useCallback((error: Error) => {
    setLoadError(error);
    console.error("Error loading Google Maps scripts:", error);
  }, []);

  // If no API key is provided, render children with error context
  if (!apiKey) {
    return (
      <GoogleMapsContext.Provider
        value={{
          isLoaded: false,
          loadError: new Error("Google Maps API key is not configured"),
          mapId: GOOGLE_MAPS_MAP_ID,
          apiKey: "",
        }}
      >
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      libraries={GOOGLE_MAPS_LIBRARIES}
      onLoad={handleLoad}
      onError={handleError}
      loadingElement={<div>Loading Google Maps...</div>}
    >
      <GoogleMapsContext.Provider
        value={{
          isLoaded,
          loadError,
          mapId: GOOGLE_MAPS_MAP_ID,
          apiKey,
        }}
      >
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
  );
}

// Hook to use Google Maps context with all status information
export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }

  // Compute derived states for convenience
  const isReady = context.isLoaded && !context.loadError;
  const isLoading = !context.isLoaded && !context.loadError;

  return {
    // Configuration
    apiKey: context.apiKey,
    mapId: context.mapId,

    // Status flags
    isReady,
    isLoading,
    error: context.loadError,

    // Raw state if needed
    isLoaded: context.isLoaded,
  };
}
