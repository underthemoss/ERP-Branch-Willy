"use client";

import { DialogContent, DialogTitle, Typography } from "@mui/material";
import React from "react";
import { CreateSalePurchaseOrderLineItemFooter } from "./CreateSalePurchaseOrderLineItemDialog";

export interface ProductSelectionStepProps {
  lineItemId: string;
  Footer: CreateSalePurchaseOrderLineItemFooter;
}

const CreateSalePurchaseOrderLineItemProductSelectionStep: React.FC<ProductSelectionStepProps> = ({
  lineItemId,
  Footer,
}) => {
  return (
    <>
      <DialogTitle>Select a product</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Product selection step for sale line item (to be implemented)
        </Typography>
      </DialogContent>
      <Footer nextEnabled={true} loading={false} />
    </>
  );
};

export default CreateSalePurchaseOrderLineItemProductSelectionStep;
