"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Box, Button, Typography } from "@mui/joy";
import { useCallback } from "react";

export default function Page() {
  const { loginWithRedirect } = useAuth0();

  const handleReAuthenticate = useCallback(() => {
    // Force re-authentication to get a fresh token with updated roles
    loginWithRedirect({
      authorizationParams: {
        prompt: "login", // Force re-authentication
      },
    });
  }, [loginWithRedirect]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        bgcolor: "background.body",
        p: 3,
      }}
    >
      <Typography
        level="h1"
        component="h1"
        sx={{
          fontSize: "3rem",
          mb: 2,
          color: "text.primary",
        }}
      >
        Access Required
      </Typography>
      <Typography
        level="body-md"
        sx={{
          mb: 4,
          textAlign: "center",
          maxWidth: 400,
        }}
      >
        You don&apos;t currently have access to this application. Please contact your account
        administrator to request access.
      </Typography>
      <Typography
        level="body-sm"
        sx={{
          mb: 3,
          textAlign: "center",
          maxWidth: 400,
          color: "text.secondary",
        }}
      >
        Already been granted access? Sign in again to continue.
      </Typography>
      <Button
        size="lg"
        variant="solid"
        color="primary"
        onClick={handleReAuthenticate}
        sx={{
          px: 4,
          py: 1.5,
        }}
      >
        Sign In Again
      </Button>
    </Box>
  );
}
