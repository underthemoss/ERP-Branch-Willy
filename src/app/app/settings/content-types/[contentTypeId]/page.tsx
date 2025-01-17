import { useAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextLink } from "@/ui/NextLink";
import { Box, Table, Typography } from "@mui/joy";

export default async function Page(props: {
  params: Promise<{ contentTypeId: string }>;
}) {
  const { contentTypeId } = await props.params;
  const { user } = await useAuth();
  const entityType = await prisma.entityType.findFirstOrThrow({
    where: { id: contentTypeId, tenantId: { in: ["SYSTEM", user.company_id] } },
    select: {
      name: true,
      description: true,
      parent: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });
  const attributes = await prisma.entityType.getAllAttributes([contentTypeId]);

  const childEntityTypes = await prisma.entityType.findMany({
    where: {
      tenantId: { in: ["SYSTEM", user.company_id] },
      parentId: contentTypeId,
    },
    select: {
      id: true,
      name: true,
      description: true,
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
              <th style={{ width: 200 }}>Name</th>
              <td>{entityType.name}</td>
            </tr>
            <tr>
              <th>Description</th>
              <td>{entityType.description}</td>
            </tr>
            <tr>
              <th>Parent</th>
              <td>
                <NextLink
                  href={`/app/settings/content-types/${entityType.parent?.id}`}
                >
                  {entityType.parent?.name}
                </NextLink>
              </td>
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
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {attributes.map((attr, i, arr) => (
              <tr key={attr.key}>
                <td>{attr.label}</td>
                <td>{attr.type === "string" ? "text" : attr.type}</td>
                <td>
                  {attr.entityTypeId === contentTypeId ? (
                    attr.entityTypeName
                  ) : (
                    <NextLink
                      href={`/app/settings/content-types/${attr.entityTypeId}`}
                    >
                      {attr.entityTypeName}
                    </NextLink>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Box>
      <Box mt={3}>
        <Typography level="h4" fontWeight={500}>
          Subtypes
        </Typography>
      </Box>

      <Box mt={2}>
        <Table variant="outlined" sx={{ width: 700 }}>
          <thead>
            <tr>
              <th style={{ width: 200 }}>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {childEntityTypes.length === 0 && (
              <tr>
                <td colSpan={2}>No subtypes defined</td>
              </tr>
            )}
            {childEntityTypes.map((et, i, arr) => (
              <tr key={et.id}>
                <td>
                  <NextLink href={`/app/settings/content-types/${et.id}`}>
                    {et.name}
                  </NextLink>
                </td>
                <td>{et.description}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Box>
      <Box mt={2}>
        <NextLink
          href={`/app/settings/content-types/${contentTypeId}/create-subtype`}
        >
          Create new subtype
        </NextLink>
      </Box>
    </Box>
  );
}
