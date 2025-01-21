import { prisma } from "@/lib/prisma";
import { useAuth } from "@/lib/auth";
import { Box, Button, Table, Tooltip, Typography } from "@mui/joy";
import { NextLink } from "@/ui/NextLink";
import { UserDetail } from "@/ui/UserDetail";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import _ from "lodash";
import { SystemEntityTypes } from "@/lib/SystemTypes";

export default async function Page(props: {
  params: Promise<{ item_id: string }>;
}) {
  const { item_id } = await props.params;
  const { user } = await useAuth();
  const parent = await prisma.entity.findFirstOrThrow({
    where: {
      tenantId: user.company_id,
      id: item_id,
    },
    include: {
      children: {
        include: {
          entityType: true,
          referenced_to: {
            include: {
              entityType: true,
            },
          },
        },
      },
      entityType: {
        select: {
          icon: true,
          validChildEntityTypeIds: true,
        },
      },
    },
  });

  const children = parent.children.map((d) => {
    if (d.entityTypeId === ("system_reference" satisfies SystemEntityTypes)) {
      return d.referenced_to!;
    } else {
      return d;
    }
  });

  const entityTypesInUse = _.uniq(children.map((c) => c.entityType.id));
  const columns = await prisma.entityType.getAllAttributes(entityTypesInUse);

  return (
    <Box>
      <Box p={2} display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          {(parent.attributes as any)?.item_title}
        </Typography>
        <Box flex={1}></Box>
      </Box>

      <Box></Box>
      <Box>
        <Table>
          <thead>
            <tr>
              <th style={{ width: 38 }}></th>
              {columns.map((c, i) => {
                return (
                  <th key={c.id}>
                    <Tooltip
                      placement="top-start"
                      title={`${c.id} - ${c.label}`}
                    >
                      <Box>{c.label}</Box>
                    </Tooltip>
                  </th>
                );
              })}
              <th>Created by</th>
              <th>Created at</th>
              <th style={{ width: 100 }}>
                {parent.entityType.validChildEntityTypeIds.length === 1 && (
                  <NextLink
                    href={`/app/item/${parent.id}/add-column/${parent.entityType.validChildEntityTypeIds[0]}`}
                  >
                    Add column
                  </NextLink>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {children.map((item) => {
              return (
                <tr key={item.id}>
                  <td>
                    <Box display={"flex"} gap={1}>
                      <NextLink href={`/app/item/${item.id}`}>
                        {/* {(item.attributes as any).name} */}
                        <EntityTypeIcon entityTypeIcon={item.entityType.icon} />
                      </NextLink>
                    </Box>
                  </td>
                  {columns.map((c, i) => {
                    if (c.id === "name") {
                      return (
                        <td key={c.id}>
                          <Box display={"flex"} gap={1}>
                            <NextLink href={`/app/item/${item.id}`}>
                              {(item.attributes as any)[c.id]}
                            </NextLink>
                          </Box>
                        </td>
                      );
                    }
                    return <td key={c.id}>{(item.attributes as any)[c.id]}</td>;
                  })}
                  <td>
                    <UserDetail userId={item.metadata.created_by} nameOnly />
                  </td>
                  <td>{item.metadata.created_at.toDateString()}</td>
                  <td></td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Box>
    </Box>
  );
}
