import { prisma } from "@/lib/prisma";
import { useAuth } from "@/lib/auth";
import { Box, Table, Tooltip, Typography } from "@mui/joy";
import { NextLink } from "@/ui/NextLink";
import { UserDetail } from "@/ui/UserDetail";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import _ from "lodash";

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
        },
      },
      entityType: {
        select: {
          icon: true,
        },
      },
    },
  });

  const entityTypesInUse = _.uniq(parent.children.map((c) => c.entityType.id));
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
              {columns.map((c, i) => {
                return (
                  <th key={c.key}>
                    <Tooltip
                      placement="bottom-start"
                      title={`${c.entityTypeName} - ${c.label}`}
                    >
                      <Box>{c.label}</Box>
                    </Tooltip>
                  </th>
                );
              })}
              <th>Created by</th>
              <th>Created at</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {parent.children.map((item) => {
              return (
                <tr key={item.id}>
                  {columns.map((c, i) => {
                    if (i === 0) {
                      return (
                        <td key={c.key}>
                          <Box display={"flex"} gap={1}>
                            <EntityTypeIcon
                              entityTypeIcon={item.entityType.icon}
                            />
                            <NextLink href={`/app/item/${item.id}`}>
                              {(item.attributes as any).item_title}
                            </NextLink>
                          </Box>
                        </td>
                      );
                    }
                    return (
                      <td key={c.key}>{(item.attributes as any)[c.key]}</td>
                    );
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
