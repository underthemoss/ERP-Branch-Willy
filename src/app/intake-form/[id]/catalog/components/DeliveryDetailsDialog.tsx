"use client";

import { AddressValidationField } from "@/ui/contacts/AddressValidationField";
import { RentalPricingBreakdown } from "@/ui/sales-quotes/RentalPricingBreakdown";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { FileQuestion } from "lucide-react";
import React, { useState } from "react";
import { DeliveryDetails, PriceHit, useCart } from "../context/CartContext";

// Check if a price hit is a custom/unlisted item (no real price)
const isCustomPriceHit = (priceHit: PriceHit): boolean => {
  return (
    priceHit.objectID.startsWith("custom-") ||
    (!priceHit.pricePerDayInCents && !priceHit.unitCostInCents)
  );
};

interface DeliveryDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  priceHit: PriceHit;
}

export default function DeliveryDetailsDialog({
  open,
  onClose,
  priceHit,
}: DeliveryDetailsDialogProps) {
  const cart = useCart();
  const isRental = priceHit.priceType === "RENTAL";

  // Form state
  const [quantity, setQuantity] = useState(1);
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);
  const [rentalStartDate, setRentalStartDate] = useState<Date | null>(null);
  const [rentalEndDate, setRentalEndDate] = useState<Date | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location data for potential future use
  const [locationData, setLocationData] = useState<{
    lat: number | null;
    lng: number | null;
    placeId: string;
  }>({ lat: null, lng: null, placeId: "" });

  const getRentalDurationDisplay = () => {
    if (rentalStartDate && rentalEndDate) {
      const start = new Date(rentalStartDate);
      const end = new Date(rentalEndDate);
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return `${duration} day${duration !== 1 ? "s" : ""}`;
    }
    return "Select both dates to calculate";
  };

  const formatPrice = (cents: number | null): string => {
    if (cents === null || cents === undefined) return "-";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const isFormValid = () => {
    if (isRental) {
      return rentalStartDate && rentalEndDate;
    }
    return quantity > 0 && deliveryDate;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;

    setIsSubmitting(true);

    try {
      const deliveryDetails: DeliveryDetails = {
        quantity: isRental ? 1 : quantity,
        deliveryDate: deliveryDate || undefined,
        rentalStartDate: rentalStartDate || undefined,
        rentalEndDate: rentalEndDate || undefined,
        deliveryMethod,
        deliveryLocation: deliveryMethod === "DELIVERY" ? deliveryLocation : undefined,
        deliveryNotes: deliveryNotes || undefined,
      };

      await cart.addItem(priceHit, deliveryDetails);
      handleClose();
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setQuantity(1);
    setDeliveryDate(null);
    setRentalStartDate(null);
    setRentalEndDate(null);
    setDeliveryMethod("DELIVERY");
    setDeliveryLocation("");
    setDeliveryNotes("");
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="span">
            Add to Request
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {priceHit.name || priceHit.pimCategoryName}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Price Summary */}
            {isCustomPriceHit(priceHit) ? (
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: "warning.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "warning.200",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "warning.main" }}>
                  <FileQuestion size={18} />
                  <Typography variant="subtitle2" color="warning.main">
                    Quote Pending
                  </Typography>
                </Box>
                <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                  This is a custom item request. We&apos;ll provide pricing after reviewing your
                  requirements.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: "grey.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "grey.200",
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  {isRental ? "Rental Pricing" : "Purchase Price"}
                </Typography>
                {isRental ? (
                  <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Daily
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatPrice(priceHit.pricePerDayInCents)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Weekly
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatPrice(priceHit.pricePerWeekInCents)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Monthly (28 days)
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatPrice(priceHit.pricePerMonthInCents)}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" fontWeight="medium">
                    {formatPrice(priceHit.unitCostInCents)} per unit
                  </Typography>
                )}
              </Box>
            )}

            <Grid container spacing={2}>
              {/* Quantity (Purchase only) */}
              {!isRental && (
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1 }}
                    size="small"
                  />
                </Grid>
              )}

              {/* Delivery/Start Date */}
              <Grid size={{ xs: 12, sm: isRental ? 6 : 8 }}>
                <DatePicker
                  label={isRental ? "Start Date" : "Delivery Date"}
                  value={isRental ? rentalStartDate : deliveryDate}
                  onChange={(date: unknown) => {
                    const dateValue = date ? new Date(date as Date) : null;
                    if (isRental) {
                      setRentalStartDate(dateValue);
                    } else {
                      setDeliveryDate(dateValue);
                    }
                  }}
                  minDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      required: true,
                    },
                  }}
                />
              </Grid>

              {/* Rental End Date (for rentals only) */}
              {isRental && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="End Date (Est.)"
                    value={rentalEndDate}
                    onChange={(date: unknown) => {
                      const dateValue = date ? new Date(date as Date) : null;
                      setRentalEndDate(dateValue);
                    }}
                    minDate={rentalStartDate || new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        required: true,
                      },
                    }}
                  />
                </Grid>
              )}

              {/* Rental Duration Caption */}
              {isRental && (
                <Grid size={{ xs: 12 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: -1, mb: 1 }}
                  >
                    Duration: {getRentalDurationDisplay()}
                  </Typography>
                </Grid>
              )}

              {/* Rental Pricing Breakdown - show when dates are selected (hide for custom items) */}
              {isRental && rentalStartDate && rentalEndDate && !isCustomPriceHit(priceHit) && (
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      bgcolor: "grey.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "grey.200",
                      p: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Estimated Cost
                    </Typography>
                    <RentalPricingBreakdown
                      priceId={priceHit.objectID}
                      startDate={rentalStartDate}
                      endDate={rentalEndDate}
                      compact={false}
                      showSavings={true}
                    />
                  </Box>
                </Grid>
              )}

              {/* Purchase Subtotal */}
              {!isRental && quantity > 0 && priceHit.unitCostInCents && (
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      bgcolor: "grey.50",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "grey.200",
                      p: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="subtitle2">Subtotal:</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatPrice(priceHit.unitCostInCents * quantity)}
                    </Typography>
                  </Box>
                </Grid>
              )}

              {/* Fulfillment Method */}
              <Grid size={{ xs: 12 }}>
                <FormControl component="fieldset" size="small">
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500 }}>
                    Fulfillment Method
                  </Typography>
                  <RadioGroup
                    row
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value as "DELIVERY" | "PICKUP")}
                  >
                    <FormControlLabel
                      value="DELIVERY"
                      control={<Radio size="small" />}
                      label="Delivery"
                      sx={{ mr: 3 }}
                    />
                    <FormControlLabel
                      value="PICKUP"
                      control={<Radio size="small" />}
                      label="Pickup"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* Delivery Location with Address Validation */}
              {deliveryMethod === "DELIVERY" && (
                <Grid size={{ xs: 12 }}>
                  <AddressValidationField
                    value={deliveryLocation}
                    onChange={setDeliveryLocation}
                    onLocationChange={(lat, lng, placeId) => setLocationData({ lat, lng, placeId })}
                    label="Delivery Location"
                    fullWidth
                  />
                </Grid>
              )}

              {/* Delivery Notes */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Additional Notes"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Special instructions, access codes, etc."
                  multiline
                  rows={2}
                  size="small"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add to Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
