"use client";

import { useWorkspace } from "@/providers/WorkspaceProvider";
import { Add, ArrowForward, Business } from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import { CreateWorkspaceFlow } from "./CreateWorkspaceFlow";

export function WorkspaceSelectionScreen() {
  const theme = useTheme();
  const { workspaces, selectWorkspace } = useWorkspace();
  const [showCreateFlow, setShowCreateFlow] = useState(false);

  // Mock data for demonstration
  const myWorkspaces = [
    {
      id: "ws-001",
      name: "Construction Co.",
      memberCount: 12,
    },
    {
      id: "ws-002",
      name: "Equipment Rental Inc.",
      memberCount: 8,
    },
    {
      id: "ws-003",
      name: "Building Solutions LLC",
      memberCount: 5,
    },
    {
      id: "ws-004",
      name: "Heavy Machinery Corp",
      memberCount: 15,
    },
  ];

  const availableWorkspaces = [
    {
      id: "ws-005",
      name: "Regional Contractors",
      memberCount: 25,
    },
    {
      id: "ws-006",
      name: "City Infrastructure",
      memberCount: 30,
    },
  ];

  const handleJoinWorkspace = (workspaceId: string, workspaceName: string) => {
    console.log("Joining workspace:", workspaceId);
    alert(`Joining "${workspaceName}" would be processed here`);
  };

  const handleWorkspaceCreated = (workspaceId: string) => {
    console.log("Workspace created:", workspaceId);
    // In production, this would select the newly created workspace
    selectWorkspace(workspaceId);
  };

  // Combine all workspaces into a single list
  const allItems = [
    ...myWorkspaces.map((ws) => ({ ...ws, type: "member" })),
    ...availableWorkspaces.map((ws) => ({ ...ws, type: "available" })),
  ];

  // Show create workspace flow if requested
  if (showCreateFlow) {
    return (
      <CreateWorkspaceFlow
        onComplete={handleWorkspaceCreated}
        onCancel={() => setShowCreateFlow(false)}
      />
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.05,
        )} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Box>
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
              <Image
                src="/logo-erp.png"
                alt="EquipmentShare"
                width={200}
                height={60}
                priority
                style={{ objectFit: "contain", width: "auto", height: "auto" }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>
              Select a Workspace
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 500, mx: "auto" }}>
              Choose a workspace to continue
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <List sx={{ py: 0 }}>
              {/* All workspaces in a single flat list */}
              {allItems.map((workspace, index) => (
                <ListItem
                  key={workspace.id}
                  disablePadding
                  sx={{
                    borderBottom:
                      index < allItems.length - 1
                        ? `1px solid ${alpha(theme.palette.divider, 0.08)}`
                        : "none",
                  }}
                >
                  <ListItemButton
                    onClick={() => {
                      if (workspace.type === "member") {
                        if (workspace.id) {
                          selectWorkspace(workspace.id);
                        }
                      } else {
                        handleJoinWorkspace(workspace.id, workspace.name);
                      }
                    }}
                    sx={{
                      py: 2.5,
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Business
                        sx={{
                          color: workspace.type === "member" ? "primary.main" : "text.secondary",
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={workspace.name}
                      secondary={`${workspace.memberCount} members`}
                    />
                    {workspace.type === "member" ? (
                      <ArrowForward sx={{ color: "text.secondary" }} />
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinWorkspace(workspace.id, workspace.name);
                        }}
                      >
                        Join
                      </Button>
                    )}
                  </ListItemButton>
                </ListItem>
              ))}

              {/* Create New Workspace */}
              <ListItem
                disablePadding
                sx={{
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                }}
              >
                <ListItemButton
                  onClick={() => setShowCreateFlow(true)}
                  sx={{
                    py: 2.5,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                >
                  <ListItemIcon>
                    <Add color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: 600, color: "primary.main" }}>
                        Create New Workspace
                      </Typography>
                    }
                    secondary="Start fresh with your own workspace"
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
