"use client";

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

export interface DeliveryNotesStepProps {
  deliveryNotes: string;
  setDeliveryNotes: (v: string) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

const CreateRentalLineItemDeliveryNotesStep: React.FC<DeliveryNotesStepProps> = ({
  deliveryNotes,
  setDeliveryNotes,
  onCancel,
  onSubmit,
  onBack,
}) => (
  <form onSubmit={onSubmit}>
    <DialogTitle>Delivery Contact & Notes</DialogTitle>
    <DialogContent sx={{ pt: 1, pb: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Contact + special instructions for the driver.
      </Typography>
      <TextField
        multiline
        minRows={4}
        fullWidth
        placeholder="Jordan Smith — 512-555-0123. Use east gate off 5th St, unload near staging area."
        value={deliveryNotes}
        onChange={(e) => setDeliveryNotes(e.target.value)}
      />
    </DialogContent>
    <DialogActions
      sx={{
        bgcolor: "grey.100",
        borderTop: 1,
        borderColor: "divider",
        px: 3,
        mt: 3,
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
        <Button type="submit" variant="contained" color="primary">
          Continue
        </Button>
      </Box>
    </DialogActions>
  </form>
);

export default CreateRentalLineItemDeliveryNotesStep;
