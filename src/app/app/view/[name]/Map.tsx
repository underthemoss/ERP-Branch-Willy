"use client";
import { ScatterplotLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { Box } from "@mui/joy";
import { Map } from "react-map-gl/maplibre";

export const MapView: React.FC<{
  locations: { lat: number; lng: number }[];
}> = ({ locations }) => {
  const scatterLayer = new ScatterplotLayer({
    id: "scatter-layer",
    data: locations.map((l) => ({ coordinates: [l.lat, l.lng] })),
    getPosition: (d) => d.coordinates,
    getFillColor: () => [255, 100, 0, 190], // Red points with some transparency
    getRadius: () => 5, // Radius in meters (adjust based on zoom level)
    pickable: true,
    radiusUnits: "meters",
    radiusMaxPixels: 15,
    radiusMinPixels: 4,
  });
  return (
    <Box
      width={"100%"}
      height={400}
      overflow={"hidden"}
      sx={{ position: "relative" }}
    >
      <DeckGL
        initialViewState={{
          longitude: -98,
          latitude: 39,
          zoom: 2,
          maxZoom: 20,
          pitch: 0,
        }}
        layers={[scatterLayer]}
        height={400}
        width={"100%"}
        controller
      >
        <Map
          reuseMaps
          attributionControl={false}
          mapStyle={
            "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
          }
        ></Map>
      </DeckGL>
    </Box>
  );
};
