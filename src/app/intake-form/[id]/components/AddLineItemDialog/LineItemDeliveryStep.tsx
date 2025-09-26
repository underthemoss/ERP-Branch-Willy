"use client";

import { AddressValidationField } from "@/ui/contacts/AddressValidationField";
import {
  Box,
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
import React, { useState } from "react";
import { NewLineItem } from "../../page";
import { StepFooterComponent } from "./AddLineItemDialog";

interface LineItemDeliveryStepProps {
  lineItem: Partial<NewLineItem>;
  onUpdate: (updates: Partial<NewLineItem>) => void;
  Footer: StepFooterComponent;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

const LineItemDeliveryStep: React.FC<LineItemDeliveryStepProps> = ({
  lineItem,
  onUpdate,
  Footer,
  onNext,
  onBack,
  onClose,
}) => {
  // Store location data for potential future use
  const [locationData, setLocationData] = useState<{
    lat: number | null;
    lng: number | null;
    placeId: string;
  }>({ lat: null, lng: null, placeId: "" });

  const handleQuantityChange = (value: string) => {
    const quantity = parseInt(value) || 1;
    onUpdate({ quantity: Math.max(1, quantity) });
  };

  const handleDeliveryMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ deliveryMethod: event.target.value as "DELIVERY" | "PICKUP" });
  };

  const handleDeliveryDateChange = (date: any) => {
    const dateValue = date ? new Date(date) : undefined;
    onUpdate({ deliveryDate: dateValue });
  };

  const handleRentalStartDateChange = (date: any) => {
    const dateValue = date ? new Date(date) : undefined;
    // Calculate duration if end date exists
    if (dateValue && lineItem.rentalEndDate) {
      const duration = Math.ceil(
        (new Date(lineItem.rentalEndDate).getTime() - dateValue.getTime()) / (1000 * 60 * 60 * 24),
      );
      onUpdate({ rentalStartDate: dateValue, rentalDuration: Math.max(1, duration) });
    } else {
      onUpdate({ rentalStartDate: dateValue });
    }
  };

  const handleRentalEndDateChange = (date: any) => {
    const dateValue = date ? new Date(date) : undefined;
    // Calculate duration if start date exists
    if (dateValue && lineItem.rentalStartDate) {
      const duration = Math.ceil(
        (dateValue.getTime() - new Date(lineItem.rentalStartDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      onUpdate({ rentalEndDate: dateValue, rentalDuration: Math.max(1, duration) });
    } else {
      onUpdate({ rentalEndDate: dateValue });
    }
  };

  const getRentalDurationDisplay = () => {
    if (lineItem.rentalStartDate && lineItem.rentalEndDate) {
      const start = new Date(lineItem.rentalStartDate);
      const end = new Date(lineItem.rentalEndDate);
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return `${duration} day${duration !== 1 ? "s" : ""}`;
    }
    return "Select both dates to calculate";
  };

  const isRental = lineItem.type === "RENTAL";

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DialogTitle>Delivery Information</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Quantity and Dates Row */}
            <Grid size={{ xs: 12, sm: isRental ? 4 : 6 }}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={lineItem.quantity || 1}
                onChange={(e) => handleQuantityChange(e.target.value)}
                inputProps={{ min: 1 }}
                size="small"
              />
            </Grid>

            {/* Delivery/Start Date */}
            <Grid size={{ xs: 12, sm: isRental ? 4 : 6 }}>
              <DatePicker
                label={isRental ? "Start Date" : "Delivery Date"}
                value={isRental ? lineItem.rentalStartDate || null : lineItem.deliveryDate || null}
                onChange={isRental ? handleRentalStartDateChange : handleDeliveryDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
              />
            </Grid>

            {/* Rental End Date (for rentals only) */}
            {isRental && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <DatePicker
                  label="Return Date"
                  value={lineItem.rentalEndDate || null}
                  onChange={handleRentalEndDateChange}
                  minDate={
                    lineItem.rentalStartDate ? new Date(lineItem.rentalStartDate) : undefined
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
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
                  value={lineItem.deliveryMethod || "DELIVERY"}
                  onChange={handleDeliveryMethodChange}
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
            <Grid size={{ xs: 12 }}>
              <AddressValidationField
                value={lineItem.deliveryLocation || ""}
                onChange={(value) => onUpdate({ deliveryLocation: value })}
                onLocationChange={(lat, lng, placeId) => setLocationData({ lat, lng, placeId })}
                label="Delivery Location"
                fullWidth
                sx={{ mb: 2 }}
              />
            </Grid>

            {/* Delivery Notes */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Additional Notes (Optional)"
                value={lineItem.deliveryNotes || ""}
                onChange={(e) => onUpdate({ deliveryNotes: e.target.value })}
                placeholder="Special instructions, access codes, etc."
                multiline
                rows={2}
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <Footer
        nextEnabled={
          !!lineItem.quantity &&
          (isRental
            ? !!lineItem.rentalStartDate && !!lineItem.rentalEndDate
            : !!lineItem.deliveryDate)
        }
        onNext={onNext}
        onBack={onBack}
        onClose={onClose}
      />
    </LocalizationProvider>
  );
};

export default LineItemDeliveryStep;
