"use client";

import { Avatar, Box, FormControl, MenuItem, Select, Typography } from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";

export interface WorkspaceSelectorWorkspace {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface WorkspaceSelectorProps {
  workspaces: WorkspaceSelectorWorkspace[];
  selectedWorkspaceId: string | null;
  onWorkspaceChange: (workspaceId: string) => void;
  hideIfSingle?: boolean;
  label?: string;
  size?: "small" | "medium";
}

export function WorkspaceSelector({
  workspaces,
  selectedWorkspaceId,
  onWorkspaceChange,
  hideIfSingle = true,
  label,
  size = "small",
}: WorkspaceSelectorProps) {
  // Hide if there's only one workspace and hideIfSingle is true
  if (hideIfSingle && workspaces.length <= 1) {
    return null;
  }

  // If no workspaces, don't render
  if (workspaces.length === 0) {
    return null;
  }

  const handleChange = (event: SelectChangeEvent<string>) => {
    onWorkspaceChange(event.target.value);
  };

  return (
    <FormControl size={size} sx={{ minWidth: 200 }}>
      {label && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
      )}
      <Select
        value={selectedWorkspaceId || ""}
        onChange={handleChange}
        displayEmpty
        renderValue={(selected) => {
          const workspace = workspaces.find((w) => w.id === selected);
          if (!workspace) {
            return (
              <Typography variant="body2" color="text.secondary">
                Select workspace
              </Typography>
            );
          }
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                src={workspace.logoUrl || undefined}
                sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
              >
                {workspace.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2" noWrap>
                {workspace.name}
              </Typography>
            </Box>
          );
        }}
      >
        {workspaces.map((workspace) => (
          <MenuItem key={workspace.id} value={workspace.id}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar
                src={workspace.logoUrl || undefined}
                sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
              >
                {workspace.name.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="body2">{workspace.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
