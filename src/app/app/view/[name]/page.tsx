import { findEntities } from "@/db/mongoose";

import { Box, Typography } from "@mui/joy";
import { ViewTable } from "./Table";

import { parseUrl, stringifySearchParams } from "@/lib/UniversalQuery";
import { MapView } from "./Map";

import ViewSelector from "./ViewSelector";

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
    <Box display={"flex"} flexDirection={'column'} width={'100%'}>
      <Box p={2} display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          {snakeToPascal(name)}
        </Typography>
      </Box>
      <Box mb={1} display={"flex"}>
        <Box flex={1}></Box>
        <ViewSelector query={query} />
      </Box>
      {query.components?.map && (
        <Box>
          <MapView locations={data.locations} />
        </Box>
      )}
      {query.components?.list && (
        <Box>
          <ViewTable key={name} query={query} data={data} />
        </Box>
      )}
    </Box>
  );
}
