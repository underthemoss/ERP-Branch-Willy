"use client";
import { encodeUniversalQuery, UniversalQuery } from "@/lib/UniversalQuery";
import { DeckProps, WebMercatorViewport } from "@deck.gl/core";
import { ScatterplotLayer } from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import { Avatar, Box, Button, Card } from "@mui/joy";
import { usePathname, useRouter } from "next/navigation";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { useMemo, useState } from "react";
import AutoSizer from "react-virtualized-auto-sizer";

// import { Map, Marker } from "react-map-gl/maplibre";
import Map, {
  FullscreenControl,
  GeolocateControl,
  Marker,
  NavigationControl,
  ScaleControl,
  useControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { findEntities } from "@/db/mongoose";
import _ from "lodash";

function DeckGLOverlay(props: DeckProps & { interleaved: boolean }) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export const MapView: React.FC<{
  query: UniversalQuery;
  data: Awaited<ReturnType<typeof findEntities>>;
  children?: React.ReactElement;
}> = ({ data, query, children }) => {
  const locations = data.locations;

  const { push } = useRouter();
  const path = usePathname();
  const [bounds, setBounds] = useState<
    [[number, number], [number, number]] | null
  >(null);

  const isDirty = !!bounds;

  const initialBounds = useMemo(() => {
    if (!locations.length) return null;
    const lats = locations.map((l) => l.lat).sort((a, b) => a - b);
    const lngs = locations.map((l) => l.lng).sort((a, b) => a - b);
    const minLat = lats[0];
    const maxLat = lats[lats.length - 1];
    const minLng = lngs[0];
    const maxLng = lngs[lngs.length - 1];

    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
  }, [locations]);

  const initialViewState = useMemo(() => {
    const width = typeof window !== "undefined" ? window.innerWidth : 800;
    const height = 400;
    if (initialBounds) {
      const viewport = new WebMercatorViewport({ width, height });
      const { longitude, latitude, zoom } = viewport.fitBounds(
        initialBounds as any,
        { padding: 20 }
      );
      return { longitude, latitude, zoom, pitch: 0 };
    }
    return {
      longitude: -98,
      latitude: 39,
      zoom: 2,
      pitch: 0,
    };
  }, [initialBounds]);

  const layers = [
    new ScatterplotLayer({
      id: "scatter-layer",
      data: locations.map((l) => ({ coordinates: [l.lat, l.lng] })),
      getPosition: (d) => d.coordinates,
      getFillColor: () => [255, 100, 0, 190], // Red points with some transparency
      getRadius: () => 5, // Radius in meters (adjust based on zoom level)
      pickable: true,
      radiusUnits: "meters",
      radiusMaxPixels: 15,
      radiusMinPixels: 4,
      beforeId: "watername_ocean",
    }),
  ];

  return (
    <AutoSizer>
      {({ width, height }) => {
        return (
          <div style={{ position: "relative", width: width, height: height }}>
            <Map
              // reuseMaps
              initialViewState={initialViewState}
              mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
              attributionControl={false}
              onMove={(e) => {
                const bounds = e.target.getBounds();
                setBounds([
                  [bounds.getWest(), bounds.getNorth()],
                  [bounds.getEast(), bounds.getSouth()],
                ]);
              }}
              onBoxZoomEnd={(d) => {
                setBounds(null);
                setTimeout(() => {
                  const bounds = d.target.getBounds();
                  push(
                    path +
                      "?" +
                      encodeUniversalQuery({
                        ...query,
                        options: {
                          ...query.options,
                          skip: 0,
                        },
                        filter: {
                          ...query.filter,
                          "data.location": {
                            $geoWithin: {
                              $box: [
                                [bounds.getWest(), bounds.getNorth()],
                                [bounds.getEast(), bounds.getSouth()],
                              ],
                            },
                          },
                        },
                      })
                  );
                }, 300);
              }}
            >
              <GeolocateControl
                showUserLocation
                position="top-right"
                onGeolocate={(e) => {
                  console.log(e.coords);
                  push(
                    path +
                      "?" +
                      encodeUniversalQuery({
                        ...query,
                        filter: {
                          ...query.filter,
                          "data.location": {
                            $near: {
                              $geometry: {
                                type: "Point",
                                coordinates: [
                                  e.coords.longitude,
                                  e.coords.latitude,
                                ],
                              },
                              $maxDistance: 1000, // optional, in meters
                            },
                          },
                        },
                        options: {
                          ...query.options,
                          skip: 0,
                          sort: undefined,
                        },
                      })
                  );
                }}
              />
              <FullscreenControl position="top-right" />
              <ScaleControl position="bottom-right" />
              <NavigationControl position="bottom-right" />

              <DeckGLOverlay layers={layers} interleaved />
              {_.sortBy(
                data.results,
                (d: any) => d.data?.location?.longitude
              ).map((result, i) => {
                if (result.type === "asset" || result.type === "rental") {
                  const { lat, lng } = result.data.location || {};
                  if (!lat || !lng) return null;
                  return (
                    <Marker
                      key={result._id}
                      longitude={lat}
                      latitude={lng}
                      anchor="center"
                    >
                      {result.data.photo_filename && (
                        <Avatar
                          src={result.data.photo_filename}
                          style={{
                            height: 70,
                            width: 70,
                            border: "5px solid white",
                            outline: "2px solid gray",
                          }}
                        ></Avatar>
                      )}
                    </Marker>
                  );
                }
              })}
              <Box display={"flex"} p={1} gap={1}>
                <Box flex={1}></Box>
                <Box flex={1}>
                  {isDirty && (
                    <Button
                      variant="solid"
                      style={{ right: 0 }}
                      onClick={() => {
                        setBounds(null);
                        push(
                          path +
                            "?" +
                            encodeUniversalQuery({
                              ...query,
                              options: {
                                ...query.options,
                                skip: 0,
                              },
                              filter: {
                                ...query.filter,
                                "data.location": {
                                  $geoWithin: {
                                    $box: bounds,
                                  },
                                },
                              },
                            })
                        );
                      }}
                    >
                      Search this area
                    </Button>
                  )}
                </Box>
              </Box>
            </Map>
          </div>
        );
      }}
    </AutoSizer>
  );

  //   new MapboxOverlay();
  //   const scatterLayer = new ScatterplotLayer({
  //     id: "scatter-layer",
  //     data: locations.map((l) => ({ coordinates: [l.lat, l.lng] })),
  //     getPosition: (d) => d.coordinates,
  //     getFillColor: () => [255, 100, 0, 190], // Red points with some transparency
  //     getRadius: () => 5, // Radius in meters (adjust based on zoom level)
  //     pickable: true,
  //     radiusUnits: "meters",
  //     radiusMaxPixels: 15,
  //     radiusMinPixels: 4,
  //     beforeId: "watername_ocean",
  //   });

  //   const scatterLayer2 = new ScatterplotLayer({
  //     id: "scatter-layer-2",
  //     data: pin ? [pin] : [],
  //     getPosition: (d) => [d.lat, d.lng],
  //     getFillColor: () => [255, 100, 0, 190], // Red points with some transparency
  //     getRadius: () => 5, // Radius in meters (adjust based on zoom level)
  //     pickable: true,
  //     radiusUnits: "meters",
  //     radiusMaxPixels: 15,
  //     radiusMinPixels: 4,
  //   });

  //   const handleMapClick = (event: any) => {
  //     const [lng, lat] = event.coordinate;
  //     console.log({ lat, lng });

  //     setPin({
  //       lat: lat,
  //       lng: lng,
  //       options: { color: [0, 0, 255, 255], radius: 20 },
  //     });
  //   };

  //   console.log(pin);
  //   return (
  //     <Box
  //       overflow={"hidden"}
  //       sx={{ position: "fixed", width: "100%", height: "100%", left: 0, top: 0 }}
  //     >
  //       <Box
  //         position={"relative"}
  //         // display={"flex"}
  //         // flexDirection={"column"}
  //         height={400}
  //         zIndex={99999}
  //         sx={{ pointerEvents: "none" }}
  //       >
  //         <Box flex={1}></Box>
  //         <Box display={"flex"}>
  //           <Box flex={1}></Box>
  //           {state && isDirty && (
  //             <Box p={1} sx={{ pointerEvents: "all" }}>
  //               <Button
  //                 onClick={() => {
  //                   push(
  //                     path +
  //                       "?" +
  //                       encodeUniversalQuery({
  //                         ...query,
  //                         options: {
  //                           ...query.options,
  //                           skip: 0,
  //                         },
  //                         filter: {
  //                           ...query.filter,
  //                           "data.location": {
  //                             $geoWithin: {
  //                               $box: [
  //                                 [state[0], state[1]],
  //                                 [state[2], state[3]],
  //                               ],
  //                             },
  //                           },
  //                         },
  //                       })
  //                   );
  //                 }}
  //               >
  //                 Search this area
  //               </Button>
  //             </Box>
  //           )}
  //           {pin && (
  //             <Box
  //               position="absolute"
  //               bottom={76}
  //               left="50%"
  //               sx={{ transform: "translateX(-50%)" }}
  //             >
  //               <Button
  //                 onClick={() => {
  //                   push(
  //                     path +
  //                       "?" +
  //                       // Here you could encode your query with the pin’s bounding box or other options
  //                       "pinDropped=true"
  //                   );
  //                 }}
  //               >
  //                 Order by here
  //               </Button>
  //             </Box>
  //           )}
  //           <Box flex={1}></Box>
  //         </Box>
  //       </Box>
  //       <div>
  //         <DeckGL
  //           initialViewState={initialViewState}
  //           onViewStateChange={(e) => {
  //             const bounding = new WebMercatorViewport(
  //               e.viewState as any
  //             ).getBounds();

  //             const oldBounds = new WebMercatorViewport(
  //               e.oldViewState as any
  //             ).getBounds();

  //             if (JSON.stringify(bounding) !== JSON.stringify(oldBounds)) {
  //               setState(new WebMercatorViewport(e.viewState as any).getBounds());
  //             }
  //           }}
  //           layers={[scatterLayer, scatterLayer2]}
  //           height={400}
  //           width={"100%"}
  //           controller
  //           onClick={handleMapClick}
  //         >
  //           <Map
  //             // reuseMaps
  //             attributionControl={false}
  //             mapStyle={
  //               "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
  //             }
  //           >
  //             <Marker latitude={0} longitude={0}>
  //               <div id="pin">xx</div>
  //             </Marker>
  //           </Map>
  //         </DeckGL>
  //       </div>
  //     </Box>
  //   );
};
