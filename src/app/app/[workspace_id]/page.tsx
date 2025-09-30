"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import * as React from "react";

export default function DashboardMainSection() {
  const { user } = useAuth0();

  return (
    <>
      <Box>
        <Typography variant="h1">Welcome Back, {user?.name} 👋 </Typography>
        <Typography>Let&apos;s torque today!</Typography>
      </Box>
    </>
  );
}
