"use client";

import { useGetSalesOrderSaleLineItemByIdCreateDialogQuery } from "@/graphql/hooks";
import UnsavedChangesWarningDialog from "@/ui/dialog/UnsavedChangesWarningDialog";
import { Alert, Box, Button, Dialog, DialogActions, Snackbar } from "@mui/material";
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
  const [showWarningDialog, setShowWarningDialog] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const { data, refetch } = useGetSalesOrderSaleLineItemByIdCreateDialogQuery({
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

  const handleClose = async () => {
    // Refetch the latest status from the backend
    const { data: latestData } = await refetch();
    const latestLineItem =
      latestData?.getSalesOrderLineItemById?.__typename === "SaleSalesOrderLineItem"
        ? latestData.getSalesOrderLineItemById
        : null;

    // Check if line item is in draft status and show warning
    if (latestLineItem?.lineitem_status === "DRAFT") {
      setShowWarningDialog(true);
    } else {
      // If the item was confirmed, show success message
      if (latestLineItem?.lineitem_status === "CONFIRMED") {
        setShowSuccessMessage(true);
      }
      setStep(1);
      onClose();
    }
  };

  const handleForceClose = () => {
    setStep(1);
    onClose();
  };

  const handleConfirmClose = () => {
    setShowWarningDialog(false);
    handleForceClose();
  };

  const handleCancelClose = () => {
    setShowWarningDialog(false);
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
    <>
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
            {step === 4 && (
              <CreateSaleLineItemDeliveryStep lineItemId={lineItemId} Footer={Footer} />
            )}

            {/* Step 5: Confirmation */}
            {step === 5 && (
              <CreateSaleLineItemConfirmationStep lineItemId={lineItemId} Footer={Footer} />
            )}
          </>
        )}
      </Dialog>

      {/* Warning dialog for unsaved changes */}
      <UnsavedChangesWarningDialog
        open={showWarningDialog}
        onClose={handleCancelClose}
        onConfirm={handleConfirmClose}
        title="Unsaved Changes"
        message="This line item is in draft status and has unsaved changes. If you close this dialog, all changes will be lost. Are you sure you want to continue?"
      />

      {/* Success message */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSuccessMessage(false)}
          severity="success"
          sx={{ width: "100%" }}
          variant="filled"
        >
          Sale line item created successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default CreateSaleLineItemDialog;
