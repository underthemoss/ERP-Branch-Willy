"use client";

import { useAuth0ErpUser } from "@/hooks/useAuth0ErpUser";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { WorkspaceSelectionScreen } from "@/ui/workspace/WorkspaceSelectionScreen";
import { alpha, Box, Fade, LinearProgress, Typography, useTheme } from "@mui/material";
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

// Main component - now much simpler
export function AppContextResolver({ children }: AppContextResolverProps) {
  const pathname = usePathname();
  const { user } = useAuth0ErpUser();
  const { workspaces, isLoadingWorkspaces } = useWorkspace();

  // Check if user is platform admin accessing admin routes
  const isAdminRoute = pathname?.startsWith("/admin");
  const isPlatformAdminOnAdminRoute = user?.isPlatformAdmin && isAdminRoute;

  // Skip workspace selection for platform admins on admin routes
  if (isPlatformAdminOnAdminRoute && !isLoadingWorkspaces) {
    return <>{children}</>;
  }

  // Show loading screen if loading workspaces
  if (isLoadingWorkspaces) {
    return <LoadingScreen message="Loading workspaces" />;
  }

  // Show workspace selection if multiple workspaces
  if (workspaces) {
    return <WorkspaceSelectionScreen />;
  }

  // If we have workspaces, render children
  if (workspaces) {
    return <>{children}</>;
  }

  // Fallback loading state
  return <LoadingScreen message="Loading" />;
}
