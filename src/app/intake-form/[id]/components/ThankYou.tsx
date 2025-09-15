"use client";

import { Box, Button, Container, Paper, Typography, useMediaQuery, useTheme } from "@mui/material";
import React from "react";

interface ThankYouProps {
  projectId: string;
  projectName?: string;
  projectCode?: string;
  companyName?: string;
  logoUrl?: string;
  bannerImageUrl?: string;
  requestNumber?: string;
  onPortalHome: () => void;
}

export default function ThankYou({
  projectId,
  projectName,
  projectCode,
  companyName,
  logoUrl,
  bannerImageUrl,
  requestNumber,
  onPortalHome,
}: ThankYouProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: bannerImageUrl
          ? `linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.6) 100%), url(${bannerImageUrl})`
          : "linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            background: "transparent",
            color: "white",
            textAlign: "center",
            p: isMobile ? 3 : 5,
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 4, textAlign: "center" }}>
            {logoUrl ? (
              <Box
                component="img"
                src={logoUrl}
                alt="Logo"
                sx={{
                  height: 60,
                  width: "auto",
                  borderRadius: 1,
                  bgcolor: "white",
                  p: 1,
                  display: "inline-block",
                  mb: 2,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: "white",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h5" sx={{ color: "#4A90E2" }}>
                  🏗️
                </Typography>
              </Box>
            )}
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {companyName || "Your company"}
            </Typography>
          </Box>

          {/* Thank You Message */}
          <Typography
            variant={isMobile ? "h3" : "h2"}
            sx={{
              fontWeight: 300,
              mb: 3,
              lineHeight: 1.2,
            }}
          >
            Thank you
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              mb: 1,
              opacity: 0.9,
              fontSize: isMobile ? "0.9rem" : "1rem",
            }}
          >
            Request No. <strong>{requestNumber || "#24802"}</strong> has been received for{" "}
            <strong>{projectName || projectCode || projectId || "this project"}</strong>. Keep this
            link handy - you can come back anytime
            <br />
            to submit new request.
          </Typography>

          {/* CTA Button */}
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={onPortalHome}
              sx={{
                bgcolor: "white",
                color: "#4A90E2",
                px: 4,
                py: 1.5,
                fontSize: isMobile ? "0.9rem" : "1rem",
                fontWeight: 600,
                textTransform: "uppercase",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                },
              }}
            >
              Portal Home
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 6, pt: 4, borderTop: "1px solid rgba(255, 255, 255, 0.2)" }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              This portal is managed by{" "}
              <strong style={{ opacity: 1 }}>{companyName || "Your company"}</strong>. If you need
              help,
              <br />
              Contact us at <strong style={{ opacity: 1 }}>[tenant.support.email@phone]</strong>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
