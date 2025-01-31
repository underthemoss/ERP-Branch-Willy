import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Avatar,
  Box,
  Button,
  Card,
  Sheet,
  Table,
  Tooltip,
  Typography,
} from "@mui/joy";
import AddHomeIcon from "@mui/icons-material/AddHome";
import { SystemEntityTypes } from "@/lib/SystemTypes";
import { NextLink } from "@/ui/NextLink";
import { UserDetail } from "@/ui/UserDetail";
import { AutoImage } from "@/ui/AutoImage";
export default async function Home() {
  const { user } = await getUser();
  const spaces = await prisma.entity.findMany({
    where: {
      tenant_id: user.company_id,
      OR: [
        {
          type_id: {
            startsWith: "system_workspace" satisfies SystemEntityTypes,
          },
        },
      ],
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
              return (
                <tr key={ws.id}>
                  <td>
                    <Box display={"flex"} gap={1}>
                      <Avatar>
                        <AutoImage value={ws.id}></AutoImage>
                      </Avatar>
                      <NextLink href={`/app/item/${ws.id}`}>
                        {(ws.data as any).name}
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
