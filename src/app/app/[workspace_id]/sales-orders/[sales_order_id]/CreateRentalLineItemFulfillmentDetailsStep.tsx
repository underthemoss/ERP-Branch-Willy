"use client";

import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import {
  Box,
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";

export interface FulfillmentDetailsStepProps {
  fulfillmentMethod: "Delivery" | "Pickup";
  setFulfillmentMethod: (v: "Delivery" | "Pickup") => void;
  deliveryLocation: string;
  setDeliveryLocation: (v: string) => void;
  deliveryCharge: string;
  setDeliveryCharge: (v: string) => void;
  deliveryDate: string;
  setDeliveryDate: (v: string) => void;
  offRentDate: string;
  setOffRentDate: (v: string) => void;
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
  deliveryDate,
  setDeliveryDate,
  offRentDate,
  setOffRentDate,
  onCancel,
  onContinue,
  onBack,
}) => (
  <>
    <DialogTitle>Fulfillment Details</DialogTitle>
    <DialogContent sx={{ pt: 1, pb: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Complete the fields to record a sale. For ownership transfers, check the box to skip lease
        terms.
      </Typography>
      <TextField
        select
        label="Fulfillment Method"
        value={fulfillmentMethod}
        onChange={(e) => setFulfillmentMethod(e.target.value as "Delivery" | "Pickup")}
        SelectProps={{ native: true }}
        fullWidth
        sx={{ mb: 2 }}
      >
        <option value="Delivery">Delivery</option>
        <option value="Pickup">Pickup</option>
      </TextField>
      <TextField
        label="Delivery Location"
        value={deliveryLocation}
        onChange={(e) => setDeliveryLocation(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <KeyOutlinedIcon sx={{ color: "action.active", mr: 1, my: 0.5 }} />,
        }}
      />
      <TextField
        label="Delivery Charge"
        value={deliveryCharge}
        onChange={(e) => setDeliveryCharge(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <span style={{ marginRight: 4 }}>$</span>,
          endAdornment: <span style={{ marginLeft: 4 }}>USD</span>,
          inputProps: { min: 0 },
        }}
      />
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          label="Delivery date"
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Off Rent Date"
          type="date"
          value={offRentDate}
          onChange={(e) => setOffRentDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ flex: 1 }}
        />
      </Box>
    </DialogContent>
    <DialogActions
      sx={{
        bgcolor: "grey.100",
        borderTop: 1,
        borderColor: "divider",
        px: 3,
        py: 1.5,
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

export default CreateRentalLineItemFulfillmentDetailsStep;
