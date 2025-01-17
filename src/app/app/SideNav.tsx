import { useAuth } from "@/lib/auth";
import { UserDetail } from "@/ui/UserDetail";
import {
  Avatar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemDecorator,
} from "@mui/joy";
import ListItemButton from "@mui/joy/ListItemButton";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AutoImage } from "@/ui/AutoImage";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import { SystemEntityTypes } from "@/lib/SystemTypes";
export default async function SideNav() {
  const { user } = await useAuth();
  const workspaces = await prisma.entity.findMany({
    where: {
      entityTypeId: "system_workspace" satisfies SystemEntityTypes,
      tenantId: user.company_id,
    },
    select: {
      attributes: true,
      id: true,
    },
  });
  return (
    <Box display={"flex"} flexDirection={"column"} flex={1}>
      <Box>
        <List sx={{ "--List-nestedInsetStart": "1rem" }}>
          <ListItem nested>
            <Link href="/app">
              <ListItemButton>
                <ListItemDecorator>
                  <WorkspacesIcon />
                </ListItemDecorator>
                Workspaces
              </ListItemButton>
            </Link>

            <List>
              {workspaces.map((ws) => (
                <Link href={`/app/item/${ws.id}`} key={ws.id}>
                  <ListItem>
                    <ListItemButton>
                      <ListItemDecorator>
                        <Avatar size="sm">
                          <AutoImage value={ws.id} />
                        </Avatar>
                      </ListItemDecorator>
                      {(ws.attributes as any).item_title}
                    </ListItemButton>
                  </ListItem>
                </Link>
              ))}
            </List>
          </ListItem>
        </List>
      </Box>
      <Box flex={1}></Box>
      <Box>
        <List>
          <Link href="/app/settings">
            <ListItem>
              <ListItemButton>
                <ListItemDecorator>
                  <SettingsIcon />
                </ListItemDecorator>
                Settings
              </ListItemButton>
            </ListItem>
          </Link>
        </List>
      </Box>
      <Box>
        <Divider />
        <Box p={2}>
          <UserDetail userId={user.user_id} nameOnly />
        </Box>
      </Box>
    </Box>
  );
}
