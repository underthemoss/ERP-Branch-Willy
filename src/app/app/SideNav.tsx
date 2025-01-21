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
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
export default async function SideNav() {
  const { user } = await useAuth();
  const entities = await prisma.entity.findMany({
    where: {
      OR: [
        {
          entityTypeId: {
            startsWith: "system_workspace" satisfies SystemEntityTypes,
          },
        },
        {
          entityTypeId: {
            startsWith: "system_list" satisfies SystemEntityTypes,
          },
        },
      ],
      tenantId: user.company_id,
    },
    select: {
      id: true,
      attributes: true,
      entityType: true,
      entityTypeId: true,
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
                Home
              </ListItemButton>
            </Link>

            <List>
              {entities.map((item) => (
                <Link href={`/app/item/${item.id}`} key={item.id}>
                  <ListItem>
                    <ListItemButton>
                      <ListItemDecorator>
                        <Avatar size="sm">
                          <EntityTypeIcon
                            entityTypeIcon={item.entityType.icon}
                            entityId={item.id}
                          />
                        </Avatar>
                      </ListItemDecorator>
                      {(item.attributes as any).name}
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
