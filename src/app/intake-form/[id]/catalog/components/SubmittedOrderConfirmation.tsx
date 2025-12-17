"use client";

import { GeneratedImage } from "@/ui/GeneratedImage";
import {
  useGetIntakeFormSubmissionByIdQuery,
  useListIntakeFormSubmissionLineItemsQuery,
} from "@/ui/intake-forms/api";
import { RentalPricingBreakdown } from "@/ui/sales-quotes/RentalPricingBreakdown";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import {
  Building2,
  Calendar,
  CheckCircle,
  FileQuestion,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
  UserPlus,
} from "lucide-react";
import { IntakeFormAuthBanner } from "./IntakeFormAuthBanner";

interface SubmittedOrderConfirmationProps {
  submissionId: string;
  formId: string;
  projectName: string;
  companyName: string;
}

const formatPrice = (cents?: number | null): string => {
  if (!cents) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
};

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function SubmittedOrderConfirmation({
  submissionId,
  formId,
  projectName,
  companyName,
}: SubmittedOrderConfirmationProps) {
  const { isAuthenticated, isLoading: authLoading, loginWithRedirect } = useAuth0();

  // Fetch submission details
  const { data: submissionData, loading: loadingSubmission } = useGetIntakeFormSubmissionByIdQuery({
    variables: { id: submissionId },
    fetchPolicy: "cache-and-network",
  });

  // Fetch line items
  const { data: lineItemsData, loading: loadingLineItems } =
    useListIntakeFormSubmissionLineItemsQuery({
      variables: { submissionId },
      fetchPolicy: "cache-and-network",
    });

  const submission = submissionData?.getIntakeFormSubmissionById;
  const lineItems = lineItemsData?.listIntakeFormSubmissionLineItems || [];

  const handleSignUp = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: "signup",
        ...(submission?.email && { login_hint: submission.email }),
      },
      appState: {
        returnTo: `/intake-form/${formId}/orders`,
      },
    });
  };

  const handleNewRequest = () => {
    // Remove submissionId from URL and reload
    window.location.href = `/intake-form/${formId}/catalog`;
  };

  if (loadingSubmission || loadingLineItems) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading order details...</Typography>
        </Paper>
      </Container>
    );
  }

  if (!submission) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="error" gutterBottom>
            Order Not Found
          </Typography>
          <Typography>The order you&apos;re looking for could not be found.</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {/* Auth Banner for anonymous users */}
      {!authLoading && !isAuthenticated && (
        <IntakeFormAuthBanner email={submission.email} formId={formId} />
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

          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Request Submitted!
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Thank you for your equipment request. We&apos;ve received your submission and will be in
            touch shortly.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {projectName} &bull; {companyName}
          </Typography>
        </Paper>

        {/* Order ID */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "grey.200" }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Order #{submission.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Submitted on {formatDate(submission.submittedAt)}
          </Typography>
        </Paper>

        {/* Contact Information */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "grey.200" }}>
          <Typography variant="h6" fontWeight="medium" gutterBottom>
            Contact Information
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <User className="w-4 h-4 text-gray-500" />
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
              </Box>
              <Typography variant="body1">{submission.name}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Mail className="w-4 h-4 text-gray-500" />
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
              </Box>
              <Typography variant="body1">{submission.email}</Typography>
            </Grid>
            {submission.phone && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Phone className="w-4 h-4 text-gray-500" />
                  <Typography variant="body2" color="text.secondary">
                    Phone
                  </Typography>
                </Box>
                <Typography variant="body1">{submission.phone}</Typography>
              </Grid>
            )}
            {submission.companyName && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <Typography variant="body2" color="text.secondary">
                    Company
                  </Typography>
                </Box>
                <Typography variant="body1">{submission.companyName}</Typography>
              </Grid>
            )}
            {submission.purchaseOrderNumber && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  PO Number
                </Typography>
                <Typography variant="body1">{submission.purchaseOrderNumber}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Line Items */}
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "grey.200" }}>
          <Typography variant="h6" fontWeight="medium" gutterBottom>
            Items ({lineItems.length})
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {lineItems.map((item) => {
              const isRental = item.type === "RENTAL";
              const isCustom = !item.priceId || (!item.subtotalInCents && !item.priceForecast);

              return (
                <Box
                  key={item.id}
                  sx={{
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "grey.200",
                  }}
                >
                  <Box sx={{ display: "flex", gap: 2 }}>
                    {/* Image */}
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 1,
                        overflow: "hidden",
                        flexShrink: 0,
                        bgcolor: "grey.200",
                      }}
                    >
                      {item.priceId && (
                        <GeneratedImage
                          entity="price"
                          entityId={item.priceId}
                          size="list"
                          alt={item.description}
                          showIllustrativeBanner={false}
                        />
                      )}
                    </Box>

                    {/* Details */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {item.description}
                          </Typography>
                          {item.pimCategory?.name && (
                            <Typography variant="caption" color="text.secondary">
                              {item.pimCategory.name}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          {isCustom ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "warning.main",
                              }}
                            >
                              <FileQuestion size={16} />
                              <Typography variant="body2" fontWeight="medium" color="warning.main">
                                Quote pending
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body1" fontWeight="medium">
                              {formatPrice(item.subtotalInCents)}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Item Details */}
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                        <Chip
                          label={isRental ? "RENTAL" : "PURCHASE"}
                          size="small"
                          sx={{
                            bgcolor: isRental ? "blue.100" : "green.100",
                            color: isRental ? "blue.700" : "green.700",
                          }}
                        />

                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Package className="w-4 h-4 text-gray-500" />
                          <Typography variant="body2">Qty: {item.quantity}</Typography>
                        </Box>

                        {isRental && item.rentalStartDate && item.rentalEndDate && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <Typography variant="body2">
                              {formatDate(item.rentalStartDate)} - {formatDate(item.rentalEndDate)}
                            </Typography>
                          </Box>
                        )}

                        {!isRental && item.startDate && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <Typography variant="body2">
                              Delivery: {formatDate(item.startDate)}
                            </Typography>
                          </Box>
                        )}

                        {item.deliveryLocation && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <Typography variant="body2" noWrap>
                              {item.deliveryLocation}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Price Breakdown for Rentals */}
                      {isRental && item.priceForecast && item.priceForecast.days.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <RentalPricingBreakdown
                            compact={true}
                            showSavings={false}
                            isExpanded={false}
                            priceForecast={item.priceForecast}
                            subtotalInCents={item.subtotalInCents}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Order Total */}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 2 }}>
            <Typography variant="body1" fontWeight="medium">
              Order Total:
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatPrice(submission.totalInCents)}
            </Typography>
          </Box>
        </Paper>

        {/* What's Next */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
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
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
          {!authLoading && !isAuthenticated && (
            <Button
              variant="contained"
              onClick={handleSignUp}
              startIcon={<UserPlus className="w-4 h-4" />}
              sx={{ textTransform: "none" }}
            >
              Create Account to Track Orders
            </Button>
          )}
          <Button variant="outlined" onClick={handleNewRequest} sx={{ textTransform: "none" }}>
            Submit Another Request
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
