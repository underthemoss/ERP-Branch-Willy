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
import { Entity } from "@/db/mongoose";
import {
  CastContentType,
  ContentTypeViewModelKeyed,
  isTypeof,
} from "@/model/ContentTypes.generated";
export default async function Home() {
  const { user } = await getUser();
  const config = denormaliseConfig(await getContentTypeConfig());
  const entities = await Entity.find({
    parent_id: "",
    tenant_id: user.company_id,
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
            {entities.map((item) => {
              const ct = ContentTypeViewModelKeyed[item.type];
              if (isTypeof(item.type, "collection")) {
                const collection = CastContentType<"collection">(item);
                return (
                  <tr key={item.id}>
                    <td>
                      <Box display={"flex"} gap={1}>
                        <NextLink href={`/app/item/${item.id}`}>
                          <ContentTypeComponent
                            color={ct?.color}
                            icon={ct?.icon}
                            label={collection.data.name}
                          />
                        </NextLink>
                      </Box>
                    </td>
                    <td>{(item.data as any).description}</td>
                    <td>
                      {collection.data.created_by}
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
                return null;
              }
            })}
          </tbody>
        </Table>
      </Box>
    </Box>
  );
}
