"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React from "react";
import { FormData, LineItem } from "../page";
import LineItemsTable from "./LineItemsTable";

interface RequestConfirmationProps {
  projectId: string;
  projectName?: string;
  projectCode?: string;
  companyName?: string;
  workspaceLogo?: string | null;
  formData: FormData;
  lineItems?: LineItem[];
  submissionStatus?: "DRAFT" | "SUBMITTED";
  onConfirm: () => void;
  onNewRequest: () => void;
  onBack?: () => void;
  isSubmitting: boolean;
}

export default function RequestConfirmation({
  projectId,
  projectName,
  projectCode,
  companyName,
  workspaceLogo,
  formData,
  lineItems,
  submissionStatus = "DRAFT",
  onConfirm,
  onNewRequest,
  onBack,
  isSubmitting,
}: RequestConfirmationProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <Container maxWidth="md" sx={{ py: isMobile ? 2 : 4 }}>
        <Paper elevation={3} sx={{ overflow: "hidden" }}>
          {/* Project Header */}
          <Box
            sx={{
              bgcolor: "grey.50",
              p: isMobile ? 2 : 3,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight="600" color="text.primary" gutterBottom>
                  Request Confirmation
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography variant="body1" color="text.secondary">
                    Project:
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    {projectName || "Unnamed Project"}
                  </Typography>
                  {projectCode && (
                    <Chip
                      label={`Code: ${projectCode}`}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </Box>
              <Chip
                label={submissionStatus === "SUBMITTED" ? "Submitted" : "Draft"}
                color={submissionStatus === "SUBMITTED" ? "success" : "default"}
                size="medium"
                icon={submissionStatus === "SUBMITTED" ? <CheckCircleIcon /> : undefined}
                sx={{
                  fontWeight: 600,
                  px: 2,
                  height: 32,
                }}
              />
            </Box>
          </Box>

          <Box sx={{ p: isMobile ? 2 : 4 }}>
            {/* Status Alert */}
            {submissionStatus === "SUBMITTED" ? (
              <Alert severity="success" sx={{ mb: 3 }}>
                Your request has been successfully submitted! A confirmation email has been sent to{" "}
                {formData.contact.email}.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                Please review your request details below. Once you confirm, your request will be
                submitted for processing.
              </Alert>
            )}

            {/* Contact Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Your Contact Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">{formData.contact.fullName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{formData.contact.email}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1">{formData.contact.phoneNumber}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Company
                  </Typography>
                  <Typography variant="body1">{formData.contact.company}</Typography>
                </Grid>
                {formData.contact.purchaseOrderNumber && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">
                      Purchase Order Number
                    </Typography>
                    <Typography variant="body1">{formData.contact.purchaseOrderNumber}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Line Items */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Request Items
              </Typography>
              <LineItemsTable lineItems={lineItems || formData.lineItems} showActions={false} />
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
              {submissionStatus === "DRAFT" ? (
                <>
                  {onBack && (
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={onBack}
                      disabled={isSubmitting}
                    >
                      Back to Edit
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    size="large"
                    onClick={onConfirm}
                    disabled={isSubmitting}
                    sx={{
                      minWidth: 150,
                      ml: onBack ? 0 : "auto",
                    }}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outlined" size="large" onClick={onNewRequest}>
                    Start New Request
                  </Button>
                  <Typography
                    variant="body2"
                    color="success.main"
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <CheckCircleIcon fontSize="small" />
                    Request Successfully Submitted
                  </Typography>
                </>
              )}
            </Box>

            {/* Footer */}
            {submissionStatus === "DRAFT" && (
              <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid #e0e0e0" }}>
                <Typography variant="caption" color="text.secondary">
                  By submitting this request, you agree to the terms and conditions. A confirmation
                  email will be sent to {formData.contact.email}.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </>
  );
}
