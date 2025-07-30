"use client";

import { DialogContent, DialogTitle, Typography } from "@mui/material";
import React from "react";
import { CreateSalePurchaseOrderLineItemFooter } from "./CreateSalePurchaseOrderLineItemDialog";

export interface PricingStepProps {
  lineItemId: string;
  Footer: CreateSalePurchaseOrderLineItemFooter;
  pimCategoryId: string;
}

const CreateSalePurchaseOrderLineItemPricingStep: React.FC<PricingStepProps> = ({
  lineItemId,
  Footer,
  pimCategoryId,
}) => {
  return (
    <>
      <DialogTitle>Select pricing</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pricing step for sale line item (to be implemented)
        </Typography>
      </DialogContent>
      <Footer nextEnabled={true} loading={false} />
    </>
  );
};

export default CreateSalePurchaseOrderLineItemPricingStep;
