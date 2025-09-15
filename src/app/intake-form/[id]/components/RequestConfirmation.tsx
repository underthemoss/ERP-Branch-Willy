"use client";

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React from "react";
import { FormData } from "../page";

interface RequestConfirmationProps {
  projectId: string;
  projectName?: string;
  projectCode?: string;
  companyName?: string;
  formData: FormData;
  onConfirm: () => void;
  onNewRequest: () => void;
  isSubmitting: boolean;
}

export default function RequestConfirmation({
  projectId,
  projectName,
  projectCode,
  formData,
  onConfirm,
  onNewRequest,
  isSubmitting,
}: RequestConfirmationProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Container maxWidth="md" sx={{ py: isMobile ? 2 : 4 }}>
      <Paper elevation={1} sx={{ p: isMobile ? 2 : 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Request Confirmation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Project {projectName || projectCode || projectId || "N/A"}
          </Typography>
        </Box>

        {/* Contact Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Contact Information
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
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="center">Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{new Date(item.startDate).toLocaleDateString()}</TableCell>
                    <TableCell align="center">{item.quantity}</TableCell>
                    <TableCell align="center">
                      {item.type === "RENTAL" ? `${item.durationInDays} days` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button variant="outlined" size="large" onClick={onNewRequest} disabled={isSubmitting}>
            Start New Request
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={onConfirm}
            disabled={isSubmitting}
            sx={{
              bgcolor: "#4A90E2",
              "&:hover": {
                bgcolor: "#357ABD",
              },
              minWidth: 150,
            }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Confirm Request"}
          </Button>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid #e0e0e0" }}>
          <Typography variant="caption" color="text.secondary">
            By confirming this request, you agree to the terms and conditions. A confirmation email
            will be sent to {formData.contact.email}.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
