import { prisma } from "@/lib/prisma";
import { useAuth } from "@/lib/auth";
import { Avatar, Box, Table, Tooltip, Typography } from "@mui/joy";
import { SystemEntityTypes } from "@/lib/SystemTypes";
import { NextLink } from "@/ui/NextLink";
import { UserDetail } from "@/ui/UserDetail";
import { AutoImage } from "@/ui/AutoImage";
import { JsonObject } from "@prisma/client/runtime/library";
import { EntityIcon } from "@/ui/EntityTypeIcons";

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
    },
  });
  return (
    <Box>
      <Box p={2} display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          {(parent.attributes as any)?.item_name}
        </Typography>
        <Box flex={1}></Box>
      </Box>

      <Box></Box>
      <Box>
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Created by</th>
              <th>Created at</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {parent.children.map((item) => {
              return (
                <tr key={item.id}>
                  <td>
                    <Box display={"flex"} gap={1}>
                      {/* <Tooltip title={item.entityType.name}> */}
                      <EntityIcon entityId={item.id} />
                      {/* </Tooltip> */}
                      <NextLink href={`/app/item/${item.id}`}>
                        {(item.attributes as any).item_name}
                      </NextLink>
                    </Box>
                  </td>
                  <td>{(item.attributes as any).workspace_description}</td>
                  <td>
                    <UserDetail userId={item.metadata.created_by} />
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
