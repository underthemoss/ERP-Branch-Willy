"use client";

import { useAuth0ErpUser } from "@/hooks/useAuth0ErpUser";
import { useOrganization } from "@/providers/OrganizationProvider";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { ArrowForward, Dashboard } from "@mui/icons-material";
import {
  alpha,
  Box,
  Card,
  CardContent,
  Container,
  Fade,
  Grid,
  LinearProgress,
  Typography,
  useTheme,
} from "@mui/material";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface AppContextResolverProps {
  children: ReactNode;
}

// Unified loading component
interface LoadingScreenProps {
  message: string;
}

function LoadingScreen({ message }: LoadingScreenProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.1,
        )} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
        backgroundSize: "200% 200%",
        animation: "gradientShift 3s ease infinite",
        "@keyframes gradientShift": {
          "0%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
          "100%": {
            backgroundPosition: "0% 50%",
          },
        },
      }}
    >
      <Box
        sx={{
          textAlign: "center",
          width: "100%",
          maxWidth: 400,
          px: 3,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
          <Image
            src="/logo-erp.png"
            alt="EquipmentShare"
            width={200}
            height={60}
            priority
            style={{ objectFit: "contain", width: "auto", height: "auto" }}
          />
        </Box>
        <Box sx={{ position: "relative" }}>
          <LinearProgress
            sx={{
              mb: 3,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              "& .MuiLinearProgress-bar": {
                borderRadius: 1.5,
                background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              },
            }}
          />
        </Box>
        <Fade in={true} timeout={800}>
          <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500 }}>
            {message}
          </Typography>
        </Fade>
      </Box>
    </Box>
  );
}

// Workspace selection screen component
interface WorkspaceSelectionScreenProps {
  workspaces: any[];
  onSelectWorkspace: (workspaceId: string) => void;
}

function WorkspaceSelectionScreen({
  workspaces,
  onSelectWorkspace,
}: WorkspaceSelectionScreenProps) {
  const theme = useTheme();

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
              Select a workspace
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Choose the workspace you&apos;d like to access
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {workspaces.map((workspace, index) => (
              <Grid key={workspace.id || index} size={{ xs: 12, sm: 6 }}>
                <Card
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: theme.shadows[8],
                      borderColor: theme.palette.primary.main,
                      "& .arrow-icon": {
                        transform: "translateX(4px)",
                      },
                    },
                  }}
                  onClick={() => workspace.id && onSelectWorkspace(workspace.id)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: `linear-gradient(135deg, ${alpha(
                              theme.palette.primary.main,
                              0.1,
                            )} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                          }}
                        >
                          <Dashboard sx={{ color: theme.palette.primary.main }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {workspace.name || "Unnamed Workspace"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Workspace ID: {workspace.id}
                          </Typography>
                        </Box>
                      </Box>
                      <ArrowForward
                        className="arrow-icon"
                        sx={{
                          color: "text.secondary",
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

// Main component - now much simpler
export function AppContextResolver({ children }: AppContextResolverProps) {
  const pathname = usePathname();
  const { user } = useAuth0ErpUser();
  const { selectedOrg, isLoading: isLoadingOrganizations } = useOrganization();
  const { workspaces, isLoadingWorkspaces, selectWorkspace } = useWorkspace();

  // Check if user is platform admin accessing admin routes
  const isAdminRoute = pathname?.startsWith("/admin");
  const isPlatformAdminOnAdminRoute = user?.isPlatformAdmin && isAdminRoute;

  // Skip organization selection for platform admins on admin routes
  if (isPlatformAdminOnAdminRoute && !isLoadingOrganizations) {
    return <>{children}</>;
  }

  // Determine loading message
  const getLoadingMessage = () => {
    if (isLoadingOrganizations) return "Setting up your environment";
    if (isLoadingWorkspaces) return "Loading workspaces";
    return "Loading";
  };

  // Show loading screen if any loading state is active
  if (isLoadingOrganizations || isLoadingWorkspaces) {
    return <LoadingScreen message={getLoadingMessage()} />;
  }

  // Show workspace selection if organization is selected but no workspace
  if (selectedOrg && workspaces && workspaces.length > 1) {
    return <WorkspaceSelectionScreen workspaces={workspaces} onSelectWorkspace={selectWorkspace} />;
  }

  // If we have both organization and workspace, render children
  if (selectedOrg && workspaces) {
    return <>{children}</>;
  }

  // Fallback loading state
  return <LoadingScreen message="Loading" />;
}
