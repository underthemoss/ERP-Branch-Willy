// "use client";

import { useGetSalesOrderSaleLineItemByIdCreateDialogQuery } from "@/graphql/hooks";
import { Box, Button, Dialog, DialogActions } from "@mui/material";
import React, { useState } from "react";
import CreateSaleLineItemConfirmationStep from "./CreateSaleLineItemConfirmationStep";
import CreateSaleLineItemDeliveryStep from "./CreateSaleLineItemDeliveryStep";
import CreateSaleLineItemFulfillmentDetailsStep from "./CreateSaleLineItemFulfillmentDetailsStep";
import CreateSaleLineItemPricingStep from "./CreateSaleLineItemPricingStep";
import CreateSaleLineItemProductSelectionStep from "./CreateSaleLineItemProductSelectionStep";

interface CreateSaleLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  lineItemId: string;
  onSuccess: () => void;
}

export type CreateSaleLineItemFooter = React.FC<{
  nextEnabled: boolean;
  loading: boolean;
  onNextClick?: () => Promise<void>;
}>;

export const CreateSaleLineItemDialog: React.FC<CreateSaleLineItemDialogProps> = ({
  open,
  onClose,
  lineItemId,
  onSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const { data } = useGetSalesOrderSaleLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });

  const lineItem =
    data?.getSalesOrderLineItemById?.__typename === "SaleSalesOrderLineItem"
      ? data.getSalesOrderLineItemById
      : null;

  if (!lineItem) {
    return null;
  }

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const Footer: CreateSaleLineItemFooter = ({ nextEnabled, loading, onNextClick }) => {
    return (
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
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          {step > 1 && (
            <Button onClick={() => setStep((s) => s - 1)} disabled={loading} color="inherit">
              Back
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            disabled={!nextEnabled || loading}
            onClick={async () => {
              if (onNextClick) {
                await onNextClick();
              }
              if (step === 5) {
                handleClose();
              } else {
                setStep((s) => s + 1);
              }
            }}
          >
            Continue
          </Button>
        </Box>
      </DialogActions>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      {typeof lineItemId === "string" && (
        <>
          {/* Step 1: Select product */}
          {step === 1 && (
            <CreateSaleLineItemProductSelectionStep lineItemId={lineItemId} Footer={Footer} />
          )}

          {/* Step 2: Pricing */}
          {step === 2 && lineItem.so_pim_id && (
            <CreateSaleLineItemPricingStep
              lineItemId={lineItemId}
              Footer={Footer}
              pimCategoryId={lineItem.so_pim_id}
            />
          )}

          {/* Step 3: Fulfillment Details */}
          {step === 3 && (
            <CreateSaleLineItemFulfillmentDetailsStep lineItemId={lineItemId} Footer={Footer} />
          )}

          {/* Step 4: Delivery Information */}
          {step === 4 && <CreateSaleLineItemDeliveryStep lineItemId={lineItemId} Footer={Footer} />}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <CreateSaleLineItemConfirmationStep lineItemId={lineItemId} Footer={Footer} />
          )}
        </>
      )}
    </Dialog>
  );
};

export default CreateSaleLineItemDialog;
