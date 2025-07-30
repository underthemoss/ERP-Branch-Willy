"use client";

import { DialogContent, DialogTitle, Typography } from "@mui/material";
import React from "react";
import { CreateSalePurchaseOrderLineItemFooter } from "./CreateSalePurchaseOrderLineItemDialog";

export interface FulfillmentDetailsStepProps {
  lineItemId: string;
  Footer: CreateSalePurchaseOrderLineItemFooter;
}

const CreateSalePurchaseOrderLineItemFulfillmentDetailsStep: React.FC<
  FulfillmentDetailsStepProps
> = ({ lineItemId, Footer }) => {
  return (
    <>
      <DialogTitle>Fulfillment Details</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Fulfillment details step for sale line item (to be implemented)
        </Typography>
      </DialogContent>
      <Footer nextEnabled={true} loading={false} />
    </>
  );
};

export default CreateSalePurchaseOrderLineItemFulfillmentDetailsStep;
