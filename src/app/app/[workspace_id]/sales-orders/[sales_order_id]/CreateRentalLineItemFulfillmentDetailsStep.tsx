"use client";

import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { MultiInputDateRangeField } from "@mui/x-date-pickers-pro/MultiInputDateRangeField";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { Dayjs } from "dayjs";
import React from "react";

export interface FulfillmentDetailsStepProps {
  fulfillmentMethod: "Delivery" | "Pickup";
  setFulfillmentMethod: (v: "Delivery" | "Pickup") => void;
  deliveryLocation: string;
  setDeliveryLocation: (v: string) => void;
  deliveryCharge: string;
  setDeliveryCharge: (v: string) => void;
  dateRange: [string | null, string | null]; // ISO strings
  setDateRange: (v: [string | null, string | null]) => void;
  onCancel: () => void;
  onContinue: () => void;
  onBack: () => void;
}

const CreateRentalLineItemFulfillmentDetailsStep: React.FC<FulfillmentDetailsStepProps> = ({
  fulfillmentMethod,
  setFulfillmentMethod,
  deliveryLocation,
  setDeliveryLocation,
  deliveryCharge,
  setDeliveryCharge,
  dateRange,
  setDateRange,
  onCancel,
  onContinue,
  onBack,
}) => {
  // Convert ISO strings to dayjs objects for the DateRangePicker
  const internalDateRange: [Dayjs | null, Dayjs | null] = [
    dateRange[0] ? dayjs(dateRange[0]) : null,
    dateRange[1] ? dayjs(dateRange[1]) : null,
  ];

  // Convert dayjs objects back to ISO strings when date changes
  const handleDateRangeChange = (newValue: [Dayjs | null, Dayjs | null]) => {
    setDateRange([newValue[0]?.toISOString() ?? null, newValue[1]?.toISOString() ?? null]);
  };

  return (
    <>
      <DialogTitle>Fulfillment Details</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Complete the fields to record a sale. For ownership transfers, check the box to skip lease
          terms.
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Fulfillment Method</InputLabel>
          <Select
            value={fulfillmentMethod}
            onChange={(e) => setFulfillmentMethod(e.target.value as "Delivery" | "Pickup")}
            label="Fulfillment Method"
          >
            <MenuItem value="Delivery">Delivery</MenuItem>
            <MenuItem value="Pickup">Pickup</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Delivery Location</InputLabel>
          <OutlinedInput
            value={deliveryLocation}
            onChange={(e) => setDeliveryLocation(e.target.value)}
            label="Delivery Location"
            startAdornment={<SearchIcon sx={{ color: "action.active", mr: 1, my: 0.5 }} />}
          />
        </FormControl>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Delivery Charge</InputLabel>
          <OutlinedInput
            value={deliveryCharge}
            onChange={(e) => setDeliveryCharge(e.target.value)}
            label="Delivery Charge"
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
            endAdornment={<InputAdornment position="end">USD</InputAdornment>}
            inputProps={{ min: 0 }}
          />
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateRangePicker
            value={internalDateRange}
            onChange={handleDateRangeChange}
            slots={{ field: MultiInputDateRangeField }}
            localeText={{
              start: "Delivery Date",
              end: "Off-Rent Date",
            }}
          />
        </LocalizationProvider>
      </DialogContent>
      <DialogActions
        sx={{
          bgcolor: "grey.100",
          borderTop: 1,
          borderColor: "divider",
          px: 3,
          py: 1.5,
          mt: 3,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onBack} color="inherit">
            Back
          </Button>
          <Button variant="contained" color="primary" onClick={onContinue}>
            Continue
          </Button>
        </Box>
      </DialogActions>
    </>
  );
};

export default CreateRentalLineItemFulfillmentDetailsStep;
