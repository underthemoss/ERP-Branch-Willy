"use client";

import { PimCategoriesTreeView } from "@/ui/pim/PimCategoriesTreeView";
import { Box, Button, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import React from "react";

export interface ProductSelectionStepProps {
  soPimId: string;
  setSoPimId: (id: string) => void;
  onCancel: () => void;
  onContinue: () => void;
  onBack: () => void;
}

const CreateRentalLineItemProductSelectionStep: React.FC<ProductSelectionStepProps> = ({
  soPimId,
  setSoPimId,
  onCancel,
  onContinue,
  onBack,
}) => (
  <>
    <DialogTitle>Select a Product</DialogTitle>
    <DialogContent sx={{ pt: 1, pb: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Search and select a product to add to this sales order.
      </Typography>
      <PimCategoriesTreeView
        onItemSelected={(val) => {
          console.log(val);
          if (val.__typename === "PimProduct") {
            setSoPimId(val.id || "");
            onContinue();
          }
          if (val.__typename === "PimCategory") {
            setSoPimId(val.id || "");
            onContinue();
          }
        }}
      />
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
        <Button variant="contained" color="primary" disabled>
          Continue
        </Button>
      </Box>
    </DialogActions>
  </>
);

export default CreateRentalLineItemProductSelectionStep;
