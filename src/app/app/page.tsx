import { getUser } from "@/lib/auth";
import { AutoImage } from "@/ui/AutoImage";

import { Box, Table, Typography } from "@mui/joy";
export default async function Home() {
  const { user } = await getUser();

  return (
    <Box>
      <Box p={2} display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          Workspaces
        </Typography>
      </Box>
      <AutoImage value="test" />

      <Box></Box>
      <Box>
        <Table>
          <thead>
            <tr>
              <th>Name{user.email}</th>
              <th>Description</th>
              <th>Created by</th>
              <th>Created at</th>
              <th></th>
            </tr>
          </thead>
          <tbody></tbody>
        </Table>
      </Box>
    </Box>
  );
}
