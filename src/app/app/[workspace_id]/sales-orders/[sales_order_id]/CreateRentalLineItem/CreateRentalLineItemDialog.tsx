"use client";

import { GetSalesOrderRentalLineItemByIdCreateDialogQuery } from "@/graphql/graphql";
import { useUpdateRentalSalesOrderLineCreateDialogMutation } from "@/graphql/hooks";
import { Box, Button, Dialog, DialogActions } from "@mui/material";
import React, { useState } from "react";
import { useGetSalesOrderRentalLineItemByIdCreateDialogQuery } from "./api";
import CreateRentalLineItemConfirmationStep from "./CreateRentalLineItemConfirmationStep";
import CreateRentalLineItemDeliveryNotesStep from "./CreateRentalLineItemDeliveryNotesStep";
import CreateRentalLineItemFulfillmentDetailsStep from "./CreateRentalLineItemFulfillmentDetailsStep";
import CreateRentalLineItemPricingSelectionStep from "./CreateRentalLineItemPricingSelectionStep";
import CreateRentalLineItemProductSelectionStep from "./CreateRentalLineItemProductSelectionStep";

interface CreateRentalLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  lineItemId: string;
  onSuccess: () => void;
}

export type CreateRentalLineItemFooter = React.FC<{
  nextEnabled: boolean;
  loading: boolean;
  onNextClick?: () => Promise<void>;
}>;

export const CreateRentalLineItemDialog: React.FC<CreateRentalLineItemDialogProps> = ({
  open,
  onClose,
  lineItemId,
  onSuccess,
}) => {
  // Wizard navigation state
  const [step, setStep] = useState<number>(1);
  const { data, loading, error, refetch } = useGetSalesOrderRentalLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });
  const [updateLineItem, { loading: mutationLoading }] =
    useUpdateRentalSalesOrderLineCreateDialogMutation();

  const lineItem =
    data?.getSalesOrderLineItemById?.__typename === "RentalSalesOrderLineItem"
      ? data.getSalesOrderLineItemById
      : null;

  if (!lineItem) {
    return null;
  }

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const isNextEnabled = () => {
    if (step === 1) {
      return;
    }
  };

  const Footer: CreateRentalLineItemFooter = ({ nextEnabled, loading, onNextClick }) => {
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
        <Button onClick={() => {}} color="inherit" loading={loading}>
          Cancel
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          {step > 1 && (
            <Button
              onClick={() => {
                setStep((s) => s - 1);
              }}
              loading={loading}
              color="inherit"
            >
              Back
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            loading={loading}
            disabled={!nextEnabled}
            onClick={async () => {
              if (onNextClick) {
                await onNextClick();
              }
              setStep((s) => s + 1);
            }}
          >
            Continue
          </Button>
        </Box>
      </DialogActions>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={step === 2 ? "md" : "sm"} fullWidth>
      {typeof lineItemId === "string" && (
        <>
          {/* Step 1: Select product */}
          {step === 1 && (
            <CreateRentalLineItemProductSelectionStep lineItemId={lineItemId} Footer={Footer} />
          )}

          {/* Step 2: Select price */}
          {step === 2 && (
            <CreateRentalLineItemPricingSelectionStep lineItemId={lineItemId} Footer={Footer} />
          )}

          {/* Step 3: Fulfillment details */}
          {step === 3 && (
            <CreateRentalLineItemFulfillmentDetailsStep
              lineItemId={lineItemId}
              onCancel={handleClose}
              onContinue={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}

          {/* Step 4: Delivery notes */}
          {step === 4 && (
            <CreateRentalLineItemDeliveryNotesStep
              lineItemId={lineItemId}
              onCancel={handleClose}
              onSubmit={() => setStep(5)}
              onBack={() => setStep(3)}
            />
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <CreateRentalLineItemConfirmationStep
              lineItemId={lineItemId}
              onCancel={handleClose}
              onSubmit={onSuccess}
              onBack={() => setStep(4)}
            />
          )}
        </>
      )}
    </Dialog>
  );
};

export default CreateRentalLineItemDialog;
