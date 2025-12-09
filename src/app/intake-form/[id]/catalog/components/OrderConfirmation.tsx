"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { CheckCircle, UserPlus } from "lucide-react";
import React from "react";
import { useCart } from "../context/CartContext";
import { IntakeFormAuthBanner } from "./IntakeFormAuthBanner";
import OrderConfirmationSummary from "./OrderConfirmationSummary";

interface OrderConfirmationProps {
  projectName: string;
  companyName: string;
  formId: string;
}

export default function OrderConfirmation({
  projectName,
  companyName,
  formId,
}: OrderConfirmationProps) {
  const cart = useCart();
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  const handleSignUp = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
        ...(cart.submittedContactInfo?.email && {
          login_hint: cart.submittedContactInfo.email,
        }),
      },
      appState: {
        returnTo: `/intake-form/${formId}/orders`,
      },
    });
  };

  const handleViewOrders = () => {
    window.location.href = `/intake-form/${formId}/orders`;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {/* Auth Banner for anonymous users */}
      {!isLoading && !isAuthenticated && (
        <IntakeFormAuthBanner email={cart.submittedContactInfo?.email} formId={formId} />
      )}

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Success Header */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
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
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Thank you for your equipment request. We&apos;ve received your submission and will be in
            touch shortly.
          </Typography>

          {/* Project Info */}
          <Typography variant="body2" color="text.secondary">
            {projectName} &bull; {companyName}
          </Typography>
        </Paper>

        {/* Order Summary */}
        {cart.submissionId && cart.submittedContactInfo && (
          <OrderConfirmationSummary
            submissionId={cart.submissionId}
            items={cart.items}
            contactInfo={cart.submittedContactInfo}
            totalInCents={cart.getCartTotal()}
          />
        )}

        {/* What's Next */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mt: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
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
        </Paper>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 4, flexWrap: "wrap" }}>
          {!isLoading && !isAuthenticated && (
            <Button
              variant="contained"
              onClick={handleSignUp}
              startIcon={<UserPlus className="w-4 h-4" />}
              sx={{ textTransform: "none" }}
            >
              Create Account to Track Orders
            </Button>
          )}
          {!isLoading && isAuthenticated && (
            <Button variant="contained" onClick={handleViewOrders} sx={{ textTransform: "none" }}>
              View All Orders
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            sx={{ textTransform: "none" }}
          >
            Submit Another Request
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
