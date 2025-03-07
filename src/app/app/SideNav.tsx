import { getUser } from "@/lib/auth";
import { UserDetail } from "@/ui/UserDetail";
import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemDecorator,
  Typography,
} from "@mui/joy";
import ListItemButton from "@mui/joy/ListItemButton";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PrecisionManufacturingTwoToneIcon from "@mui/icons-material/PrecisionManufacturingTwoTone";
import { ContentTypeComponent } from "@/ui/Icons";
import PeopleAltTwoToneIcon from "@mui/icons-material/PeopleAltTwoTone";
import NewButton from "./@breadcrumbs/NewButton";
import HandymanTwoToneIcon from "@mui/icons-material/HandymanTwoTone";
export default async function SideNav() {
  const { user } = await getUser();

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
              {/* {items.map((item) => {
                return (
                  <Link href={`/app/item/${item.id}`} key={item.id}>
                    <ListItem>
                      <ListItemButton>
                        <Box>
                          <ContentTypeComponent
                            color={"gray"}
                            icon={"FolderOpen"}
                            label={item.title}
                          />
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  </Link>
                );
              })} */}
              <Link
                href={`/app/view/users?${[
                  "type=user",
                  "include=data.id",
                  "include=data.first_name",
                  "include=data.last_name",
                  "include=data.email",
                  "limit=10",
                  "offset=0",
                ].join("&")}`}
              >
                <ListItem>
                  <ListItemButton>
                    <PeopleAltTwoToneIcon style={{}} />
                    <Box>
                      <Typography>Users</Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
              </Link>
              <Link
                href={`/app/view/assets?${[
                  "type=asset",
                  "include=data.photo_filename",
                  "include=data.id",
                  "include=data.custom_name",
                  "include=data.make_name",
                  "include=data.model_name",
                  "include=data.category_name",
                  "include=data.company_id",
                  "limit=10",
                  "offset=0",
                ].join("&")}`}
              >
                <ListItem>
                  <ListItemButton>
                    <PrecisionManufacturingTwoToneIcon style={{}} />
                    <Box>
                      <Typography>Assets</Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
              </Link>

              <Link
                href={`/app/view/work_orders?${[
                  "type=work_order",
                  "include=data.id",
                  "include=data.description",
                  "include=data.status",
                  "include=data.due_date",
                  "include=data.assigned_to",
                  "include=created_at",
                  "limit=20",
                  "offset=0",
                ].join("&")}`}
              >
                <ListItem>
                  <ListItemButton>
                    <HandymanTwoToneIcon />
                    <Box>
                      <Typography>Work Orders</Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
              </Link>
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
