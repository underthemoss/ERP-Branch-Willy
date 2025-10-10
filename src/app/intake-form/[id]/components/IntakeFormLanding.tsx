"use client";

import { Box, Button, Container, Paper, Typography, useMediaQuery, useTheme } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import React, { useEffect, useState } from "react";

interface IntakeFormLandingProps {
  projectId: string;
  projectName?: string;
  projectCode?: string;
  companyName?: string;
  logoUrl?: string;
  bannerImageUrl?: string;
  onCreateRequest: () => void;
}

export default function IntakeFormLanding({
  projectId,
  projectName,
  projectCode,
  companyName,
  logoUrl,
  bannerImageUrl,
  onCreateRequest,
}: IntakeFormLandingProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    // Get the current URL when component mounts
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

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
        "@media print": {
          minHeight: "auto",
          background: "white",
          backgroundImage: "none",
          p: 0,
          display: "block",
          "-webkit-print-color-adjust": "exact",
          "print-color-adjust": "exact",
        },
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            background: "transparent",
            color: "white",
            textAlign: "center",
            p: isMobile ? 3 : 5,
            "@media print": {
              background: "white",
              color: "#333",
              p: 4,
              border: "2px solid #e0e0e0",
              borderRadius: 2,
              mt: 4,
            },
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
                  "@media print": {
                    height: 80,
                    border: "1px solid #e0e0e0",
                  },
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
                  "@media print": {
                    width: 80,
                    height: 80,
                    border: "2px solid #4A90E2",
                  },
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    color: "#4A90E2",
                    "@media print": {
                      fontSize: "2rem",
                    },
                  }}
                >
                  🏗️
                </Typography>
              </Box>
            )}
            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
                "@media print": {
                  opacity: 1,
                  color: "#666",
                  fontSize: "1rem",
                  fontWeight: 500,
                },
              }}
            >
              {companyName || "Your company"}
            </Typography>
          </Box>

          {/* Title */}
          <Typography
            variant={isMobile ? "h4" : "h3"}
            sx={{
              fontWeight: 300,
              mb: 2,
              lineHeight: 1.2,
              "@media print": {
                color: "#333",
                fontWeight: 400,
                fontSize: "2rem",
                mb: 3,
              },
            }}
          >
            {(projectName || projectCode || "Project") + " -"}
            <br />
            Equipment
            <br />
            Request Portal
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              opacity: 0.9,
              fontSize: isMobile ? "0.9rem" : "1rem",
              "@media print": {
                opacity: 1,
                color: "#555",
                fontSize: "1.1rem",
                mb: 5,
                "& strong": {
                  color: "#333",
                },
              },
            }}
          >
            This portal makes it easy to request equipment you need for work on{" "}
            <strong>{projectName || projectCode || "this project"}</strong>. Simply share your
            details and we&#39;ll coordinate with you to get it on site.
          </Typography>

          {/* CTA Button */}
          <Button
            variant="contained"
            size="large"
            onClick={onCreateRequest}
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
              "@media print": {
                display: "none", // Hide button in print
              },
            }}
          >
            Create Request
          </Button>

          {/* Print-only CTA text */}
          <Box
            sx={{
              display: "none",
              "@media print": {
                display: "block",
                mt: 3,
                p: 2,
                border: "2px solid #4A90E2",
                borderRadius: 1,
                bgcolor: "#f0f8ff",
              },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "#4A90E2",
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Create Request
            </Typography>
            <Typography variant="body2" sx={{ color: "#666", mt: 1 }}>
              Visit the URL or scan the QR code below to submit your equipment request
            </Typography>
          </Box>

          {/* QR Code Section */}
          {currentUrl && (
            <Box
              sx={{
                mt: 5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                "@media print": {
                  mt: 4,
                  pt: 4,
                  borderTop: "1px solid #e0e0e0",
                },
              }}
            >
              <Box
                sx={{
                  bgcolor: "white",
                  p: 2,
                  borderRadius: 2,
                  display: "inline-block",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  "@media print": {
                    boxShadow: "none",
                    border: "2px solid #333",
                    p: 3,
                  },
                }}
              >
                <QRCodeSVG
                  value={currentUrl}
                  size={isMobile ? 180 : 220}
                  level="M"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: "white",
                  textAlign: "center",
                  opacity: 0.95,
                  fontWeight: 500,
                  "@media print": {
                    color: "#333",
                    opacity: 1,
                    fontSize: "1rem",
                    fontWeight: 600,
                  },
                }}
              >
                Scan to access this form on your mobile device
              </Typography>

              {/* Print-only URL display */}
              <Typography
                variant="body2"
                sx={{
                  display: "none",
                  "@media print": {
                    display: "block",
                    color: "#666",
                    fontSize: "0.9rem",
                    wordBreak: "break-all",
                    maxWidth: "80%",
                    textAlign: "center",
                    mt: 1,
                  },
                }}
              >
                {currentUrl}
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
