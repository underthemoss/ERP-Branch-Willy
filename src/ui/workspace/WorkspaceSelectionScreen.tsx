"use client";

import { useWorkspace } from "@/providers/WorkspaceProvider";
import { Add, ArrowForward, Business, HourglassEmpty } from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  CircularProgress,
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
  const { workspaces, selectWorkspace, isLoadingWorkspaces } = useWorkspace();
  const [showCreateFlow, setShowCreateFlow] = useState(false);

  console.log(workspaces);
  const handleWorkspaceCreated = (workspaceId: string) => {
    console.log("Workspace created:", workspaceId);
    selectWorkspace(workspaceId);
  };

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
              minHeight: 200,
            }}
          >
            {isLoadingWorkspaces ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 8,
                }}
              >
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Loading workspaces...
                </Typography>
              </Box>
            ) : (
              <List sx={{ py: 0 }}>
                {/* Show existing workspaces */}
                {workspaces && workspaces.length > 0 ? (
                  workspaces.map((workspace: any, index: number) => (
                    <ListItem
                      key={workspace.id}
                      disablePadding
                      sx={{
                        borderBottom:
                          index < workspaces.length - 1
                            ? `1px solid ${alpha(theme.palette.divider, 0.08)}`
                            : "none",
                      }}
                    >
                      <ListItemButton
                        onClick={() => {
                          if (workspace.id) {
                            selectWorkspace(workspace.id);
                          }
                        }}
                        sx={{
                          py: 2,
                          px: 2,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                      >
                        {/* Square banner with centered logo avatar */}
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            position: "relative",
                            borderRadius: 2,
                            overflow: "hidden",
                            bgcolor: workspace.bannerImageUrl
                              ? "transparent"
                              : alpha(theme.palette.primary.main, 0.1),
                            backgroundImage: workspace.bannerImageUrl
                              ? `url(${workspace.bannerImageUrl})`
                              : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {/* Logo Avatar */}
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              bgcolor: "background.paper",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: 1,
                              border: `2px solid ${alpha(theme.palette.background.paper, 0.9)}`,
                            }}
                          >
                            {workspace.logoUrl ? (
                              <Box
                                component="img"
                                src={workspace.logoUrl}
                                alt={workspace.name}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <Business sx={{ color: "primary.main", fontSize: 24 }} />
                            )}
                          </Box>
                        </Box>

                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {workspace.name || "Unnamed Workspace"}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {workspace.description || "No description"}
                              </Typography>
                              {workspace.domain && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "primary.main",
                                    display: "inline-block",
                                    mt: 0.5,
                                  }}
                                >
                                  {workspace.domain}
                                </Typography>
                              )}
                            </Box>
                          }
                          sx={{ ml: 2 }}
                        />
                        <ArrowForward sx={{ color: "text.secondary" }} />
                      </ListItemButton>
                    </ListItem>
                  ))
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      py: 6,
                      px: 3,
                    }}
                  >
                    <HourglassEmpty sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      No workspaces yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      Create your first workspace to get started
                    </Typography>
                  </Box>
                )}

                {/* Create New Workspace */}
                <ListItem
                  disablePadding
                  sx={{
                    borderTop:
                      workspaces && workspaces.length > 0
                        ? `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        : "none",
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
            )}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
