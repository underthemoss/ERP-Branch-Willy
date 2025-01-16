import { useAuth } from "@/lib/auth";
import { NextLink } from "@/ui/NextLink";
import { prisma } from "@/lib/prisma";
import { Box, Button, Chip, Table, Tooltip, Typography } from "@mui/joy";
import Link from "next/link";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
export default async function Page(props: {
  params: Promise<{ item_id: string }>;
}) {
  const { user } = await useAuth();
  const tenantWhereClause = {
    tenantId: {
      in: ["SYSTEM", user.company_id],
    },
  };
  const entityTypes = await prisma.entityType.findMany({
    where: tenantWhereClause,
    select: {
      id: true,
      name: true,
      description: true,
      parent: {
        where: tenantWhereClause,
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return (
    <>
      <Box display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          Content Types
        </Typography>

        <Box flex={1}></Box>
      </Box>
      <Box mt={2}>
        <Table>
          <thead>
            <tr>
              <th style={{ width: 150 }}>Type</th>
              <th style={{ width: 150 }}>Parent Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {entityTypes.map((type) => {
              return (
                <tr key={type.id}>
                  <td>
                    <NextLink href={`/app/settings/content-types/${type.id}`}>
                      {type.name}
                    </NextLink>
                  </td>
                  <td>
                    {type.parent && (
                      <NextLink
                        href={`/app/settings/content-types/${type.parent.id}`}
                      >
                        {type.parent.name}
                      </NextLink>
                    )}
                  </td>
                  <td>{type.description}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Box>
    </>
  );
}
