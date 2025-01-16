import { useAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Box, Table, Typography } from "@mui/joy";

export default async function Page(props: {
  params: Promise<{ contentTypeId: string }>;
}) {
  const { contentTypeId } = await props.params;
  const { user } = await useAuth();
  const entityType = await prisma.entityType.findFirstOrThrow({
    where: { id: contentTypeId, tenantId: { in: ["SYSTEM", user.company_id] } },
    include: {
      attributes: {
        where: {
          tenantId: {
            in: ["SYSTEM", user.company_id],
          },
        },
      },
    },
  });
  return (
    <Box>
      <Box>
        <Typography level="h1" fontWeight={500}>
          {entityType.name}
        </Typography>
      </Box>
      <Box mt={2}>
        <Table variant="outlined" sx={{ width: 700 }}>
          <tbody>
            <tr>
              <th colSpan={2} style={{ width: 200 }}>
                Name
              </th>
              <td>{entityType.name}</td>
            </tr>
            <tr>
              <th colSpan={2}>Description</th>
              <td>{entityType.description}</td>
            </tr>
          </tbody>
        </Table>
      </Box>
      <Box mt={3}>
        <Typography level="h4" fontWeight={500}>
          Attributes
        </Typography>
      </Box>
      <Box mt={2}>
        <Table variant="outlined" sx={{ width: 700 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Data type</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entityType.attributes.map((attr, i, arr) => (
              <tr key={attr.id}>
                <td>{attr.name}</td>
                <td>{attr.type === "string" ? "text" : attr.type}</td>
                <td>{attr.tenantId === "SYSTEM" ? "" : "Custom"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Box>
    </Box>
  );
}
