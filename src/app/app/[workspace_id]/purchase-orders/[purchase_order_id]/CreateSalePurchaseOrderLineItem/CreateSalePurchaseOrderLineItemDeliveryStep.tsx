"use client";

import { DialogContent, DialogTitle, Typography } from "@mui/material";
import React from "react";
import { CreateSalePurchaseOrderLineItemFooter } from "./CreateSalePurchaseOrderLineItemDialog";

export interface DeliveryStepProps {
  lineItemId: string;
  Footer: CreateSalePurchaseOrderLineItemFooter;
}

const CreateSalePurchaseOrderLineItemDeliveryStep: React.FC<DeliveryStepProps> = ({
  lineItemId,
  Footer,
}) => {
  return (
    <>
      <DialogTitle>Delivery Information</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Delivery step for sale line item (to be implemented)
        </Typography>
      </DialogContent>
      <Footer nextEnabled={true} loading={false} />
    </>
  );
};

export default CreateSalePurchaseOrderLineItemDeliveryStep;
