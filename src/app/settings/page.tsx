import { useAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Box, Button, Table, Typography } from "@mui/joy";

export default async function Page(props: {
  params: Promise<{ item_id: string }>;
}) {
  const { user } = await useAuth();
  const entityTypes = await prisma.entityType.findMany({
    where: {
      tenantId: user.company_id,
    },
  });
  return (
    <Box p={2}>
      <Box>
        <Typography level="h1" fontWeight={500}>
          Settings
        </Typography>
      </Box>
      <Box my={2} display={"flex"}>
        <Typography level="h4" fontWeight={500}>
          Content Types
        </Typography>
        <Box flex={1}></Box>
        <Button variant="plain">New Content Type</Button>
      </Box>
      <Box>
        <Table>
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Name</th>
              <th>Calories</th>
              <th>Fat&nbsp;(g)</th>
              <th>Carbs&nbsp;(g)</th>
              <th>Protein&nbsp;(g)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Frozen yoghurt</td>
              <td>159</td>
              <td>6</td>
              <td>24</td>
              <td>4</td>
            </tr>
            <tr>
              <td>Ice cream sandwich</td>
              <td>237</td>
              <td>9</td>
              <td>37</td>
              <td>4.3</td>
            </tr>
            <tr>
              <td>Eclair</td>
              <td>262</td>
              <td>16</td>
              <td>24</td>
              <td>6</td>
            </tr>
            <tr>
              <td>Cupcake</td>
              <td>305</td>
              <td>3.7</td>
              <td>67</td>
              <td>4.3</td>
            </tr>
            <tr>
              <td>Gingerbread</td>
              <td>356</td>
              <td>16</td>
              <td>49</td>
              <td>3.9</td>
            </tr>
          </tbody>
        </Table>
      </Box>
    </Box>
  );
}
