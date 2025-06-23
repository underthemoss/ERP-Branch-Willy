"use client";

import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Link from "next/link";
import Box from "@mui/material/Box";
import { useParams } from "next/navigation";

export default function SettingsPage() {
  // Get workspace_id from params for correct subpage links
  const params = useParams();
  const workspaceId = Array.isArray(params?.workspace_id)
    ? params.workspace_id[0]
    : params?.workspace_id;

  return (
    <Box sx={{ padding: 4, maxWidth: 600 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        General
      </Typography>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} href={`/app/${workspaceId}/settings/general`}>
            <ListItemText primary="General Settings" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Workflows
      </Typography>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} href={`/app/${workspaceId}/settings/workflows/123`}>
            <ListItemText primary="Workflow Designer Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}
