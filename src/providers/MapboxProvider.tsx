"use client";

import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

// Mapbox access token
const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoidW5kZXJ0aGVtb3NzIiwiYSI6ImNtajI1Y2Z3ejBxYzQzZXEwa3YwZG91cTkifQ.KKHGJ-ZS7ZYnhMnHoxmAxw";

// Default map style
const DEFAULT_MAP_STYLE = "mapbox://styles/mapbox/light-v11";

interface MapboxContextType {
  accessToken: string;
  mapStyle: string;
  isReady: boolean;
  error: Error | null;
}

const MapboxContext = createContext<MapboxContextType | undefined>(undefined);

interface MapboxProviderProps {
  children: ReactNode;
  accessToken?: string;
  mapStyle?: string;
}

export function MapboxProvider({
  children,
  accessToken = MAPBOX_ACCESS_TOKEN,
  mapStyle = DEFAULT_MAP_STYLE,
}: MapboxProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Dynamically load Mapbox GL JS
    const loadMapbox = async () => {
      try {
        // Check if mapbox-gl is already loaded
        if ((window as unknown as { mapboxgl?: unknown }).mapboxgl) {
          setIsReady(true);
          return;
        }

        // Load Mapbox GL CSS
        const linkEl = document.createElement("link");
        linkEl.rel = "stylesheet";
        linkEl.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css";
        document.head.appendChild(linkEl);

        // Load Mapbox GL JS
        const scriptEl = document.createElement("script");
        scriptEl.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js";
        scriptEl.async = true;
        scriptEl.onload = () => {
          // Set access token
          const mapboxgl = (window as unknown as { mapboxgl: { accessToken: string } }).mapboxgl;
          if (mapboxgl) {
            mapboxgl.accessToken = accessToken;
          }
          setIsReady(true);
        };
        scriptEl.onerror = () => {
          setError(new Error("Failed to load Mapbox GL JS"));
        };
        document.head.appendChild(scriptEl);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load Mapbox"));
      }
    };

    if (!accessToken) {
      setError(new Error("Mapbox access token is required"));
      return;
    }

    loadMapbox();
  }, [accessToken]);

  return (
    <MapboxContext.Provider
      value={{
        accessToken,
        mapStyle,
        isReady,
        error,
      }}
    >
      {children}
    </MapboxContext.Provider>
  );
}

// Hook to use Mapbox context
export function useMapbox() {
  const context = useContext(MapboxContext);
  if (context === undefined) {
    throw new Error("useMapbox must be used within a MapboxProvider");
  }

  return {
    accessToken: context.accessToken,
    mapStyle: context.mapStyle,
    isReady: context.isReady,
    isLoading: !context.isReady && !context.error,
    error: context.error,
  };
}

// Export the default token for direct use if needed
export const MAPBOX_TOKEN = MAPBOX_ACCESS_TOKEN;
export const MAPBOX_STYLE = DEFAULT_MAP_STYLE;
