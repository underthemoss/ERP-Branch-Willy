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

  // const entities = await findEntities({
  //   filters: { parent_id: "" },
  // });
  const entities = [] as any;
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
            {/* {entities.map((item) => {
              return (
                <tr key={item.id}>
                  <td>
                    <Box display={"flex"} gap={1}>
                      <NextLink href={`/app/item/${item.id}`}>
                        <ContentTypeComponent
                          color={"gray"}
                          icon={"OpenFolder"}
                          label={item.title}
                        />
                      </NextLink>
                    </Box>
                  </td>
                  <td></td>
                  <td>{item.data.created_by}</td>
                  <td>{item.data.created_at}</td>
                  <td></td>
                </tr>
              );
            })} */}
          </tbody>
        </Table>
      </Box>
    </Box>
  );
}
