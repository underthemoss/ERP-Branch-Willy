"use client";

import { Box, Container, Typography, useMediaQuery, useTheme } from "@mui/material";
import React from "react";

interface IntakeFormHeaderProps {
  companyName: string;
  workspaceLogo?: string | null;
  workspaceBanner?: string | null;
}

export default function IntakeFormHeader({
  companyName,
  workspaceLogo,
  workspaceBanner,
}: IntakeFormHeaderProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "primary.main",
        color: "primary.contrastText",
        py: isMobile ? 3 : 4,
        position: "relative",
        backgroundImage: workspaceBanner ? `url(${workspaceBanner})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay for better text readability when banner is present */}
      {workspaceBanner && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1,
          }}
        />
      )}

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 2 }}>
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
