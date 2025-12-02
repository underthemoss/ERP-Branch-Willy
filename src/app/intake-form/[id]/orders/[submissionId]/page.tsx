"use client";

import { IntakeFormSubmissionLineItemFieldsFragment } from "@/graphql/graphql";
import { GeneratedImage } from "@/ui/GeneratedImage";
import {
  useGetIntakeFormByIdQuery,
  useGetIntakeFormSubmissionByIdQuery,
  useListIntakeFormSubmissionLineItemsQuery,
} from "@/ui/intake-forms/api";
import { RentalPricingBreakdown } from "@/ui/sales-quotes/RentalPricingBreakdown";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  FileQuestion,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import OrdersHeader from "../components/OrdersHeader";

// Check if a line item is a custom/unlisted item (no priceId or no pricing)
const isCustomLineItem = (item: IntakeFormSubmissionLineItemFieldsFragment): boolean => {
  return !item.priceId || (!item.subtotalInCents && !item.priceForecast);
};

// Helper to determine line item status
function getLineItemStatus(
  lineItem: IntakeFormSubmissionLineItemFieldsFragment,
): "pending" | "accepted" | "assigned" {
  if (lineItem.inventoryReservations && lineItem.inventoryReservations.length > 0) {
    return "assigned";
  }
  if (lineItem.salesOrderId) {
    return "accepted";
  }
  return "pending";
}

function LineItemStatusChip({ status }: { status: "pending" | "accepted" | "assigned" }) {
  const config = {
    pending: {
      label: "Pending",
      color: "warning" as const,
      icon: <Clock className="w-3 h-3" />,
    },
    accepted: {
      label: "Accepted",
      color: "info" as const,
      icon: <CheckCircle className="w-3 h-3" />,
    },
    assigned: {
      label: "Equipment Assigned",
      color: "success" as const,
      icon: <Truck className="w-3 h-3" />,
    },
  };

  const { label, color, icon } = config[status];

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      icon={<Box sx={{ display: "flex", pl: 0.5 }}>{icon}</Box>}
    />
  );
}

