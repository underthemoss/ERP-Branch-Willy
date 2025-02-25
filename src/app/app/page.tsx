import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, Box, Table, Typography } from "@mui/joy";
import { SystemEntityTypes } from "@/lib/SystemTypes";
import { NextLink } from "@/ui/NextLink";
import { AutoImage } from "@/ui/AutoImage";

import { getContentTypeConfig } from "@/services/ContentTypeRepository";
import { contentTypeLookup } from "@/services/SystemContentTypes";
import { denormaliseConfig } from "@/lib/content-types/ContentTypesConfigParser";
import { ContentTypeComponent } from "@/ui/Icons";
export default async function Home() {
  const { user } = await getUser();
  const config = denormaliseConfig(await getContentTypeConfig());

  const spaces = await prisma.entity.findMany({
    where: {
      tenant_id: user.company_id,
      type_id: {
        in: config.filter((t) => t.is_root_type).map((t) => t.id),
      },
    },
  });
  return (
    <Box>
      <Box p={2} display={"flex"}>
        <Typography level="h1" fontWeight={500}>
          Workspaces
        </Typography>
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
            {spaces.map((ws) => {
              const ct = config.find((t) => t.id === ws.type_id)!;
              return (
                <tr key={ws.id}>
                  <td>
                    <Box display={"flex"} gap={1}>
                      <NextLink href={`/app/item/${ws.id}`}>
                        <ContentTypeComponent
                          color={ct?.color}
                          icon={ct?.icon}
                          label={
                            (ws.data as any)[
                              config.find((t) => t.id === ws.type_id)?.computed
                                .allFields[0].id || ""
                            ]
                          }
                        />{" "}
                      </NextLink>
                    </Box>
                  </td>
                  <td>{(ws.data as any).description}</td>
                  <td>
                    {/* {(ws.data as any)["created_by"] && (
                      <UserDetail userId={(ws.data as any)["created_by"]} />
                    )} */}
                  </td>
                  <td>
                    {/* {(ws.data as any)["created_at"]?.toDateString()} */}
                  </td>
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
