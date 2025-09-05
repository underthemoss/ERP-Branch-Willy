"use client";

import { Box, Button, Typography } from "@mui/joy";
import Link from "next/link";

export default function Page() {
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
        App Not Enabled
      </Typography>
      <Typography
        level="body-md"
        sx={{
          mb: 4,
          textAlign: "center",
          maxWidth: 400,
        }}
      >
        You don&apos;t have access to this application. Please contact your administrator to enable
        access for your account.
      </Typography>
    </Box>
  );
}
