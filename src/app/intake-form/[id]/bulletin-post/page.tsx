"use client";

import { useGetIntakeFormByIdQuery } from "@/ui/intake-forms/api";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import React, { useEffect, useState } from "react";

export default function BulletinPostPage() {
  const params = useParams();
  const formId = params.id as string;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { loginWithRedirect, user } = useAuth0();
  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    // Get the catalog URL when component mounts
    if (typeof window !== "undefined") {
      // Point to the catalog page instead of this bulletin-post page
      const baseUrl = window.location.origin;
      setCurrentUrl(`${baseUrl}/intake-form/${formId}/catalog`);
    }
  }, [formId]);

  // Query to get the intake form by ID
  const {
    data: intakeFormData,
    loading: loadingForm,
    error: formError,
  } = useGetIntakeFormByIdQuery({
    variables: { id: formId },
    fetchPolicy: "cache-and-network",
    skip: !formId,
  });

  const intakeForm = intakeFormData?.getIntakeFormById;
  const projectName = intakeForm?.project?.name;
  const projectCode = intakeForm?.project?.projectCode;
  const companyName = intakeForm?.workspace?.name;
  const logoUrl = intakeForm?.workspace?.logoUrl;
  const bannerImageUrl = intakeForm?.workspace?.bannerImageUrl;

  // Loading state
  if (loadingForm) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading...</Typography>
        </Paper>
      </Container>
    );
  }

  // Permission error
  if (formError && formError.message.includes("permission")) {
    if (user) {
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="error" gutterBottom>
              Access Denied
            </Typography>
            <Typography>
              You do not have permission to access this intake form. Please contact the form
              administrator for access.
            </Typography>
          </Paper>
        </Container>
      );
    }
    loginWithRedirect({
      appState: {
        returnTo: window.location.pathname,
      },
    });
    return null;
  }

  // Form not found
  if (formError || (!loadingForm && !intakeForm)) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="error" gutterBottom>
            Form Not Found
          </Typography>
          <Typography>
            The intake form you&apos;re looking for could not be found or is no longer active.
          </Typography>
        </Paper>
      </Container>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Header - Hidden in print */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bgcolor: "white",
          borderBottom: "1px solid",
          borderColor: "grey.200",
          px: 3,
          py: 2,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          "@media print": {
            display: "none",
          },
        }}
      >
        <Link
          href={`/intake-form/${formId}/catalog`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          <span>Back to Catalog</span>
        </Link>
        <Button
          variant="contained"
          startIcon={<Printer size={18} />}
          onClick={handlePrint}
          sx={{ textTransform: "none" }}
        >
          Print Flyer
        </Button>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          minHeight: "100vh",
          pt: "72px", // Account for fixed header
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
            pt: 0,
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
                    {companyName?.charAt(0).toUpperCase() || "E"}
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

            {/* CTA Button - Link to catalog */}
            <Button
              component={Link}
              href={`/intake-form/${formId}/catalog`}
              variant="contained"
              size="large"
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
                  display: "none",
                },
              }}
            >
              Browse Equipment
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
                Browse Equipment
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
    </>
  );
}
