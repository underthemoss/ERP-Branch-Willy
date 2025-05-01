"use client";

import { useAuth } from "@/providers/Auth0ClientProvider";
import { Box, CircularProgress, LinearProgress, Typography } from "@mui/material";
import { redirect } from "next/navigation";

export default function Page() {
  const { user } = useAuth();

  if (user) {
    redirect("/app/");
  }

  return (
    <Box>
      <LinearProgress />
      <Box>
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
            component="h1"
            sx={{
              fontSize: "2.5rem",
              mb: 1,
              color: "text.primary",
              textAlign: "center",
            }}
          >
            🔐 Hang tight while we authenticate you
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
