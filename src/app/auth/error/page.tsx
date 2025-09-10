"use client";

import { Home, Refresh, Warning } from "@mui/icons-material";
import { Alert, Box, Button, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorDetails, setErrorDetails] = useState<{
    error?: string;
    error_description?: string;
  }>({});

  useEffect(() => {
    // Extract error details from URL parameters
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error || errorDescription) {
      setErrorDetails({
        error: error || undefined,
        error_description: errorDescription || undefined,
      });
    }
  }, [searchParams]);

  const handleRetry = () => {
    // Clear the error and try to go back to the main page
    window.location.href = "/";
  };

  const handleGoHome = () => {
    router.push("/");
  };

  // Determine the user-friendly error message
  const getErrorMessage = () => {
    const { error, error_description } = errorDetails;

    if (error_description) {
      // Check for specific error patterns
      if (error_description.includes("USER role")) {
        return "You don't have the necessary permissions to access this application. Please contact your administrator to request access.";
      }
      if (error_description.includes("consent_required")) {
        return "Additional permissions are required. Please authorize the requested permissions to continue.";
      }
      if (error_description.includes("login_required")) {
        return "Your session has expired. Please log in again to continue.";
      }
      return error_description;
    }

    if (error === "access_denied") {
      return "Access was denied. You may not have permission to access this resource.";
    }

    if (error === "unauthorized") {
      return "You are not authorized to access this application. Please contact your administrator.";
    }

    return "An authentication error occurred. Please try again or contact support if the problem persists.";
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Box
        sx={{
          maxWidth: 600,
          width: "100%",
          textAlign: "center",
        }}
      >
        <Warning
          sx={{
            fontSize: 64,
            color: "error.main",
            mb: 3,
          }}
        />

        <Typography
          variant="h3"
          component="h1"
          sx={{
            mb: 2,
            fontWeight: 600,
            color: "text.primary",
          }}
        >
          Authentication Error
        </Typography>

        <Alert
          severity="error"
          sx={{
            mb: 4,
            textAlign: "left",
          }}
        >
          <Typography variant="body1">{getErrorMessage()}</Typography>
        </Alert>

        {/* Show technical details in development */}
        {process.env.NODE_ENV === "development" && errorDetails.error && (
          <Alert
            severity="info"
            sx={{
              mb: 4,
              textAlign: "left",
            }}
          >
            <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
              <strong>Error Code:</strong> {errorDetails.error}
              {errorDetails.error_description && (
                <>
                  <br />
                  <strong>Details:</strong> {errorDetails.error_description}
                </>
              )}
            </Typography>
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            size="large"
            startIcon={<Refresh />}
            onClick={handleRetry}
            sx={{
              minWidth: 150,
            }}
          >
            Try Again
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<Home />}
            onClick={handleGoHome}
            sx={{
              minWidth: 150,
            }}
          >
            Go to Home
          </Button>
        </Box>

        <Typography
          variant="body2"
          sx={{
            mt: 4,
            color: "text.secondary",
          }}
        >
          If you continue to experience issues, please contact your system administrator or IT
          support team for assistance.
        </Typography>
      </Box>
    </Box>
  );
}
