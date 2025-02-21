import { getUser } from "@/lib/auth";
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
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import { EntityTypeIcon } from "@/ui/EntityTypeIcons";
import { Add } from "@mui/icons-material";
import { ContentTypeComponent } from "@/ui/Icons";

import NewButton from "./@breadcrumbs/NewButton";
import { getContentTypeConfig } from "@/services/ContentTypeRepository";
import { denormaliseConfig } from "@/lib/content-types/ContentTypesConfigParser";

export default async function SideNav() {
  const { user } = await getUser();
  const entities = await prisma.entity.findMany({
    where: {
      tenant_id: user.company_id,
      parent_id: { isSet: false },
    },
    select: {
      id: true,
      data: true,
      type_id: true,
    },
  });
  const contentTypes = denormaliseConfig(await getContentTypeConfig());

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
              {entities.map((item) => {
                const ct = contentTypes.find((ct) => ct.id === item.type_id);
                if (!ct) return null;
                return (
                  <Link href={`/app/item/${item.id}`} key={item.id}>
                    <ListItem>
                      <ListItemButton>
                        <Box>
                          <ContentTypeComponent
                            color={ct.color}
                            icon={ct.icon}
                            label={
                              (item.data as any)[ct.computed.allFields[0].id]
                            }
                          />
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  </Link>
                );
              })}
            </List>
          </ListItem>
        </List>
      </Box>
      <Box flex={1}></Box>
      <Box>
        <List>
          <NewButton itemId="" />
          {/* <Link href="/app/item/null/new/workspace">
            <ListItem>
              <ListItemButton>
                <ListItemDecorator>
                  <Add />
                </ListItemDecorator>
                Add workspace
              </ListItemButton>
            </ListItem>
          </Link> */}
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
