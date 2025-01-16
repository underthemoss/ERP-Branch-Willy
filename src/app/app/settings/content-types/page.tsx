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
    include: {
      parent: {
        where: tenantWhereClause,
        include: {
          parent: {
            where: tenantWhereClause,
            include: {
              parent: {
                where: tenantWhereClause,
              },
              attributes: {
                where: tenantWhereClause,
              },
            },
          },
          attributes: {
            where: tenantWhereClause,
          },
        },
      },
      attributes: {
        where: tenantWhereClause,
      },
    },
  });

  const traverseInheritedAttributes = (
    item: any,
    start: any
  ): React.ReactNode[] => {
    if (!item) return [];
    return [
      ...traverseInheritedAttributes(item.parent, start),
      ...item.attributes.map((a: any) => {
        const isInhertedAttribute = start.id !== item.id;
        return (
          <Tooltip
            key={a.id}
            title={
              <>
                {isInhertedAttribute && (
                  <Box>
                    Inherited from:{" "}
                    <NextLink href={`/app/settings/content-types/${item.id}`}>
                      {item.name}
                    </NextLink>
                  </Box>
                )}
                <Box>Type: {a.type}</Box>
                <Box>{a.tenantId !== "SYSTEM" && "Custom attribute"}</Box>
              </>
            }
            variant="outlined"
          >
            <Chip
              sx={{ mr: 1 }}
              color={isInhertedAttribute ? "neutral" : "primary"}
            >
              {isInhertedAttribute && (
                <KeyboardDoubleArrowUpIcon style={{ fontSize: 12 }} />
              )}

              {a.name}
            </Chip>
          </Tooltip>
        );
      }),
    ];
  };

  return (
    <>
      <Box display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          Content Types
        </Typography>
        <Box></Box>
        <Box flex={1}></Box>
        <Link href="/app/settings/new-content-type">
          <Button variant="plain">New Content Type</Button>
        </Link>
      </Box>
      <Box mt={2}>
        <Table>
          <thead>
            <tr>
              <th style={{ width: 150 }}>Name</th>
              <th style={{ width: 150 }}>Parent</th>
              <th>Description</th>
              <th>Attributes</th>
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
                  <td>{traverseInheritedAttributes(type, type)}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Box>
    </>
  );
}
