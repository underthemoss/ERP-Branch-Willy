"use client";

import { GeneratedImage } from "@/ui/GeneratedImage";
import { RentalPricingBreakdown } from "@/ui/sales-quotes/RentalPricingBreakdown";
import { Box, Chip, Divider, Grid, Paper, Typography } from "@mui/material";
import {
  Building2,
  Calendar,
  FileQuestion,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
} from "lucide-react";
import { CartItem, ContactInfo } from "../context/CartContext";

interface OrderConfirmationSummaryProps {
  submissionId: string;
  items: CartItem[];
  contactInfo: ContactInfo;
  totalInCents: number;
}

const formatPrice = (cents?: number | null): string => {
  if (!cents) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
};

const formatDate = (date?: Date | null): string => {
  if (!date) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Check if a cart item is a custom/unlisted item (no pricing)
const isCustomItem = (item: CartItem): boolean => {
  return (
    item.priceId.startsWith("custom-") ||
    (!item.subtotalInCents && !item.unitCostInCents && !item.pricePerDayInCents)
  );
};

export default function OrderConfirmationSummary({
  submissionId,
  items,
  contactInfo,
  totalInCents,
}: OrderConfirmationSummaryProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Order ID */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: "grey.200" }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Order #{submissionId}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Submitted on{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </Typography>
      </Paper>

      {/* Contact Information */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: "grey.200" }}>
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
            <Typography variant="body1">{contactInfo.fullName}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Mail className="w-4 h-4 text-gray-500" />
              <Typography variant="body2" color="text.secondary">
                Email
              </Typography>
            </Box>
            <Typography variant="body1">{contactInfo.email}</Typography>
          </Grid>
          {contactInfo.phoneNumber && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Phone className="w-4 h-4 text-gray-500" />
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
              </Box>
              <Typography variant="body1">{contactInfo.phoneNumber}</Typography>
            </Grid>
          )}
          {contactInfo.company && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Building2 className="w-4 h-4 text-gray-500" />
                <Typography variant="body2" color="text.secondary">
                  Company
                </Typography>
              </Box>
              <Typography variant="body1">{contactInfo.company}</Typography>
            </Grid>
          )}
          {contactInfo.purchaseOrderNumber && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                PO Number
              </Typography>
              <Typography variant="body1">{contactInfo.purchaseOrderNumber}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Line Items */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: "grey.200" }}>
        <Typography variant="h6" fontWeight="medium" gutterBottom>
          Items ({items.length})
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {items.map((item) => {
            const isRental = item.priceType === "RENTAL";
            const isCustom = isCustomItem(item);

            return (
              <Box
                key={item.tempId}
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
                    {item.priceId && !item.priceId.startsWith("custom-") && (
                      <GeneratedImage
                        entity="price"
                        entityId={item.priceId}
                        size="list"
                        alt={item.priceName}
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
                          {item.priceName}
                        </Typography>
                        {item.pimCategoryName && (
                          <Typography variant="caption" color="text.secondary">
                            {item.pimCategoryName}
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

                      {!isRental && item.deliveryDate && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <Typography variant="body2">
                            Delivery: {formatDate(item.deliveryDate)}
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
            {formatPrice(totalInCents)}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
