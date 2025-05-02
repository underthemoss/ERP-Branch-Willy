import { useAuth0 } from "@auth0/auth0-react";
import AddIcon from "@mui/icons-material/Add";
import {
  Avatar,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Stack,
  Typography,
} from "@mui/material";
import { AccountPopoverFooter, AccountPreview, SignOutButton } from "@toolpad/core/Account";
import * as React from "react";

export default function WorkspaceSwitcher() {
  const { user } = useAuth0();
  const workspaces = [
    {
      id: 1,
      name: "EquipmentShare",
      subtext: "Default Workspace",
      image: "/favicon.ico",
    },
    {
      id: 3,
      name: "Baton Rouge, LA - Core Solutions",

      color: "#8B4513", // Brown color
    },
    {
      id: 2,
      name: user?.name,
      subtext: "Private Workspace",
      color: "#8B4513", // Brown color
    },
  ];
  return (
    <Stack direction="column">
      <AccountPreview variant="expanded" />
      <Divider />
      <Typography variant="body2" mx={2} mt={1}>
        Workspaces
      </Typography>
      <MenuList>
        {workspaces.map((workspace) => (
          <MenuItem
            key={workspace.id}
            component="button"
            sx={{
              justifyContent: "flex-start",
              width: "100%",
              columnGap: 2,
            }}
          >
            <ListItemIcon>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: "0.95rem",
                  bgcolor: workspace.color,
                }}
                src={workspace.image ?? ""}
                alt={workspace.name ?? ""}
              >
                {workspace?.name?.[0]}
              </Avatar>
            </ListItemIcon>
            <ListItemText
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                width: "100%",
              }}
              primary={workspace.name}
              secondary={workspace.subtext}
              slotProps={{
                primary: {
                  variant: "body2",
                },
                secondary: {
                  variant: "caption",
                },
              }}
            />
          </MenuItem>
        ))}
        <Divider />
        <Button
          variant="text"
          sx={{ textTransform: "capitalize", display: "flex", mx: "auto" }}
          size="small"
          startIcon={<AddIcon />}
          disableElevation
        >
          Add new
        </Button>
      </MenuList>
      <Divider />
      <AccountPopoverFooter>
        <SignOutButton />
      </AccountPopoverFooter>
    </Stack>
  );
}
