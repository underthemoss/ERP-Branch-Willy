"use client";

import { DialogContent, DialogTitle, Typography } from "@mui/material";
import React from "react";
import { CreateSalePurchaseOrderLineItemFooter } from "./CreateSalePurchaseOrderLineItemDialog";

export interface ConfirmationStepProps {
  lineItemId: string;
  Footer: CreateSalePurchaseOrderLineItemFooter;
}

const CreateSalePurchaseOrderLineItemConfirmationStep: React.FC<ConfirmationStepProps> = ({
  lineItemId,
  Footer,
}) => {
  return (
    <>
      <DialogTitle>Confirm Line Item Details</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Confirmation step for sale line item (to be implemented)
        </Typography>
      </DialogContent>
      <Footer nextEnabled={true} loading={false} />
    </>
  );
};

export default CreateSalePurchaseOrderLineItemConfirmationStep;
