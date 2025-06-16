"use client";

import { Box, Button, Typography } from "@mui/material";
import React from "react";

interface Props {
  salesOrderId: string;
  onCancel: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

const CreateSaleLineItemConfirmationStep: React.FC<Props> = ({
  salesOrderId,
  onCancel,
  onSubmit,
  onBack,
}) => {
  // TODO: Implement confirmation logic for sales
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Confirm Sale Line Item
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Confirmation step for sales order: {salesOrderId}
      </Typography>
      {/* Confirmation UI goes here */}
      <Box sx={{ display: "flex", gap: 1, mt: 3 }}>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button onClick={onBack} color="inherit">
          Back
        </Button>
        <Button onClick={onSubmit} variant="contained" color="primary">
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default CreateSaleLineItemConfirmationStep;
