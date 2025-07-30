"use client";

import { GetPurchaseOrderRentalLineItemByIdCreateDialogQuery } from "@/graphql/graphql";
import { useUpdateRentalPurchaseOrderLineCreateDialogMutation } from "@/graphql/hooks";
import UnsavedChangesWarningDialog from "@/ui/dialog/UnsavedChangesWarningDialog";
import { Alert, Box, Button, Dialog, DialogActions, LinearProgress, Snackbar } from "@mui/material";
import React, { useState } from "react";
import { useGetPurchaseOrderRentalLineItemByIdCreateDialogQuery } from "./api";
import CreateRentalPurchaseOrderLineItemConfirmationStep from "./CreateRentalPurchaseOrderLineItemConfirmationStep";
import CreateRentalPurchaseOrderLineItemDeliveryNotesStep from "./CreateRentalPurchaseOrderLineItemDeliveryNotesStep";
import CreateRentalPurchaseOrderLineItemFulfillmentDetailsStep from "./CreateRentalPurchaseOrderLineItemFulfillmentDetailsStep";
import CreateRentalPurchaseOrderLineItemPricingSelectionStep from "./CreateRentalPurchaseOrderLineItemPricingSelectionStep";
import CreateRentalPurchaseOrderLineItemProductSelectionStep from "./CreateRentalPurchaseOrderLineItemProductSelectionStep";

interface CreateRentalPurchaseOrderLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  lineItemId: string;
  onSuccess: () => void;
}

export type CreateRentalPurchaseOrderLineItemFooter = React.FC<{
  nextEnabled: boolean;
  loading: boolean;
  onNextClick?: () => Promise<void>;
}>;

export const CreateRentalPurchaseOrderLineItemDialog: React.FC<
  CreateRentalPurchaseOrderLineItemDialogProps
> = ({ open, onClose, lineItemId, onSuccess }) => {
  // Wizard navigation state
  const [step, setStep] = useState<number>(1);
  const [showWarningDialog, setShowWarningDialog] = useState<boolean>(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const { data, loading, error, refetch } = useGetPurchaseOrderRentalLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });

  const lineItem =
    data?.getPurchaseOrderLineItemById?.__typename === "RentalPurchaseOrderLineItem"
      ? data.getPurchaseOrderLineItemById
      : null;

  if (!lineItem) {
    return null;
  }

  const handleClose = async () => {
    // Refetch the latest status from the backend
    const { data: latestData } = await refetch();
    const latestLineItem =
      latestData?.getPurchaseOrderLineItemById?.__typename === "RentalPurchaseOrderLineItem"
        ? latestData.getPurchaseOrderLineItemById
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

  const Footer: CreateRentalPurchaseOrderLineItemFooter = ({
    nextEnabled,
    loading,
    onNextClick,
  }) => {
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
            <Button
              onClick={() => {
                setStep((s) => s - 1);
              }}
              disabled={loading}
              color="inherit"
            >
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
      <Dialog open={open} onClose={handleClose} maxWidth={step === 2 ? "md" : "sm"} fullWidth>
        {typeof lineItemId === "string" && (
          <>
            {/* Step 1: Select product */}
            {step === 1 && (
              <CreateRentalPurchaseOrderLineItemProductSelectionStep
                lineItemId={lineItemId}
                Footer={Footer}
              />
            )}

            {/* Step 2: Select price */}
            {step === 2 && lineItem.po_pim_id && (
              <CreateRentalPurchaseOrderLineItemPricingSelectionStep
                lineItemId={lineItemId}
                Footer={Footer}
                pimCategoryId={lineItem.po_pim_id}
              />
            )}

            {/* Step 3: Fulfillment details */}
            {step === 3 && (
              <CreateRentalPurchaseOrderLineItemFulfillmentDetailsStep
                lineItemId={lineItemId}
                Footer={Footer}
              />
            )}

            {/* Step 4: Delivery notes */}
            {step === 4 && (
              <CreateRentalPurchaseOrderLineItemDeliveryNotesStep
                lineItemId={lineItemId}
                Footer={Footer}
              />
            )}

            {/* Step 5: Confirmation */}
            {step === 5 && (
              <CreateRentalPurchaseOrderLineItemConfirmationStep
                lineItemId={lineItemId}
                Footer={Footer}
              />
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
          Rental line item created successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default CreateRentalPurchaseOrderLineItemDialog;
