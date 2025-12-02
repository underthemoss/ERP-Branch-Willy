"use client";

import { AddressValidationField } from "@/ui/contacts/AddressValidationField";
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
import React, { useEffect, useState } from "react";
import { CartItem, useCart } from "../context/CartContext";

interface EditItemDialogProps {
  open: boolean;
  onClose: () => void;
  item: CartItem;
}

export default function EditItemDialog({ open, onClose, item }: EditItemDialogProps) {
  const cart = useCart();
  const isRental = item.priceType === "RENTAL";

  // Form state - initialize from item
  const [quantity, setQuantity] = useState(item.quantity);
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(item.deliveryDate || null);
  const [rentalStartDate, setRentalStartDate] = useState<Date | null>(item.rentalStartDate || null);
  const [rentalEndDate, setRentalEndDate] = useState<Date | null>(item.rentalEndDate || null);
  const [deliveryMethod, setDeliveryMethod] = useState<"DELIVERY" | "PICKUP">(
    item.deliveryMethod || "DELIVERY",
  );
  const [deliveryLocation, setDeliveryLocation] = useState(item.deliveryLocation || "");
  const [deliveryNotes, setDeliveryNotes] = useState(item.deliveryNotes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when item changes
  useEffect(() => {
    setQuantity(item.quantity);
    setDeliveryDate(item.deliveryDate || null);
    setRentalStartDate(item.rentalStartDate || null);
    setRentalEndDate(item.rentalEndDate || null);
    setDeliveryMethod(item.deliveryMethod || "DELIVERY");
    setDeliveryLocation(item.deliveryLocation || "");
    setDeliveryNotes(item.deliveryNotes || "");
  }, [item]);

  const getRentalDurationDisplay = () => {
    if (rentalStartDate && rentalEndDate) {
      const start = new Date(rentalStartDate);
      const end = new Date(rentalEndDate);
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return `${duration} day${duration !== 1 ? "s" : ""}`;
    }
    return "Select both dates to calculate";
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
      await cart.updateItem(item.tempId, {
        quantity: isRental ? 1 : quantity,
        deliveryDate: deliveryDate || undefined,
        rentalStartDate: rentalStartDate || undefined,
        rentalEndDate: rentalEndDate || undefined,
        deliveryMethod,
        deliveryLocation: deliveryMethod === "DELIVERY" ? deliveryLocation : undefined,
        deliveryNotes: deliveryNotes || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Error updating item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" component="span">
            Edit Item
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {item.priceName}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mt: 2 }}>
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
                    minDate={rentalStartDate || undefined}
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
                    onLocationChange={() => {}}
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
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
