import { findEntities } from "@/db/mongoose";
import { TableCellRenderer } from "@/types/FieldRender";

import { Box, Table, Typography } from "@mui/joy";
import { ViewTable } from "./Table";
import qs from "qs";
import {
  encodeUniversalQuery,
  parseUrl,
  stringifySearchParams,
  UniversalQuery,
} from "@/lib/UniversalQuery";

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

  const raw = stringifySearchParams(await props.searchParams);
  console.log({ raw }, parseUrl(raw));

  // const searchUrl = encodeUniversalQuery({
  //   filter: {
  //     type: "asset",
  //   },
  //   include: {
  //     "data.id": 1,
  //     "data.custom_name": 1,
  //   },
  //   options: {
  //     limit: 20,
  //     offset: 0,
  //     sort: {
  //       _id: 1,
  //     },
  //   },
  // });
  // console.log(searchUrl);

  const query = parseUrl(raw);

  // return null;

  // const url = stringifySearchParams(await props.searchParams);
  // const query = parseUrl(url);
  const data = await findEntities(query);

  return (
    <Box>
      <Box p={2} display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          {snakeToPascal(name)}
        </Typography>
      </Box>

      <Box></Box>
      <ViewTable key={name} query={query} data={data} />
    </Box>
  );
}
