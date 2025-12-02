"use client";

import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { CheckCircle, Package } from "lucide-react";
import React from "react";

interface OrderConfirmationProps {
  projectName: string;
  companyName: string;
}

export default function OrderConfirmation({ projectName, companyName }: OrderConfirmationProps) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5", py: 8 }}>
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          {/* Success Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "success.light",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <CheckCircle size={48} className="text-green-600" />
          </Box>

          {/* Title */}
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Request Submitted!
          </Typography>

          {/* Description */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Thank you for your equipment request. We&apos;ve received your submission and will be in
            touch shortly.
          </Typography>

          {/* Project Info */}
          <Box
            sx={{
              p: 3,
              bgcolor: "grey.50",
              borderRadius: 2,
              mb: 4,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <Package size={20} className="text-gray-600" />
              <Typography variant="subtitle1" fontWeight="medium">
                {projectName}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {companyName}
            </Typography>
          </Box>

          {/* What's Next */}
          <Box sx={{ textAlign: "left", mb: 4 }}>
            <Typography variant="subtitle2" gutterBottom>
              What happens next?
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                You&apos;ll receive a confirmation email with your request details
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Our team will review your request and confirm availability
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                We&apos;ll contact you with pricing and next steps
              </Typography>
            </Box>
          </Box>

          {/* Action Button */}
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            sx={{ textTransform: "none" }}
          >
            Submit Another Request
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
