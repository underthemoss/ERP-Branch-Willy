import { useAuth } from "@/lib/auth";
import { UserDetail } from "@/ui/UserDetail";
import { Box, Divider, List, ListItem, ListItemDecorator } from "@mui/joy";
import ListItemButton from "@mui/joy/ListItemButton";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "next/link";

export default async function SideNav() {
  const { user } = await useAuth();
  return (
    <Box display={"flex"} flexDirection={"column"} flex={1}>
      <Box></Box>
      <Box flex={1}></Box>
      <Box>
        <List>
          <Link href="/settings">
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
