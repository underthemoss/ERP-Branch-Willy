import { findEntities } from "@/db/mongoose";

import { Box, Typography } from "@mui/joy";
import { ViewTable } from "./Table";

import { parseUrl, stringifySearchParams } from "@/lib/UniversalQuery";
import { MapView } from "./Map";

import ViewSelector from "./ViewSelector";
import { FixedSizeScroller } from "./FixedSizeScroller";

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
    <Box display={"flex"} flexDirection={"column"} width={"100%"}>
      <Box p={2} display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          {snakeToPascal(name)}
        </Typography>
      </Box>
      <Box mb={1} display={"flex"} alignItems={"center"} gap={2}>
        <Box flex={1}></Box>
        <Box>Total: {data.count.toLocaleString()}</Box>
        <ViewSelector query={query} />
      </Box>
      <Box
        display={"flex"}
        flex={1}
        border="1px solid red"
        width={"100%"}
        overflow={"hidden"}
        style={{
          overflowY: "hidden",
        }}
      >
        {query.components?.list && (
          <Box flex={1}>
            <FixedSizeScroller>
              <ViewTable key={name} query={query} data={data} />
            </FixedSizeScroller>
          </Box>
        )}
        {query.components?.map && (
          <Box flex={1}>
            <FixedSizeScroller>
              <MapView query={query} data={data}></MapView>
            </FixedSizeScroller>
          </Box>
        )}
      </Box>
    </Box>
  );
}
