"use client";

import { Box, Container, Typography, useMediaQuery, useTheme } from "@mui/material";
import React from "react";

interface IntakeFormHeaderProps {
  companyName: string;
  workspaceLogo?: string | null;
}

export default function IntakeFormHeader({ companyName, workspaceLogo }: IntakeFormHeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "primary.main",
        color: "primary.contrastText",
        py: isMobile ? 3 : 4,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {workspaceLogo && (
            <Box
              component="img"
              src={workspaceLogo}
              alt={companyName}
              sx={{
                height: isMobile ? 48 : 64,
                width: "auto",
                maxWidth: 200,
                objectFit: "contain",
                backgroundColor: "white",
                borderRadius: 1,
                p: 1,
              }}
            />
          )}
          <Box>
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight="medium">
              {companyName}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Equipment Request Portal
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
