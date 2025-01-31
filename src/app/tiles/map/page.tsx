import { MapTile } from "./MapTile";

export default async function Page() {
  // Source data GeoJSON
  const DATA_URL =
    "https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/arc/counties.json"; // eslint-disable-line

  const resp = await fetch(DATA_URL);
  const { features } = await resp.json();
  return <MapTile data={features} />;
}
