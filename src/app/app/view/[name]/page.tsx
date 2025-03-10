import { findEntities } from "@/db/mongoose";

import { Box, Table, Typography } from "@mui/joy";
import { ViewTable } from "./Table";

import { parseUrl, stringifySearchParams } from "@/lib/UniversalQuery";
import { MapView } from "./Map";

function snakeToPascal(snakeStr: string) {
  return snakeStr
    .split("_") // Split the string into an array by underscores.
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word.
    .join(" "); // Join all the words without any separator.
}

export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[]>>;
  params: Promise<{ name: string }>;
}) {
  const { name } = await props.params;

  const query = parseUrl(stringifySearchParams(await props.searchParams));
  const data = await findEntities(query);

  return (
    <Box>
      <Box p={2} display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          {snakeToPascal(name)}
        </Typography>
      </Box>

      <Box>
        <MapView locations={data.locations} />
      </Box>
      <ViewTable key={name} query={query} data={data} />
    </Box>
  );
}