function OrderStatusTimeline({ status }: { status: "pending" | "processing" | "assigned" }) {
  const steps = [
    { key: "submitted", label: "Submitted", icon: ShoppingBag },
    { key: "processing", label: "Processing", icon: Package },
    { key: "assigned", label: "Equipment Assigned", icon: Truck },
  ];

  const currentIndex = status === "pending" ? 0 : status === "processing" ? 1 : 2;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const Icon = step.icon;

        return (
          <Box key={step.key} sx={{ display: "flex", alignItems: "center" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isCompleted ? "primary.main" : "grey.200",
                  color: isCompleted ? "white" : "grey.500",
                  border: isCurrent ? "2px solid" : "none",
                  borderColor: "primary.main",
                }}
              >
                <Icon className="w-5 h-5" />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: isCurrent ? "bold" : "normal",
                  color: isCompleted ? "text.primary" : "text.secondary",
                }}
              >
                {step.label}
              </Typography>
            </Box>
            {index < steps.length - 1 && (
              <Box
                sx={{
                  width: 60,
                  height: 2,
                  bgcolor: index < currentIndex ? "primary.main" : "grey.200",
                  mx: 1,
                  mt: -2,
                }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const { loginWithRedirect, user } = useAuth0();
  const formId = params.id as string;
  const submissionId = params.submissionId as string;

  // Query to get the intake form
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

  // Query to get submission details
  const { data: submissionData, loading: loadingSubmission } = useGetIntakeFormSubmissionByIdQuery({
    variables: { id: submissionId },
    fetchPolicy: "cache-and-network",
    skip: !submissionId,
  });

  const submission = submissionData?.getIntakeFormSubmissionById;

  // Query to get line items
  const { data: lineItemsData, loading: loadingLineItems } =
    useListIntakeFormSubmissionLineItemsQuery({
      variables: { submissionId },
      fetchPolicy: "cache-and-network",
      skip: !submissionId,
    });

  const lineItems = lineItemsData?.listIntakeFormSubmissionLineItems || [];

  // Helper to get order overall status
  const getOrderStatus = (): "pending" | "processing" | "assigned" => {
    if (lineItems.length === 0) {
      if (submission?.salesOrder?.status === "SUBMITTED") {
        return "processing";
      }
      return "pending";
    }

    const statuses = lineItems.map(getLineItemStatus);

    if (statuses.every((s) => s === "assigned")) {
      return "assigned";
    }

    if (statuses.some((s) => s === "accepted" || s === "assigned")) {
      return "processing";
    }

    if (submission?.salesOrder?.status === "SUBMITTED") {
      return "processing";
    }

    return "pending";
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPrice = (cents?: number | null): string => {
    if (!cents) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Loading state
  if (loadingForm || loadingSubmission || loadingLineItems) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading order details...</Typography>
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
            <Typography>You do not have permission to view this order.</Typography>
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

  // Form or submission not found
  if (!intakeForm || !submission) {
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

  const orderStatus = getOrderStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <OrdersHeader
        projectName={intakeForm?.project?.name || "Equipment Request"}
        companyName={intakeForm?.workspace?.name || ""}
        logoUrl={intakeForm?.workspace?.logoUrl || undefined}
        formId={formId}
      />

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Back link */}
        <Link
          href={`/intake-form/${formId}/orders`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </Link>

        {/* Order Header */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
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
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Order #{submission.id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submitted on {formatDate(submission.submittedAt)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Status Timeline */}
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <OrderStatusTimeline status={orderStatus} />
          </Box>
        </Paper>

        {/* Contact Information */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Contact Information
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1">{submission.name}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">{submission.email}</Typography>
            </Grid>
            {submission.phone && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">{submission.phone}</Typography>
              </Grid>
            )}
            {submission.companyName && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Company
                </Typography>
                <Typography variant="body1">{submission.companyName}</Typography>
              </Grid>
            )}
            {submission.purchaseOrderNumber && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  PO Number
                </Typography>
                <Typography variant="body1">{submission.purchaseOrderNumber}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Line Items */}
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Items ({lineItems.length})
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {lineItems.map((item) => {
              const status = getLineItemStatus(item);
              const isRental = item.type === "RENTAL";

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
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          {isCustomLineItem(item) ? (
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
                          <LineItemStatusChip status={status} />
                        </Box>
                      </Box>

                      {/* Item Details */}
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 2,
                          mt: 1,
                        }}
                      >
                        {/* Type Badge */}
                        <Chip
                          label={isRental ? "RENTAL" : "PURCHASE"}
                          size="small"
                          sx={{
                            bgcolor: isRental ? "blue.100" : "green.100",
                            color: isRental ? "blue.700" : "green.700",
                          }}
                        />

                        {/* Quantity */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Package className="w-4 h-4 text-gray-500" />
                          <Typography variant="body2">Qty: {item.quantity}</Typography>
                        </Box>

                        {/* Dates */}
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

                        {/* Location */}
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
                            isExpanded={true}
                            priceForecast={item.priceForecast}
                            subtotalInCents={item.subtotalInCents}
                          />
                        </Box>
                      )}

                      {/* Assigned Equipment */}
                      {status === "assigned" &&
                        item.inventoryReservations &&
                        item.inventoryReservations.length > 0 && (
                          <Box
                            sx={{
                              mt: 2,
                              p: 1.5,
                              bgcolor: "success.50",
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "success.200",
                            }}
                          >
                            <Typography
                              variant="caption"
                              fontWeight="bold"
                              color="success.main"
                              sx={{ display: "block", mb: 0.5 }}
                            >
                              Assigned Equipment:
                            </Typography>
                            {item.inventoryReservations.map((reservation) => (
                              <Typography key={reservation.id} variant="body2" color="success.dark">
                                {reservation.inventory?.asset?.name ||
                                  reservation.inventory?.pimCategoryName ||
                                  `Equipment #${reservation.inventoryId.slice(0, 8)}`}
                              </Typography>
                            ))}
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

        {/* Browse More */}
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Link
            href={`/intake-form/${formId}/catalog`}
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Catalog
          </Link>
        </Box>
      </Container>
    </div>
  );
}
