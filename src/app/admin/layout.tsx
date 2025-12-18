"use client";

import { RequireAuth } from "@/providers/AuthWall";
import { ClientOnlyProvider } from "@/providers/ClientOnlyProvider";
import { useAuth0 } from "@auth0/auth0-react";
import { Box, CircularProgress, Typography } from "@mui/joy";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminChrome } from "./AdminChrome";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth0();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/auth/error");
        return;
      }

      // Check for PLATFORM_ADMIN role in the specific claim
      const roles = user?.["https://erp.estrack.com/es_erp_roles"] || [];

      const isPlatformAdmin = roles.includes("PLATFORM_ADMIN");

      if (isPlatformAdmin) {
        setIsAuthorized(true);
      } else {
        // Redirect to no-access page if not a platform admin
        router.push("/auth/no-access");
      }
      setCheckingAuth(false);
    }
  }, [user, isLoading, isAuthenticated, router]);

  if (isLoading || checkingAuth) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          bgcolor: "background.body",
        }}
      >
        <CircularProgress size="lg" />
        <Typography level="body-md" sx={{ mt: 2 }}>
          Verifying admin access...
        </Typography>
      </Box>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect
  }

  return <AdminChrome>{children}</AdminChrome>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnlyProvider>
      <RequireAuth>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </RequireAuth>
    </ClientOnlyProvider>
  );
}
