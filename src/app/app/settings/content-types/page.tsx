import { useAuth } from "@/lib/auth";
import { NextLink } from "@/ui/NextLink";
import { prisma } from "@/lib/prisma";
import { Box, Button, Chip, Table, Tooltip, Typography } from "@mui/joy";
import Link from "next/link";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
export default async function Page(props: {
  params: Promise<{ item_id: string }>;
}) {
  const { user } = await useAuth();
  const tenantWhereClause = {
    tenantId: {
      in: ["SYSTEM", user.company_id],
    },
    hidden: false,
  };
  const entityTypes = await prisma.entityType.findMany({
    where: tenantWhereClause,
    select: {
      id: true,
      name: true,
      description: true,
      tenantId: true,
      icon: true,
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
    <Box>
      <Box display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          Content Types
        </Typography>

        <Box flex={1}></Box>
      </Box>
      {["System Types" as const, "Custom Types" as const].map((type) => {
        return (
          <Box mt={3} key={type}>
            <Box mb={2}>
              <Typography level="h4" fontWeight={500}>
                {type}
              </Typography>
            </Box>
            <Table>
              <thead>
                <tr>
                  <th style={{ width: 250 }}>Type</th>
                  <th style={{ width: 250 }}>Parent Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {entityTypes
                  .filter(
                    (t) =>
                      t.tenantId ===
                      (type === "System Types" ? "SYSTEM" : user.company_id)
                  )
                  .map((type) => {
                    return (
                      <tr key={type.id}>
                        <td>
                          <NextLink
                            href={`/app/settings/content-types/${type.id}`}
                          >
                            <EntityTypeIcon entityTypeIcon={type.icon} />
                            <Box ml={1}>{type.name}</Box>
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
        );
      })}
    </Box>
  );
}
