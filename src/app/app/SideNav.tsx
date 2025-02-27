import { getUser } from "@/lib/auth";
import { UserDetail } from "@/ui/UserDetail";
import { Box, Divider, List, ListItem, ListItemDecorator } from "@mui/joy";
import ListItemButton from "@mui/joy/ListItemButton";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import { ContentTypeComponent } from "@/ui/Icons";

import NewButton from "./@breadcrumbs/NewButton";

import { Entity } from "@/db/mongoose";
import {
  CastContentType,
  ContentTypeKeys,
  ContentTypeViewModelKeyed,
} from "@/model/ContentTypes.generated";

export default async function SideNav() {
  const { user } = await getUser();
  const items = await Entity.find({
    tenant_id: user.company_id,
    parent_id: "",
    type: ContentTypeViewModelKeyed["collection"].descendents,
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
              {items
                .map((item) => CastContentType<"collection">(item))
                .map((item) => {
                  const ct = ContentTypeViewModelKeyed[item.type];

                  return (
                    <Link href={`/app/item/${item._id}`} key={item._id}>
                      <ListItem>
                        <ListItemButton>
                          <Box>
                            <ContentTypeComponent
                              color={ct.color}
                              icon={ct.icon}
                              label={item.data.name}
                            />
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    </Link>
                  );

                  return null;
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
