import { findEntities } from "@/db/mongoose";
import { TableCellRenderer } from "@/types/FieldRender";
import { UniversalQuery } from "@/types/UniversalQuery";
import { Box, Table, Typography } from "@mui/joy";
import { ViewTable } from "./Table";
function snakeToPascal(snakeStr: string) {
  return snakeStr
    .split("_") // Split the string into an array by underscores.
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word.
    .join(" "); // Join all the words without any separator.
}
export default async function Page(props: {
  searchParams: Promise<UniversalQuery>;
  params: Promise<{ name: string }>;
}) {
  const { name } = await props.params;
  const query = await props.searchParams;
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
