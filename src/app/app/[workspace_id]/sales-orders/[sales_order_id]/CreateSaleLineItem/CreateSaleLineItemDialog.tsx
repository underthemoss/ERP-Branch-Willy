// "use client";

import { Box, Button, Dialog, DialogActions } from "@mui/material";
import React, { useState } from "react";
import CreateSaleLineItemConfirmationStep from "./CreateSaleLineItemConfirmationStep";
import CreateSaleLineItemPricingStep from "./CreateSaleLineItemPricingStep";
import CreateSaleLineItemProductSelectionStep from "./CreateSaleLineItemProductSelectionStep";

interface CreateSaleLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  salesOrderId: string;
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
  salesOrderId,
  onSuccess,
}) => {
  // Wizard navigation state
  const [step, setStep] = useState<number>(1);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const handleClose = () => {
    setStep(1);
    setSelectedProductId("");
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      {typeof salesOrderId === "string" && (
        <>
          {/* Step 1: Select product */}
          {step === 1 && (
            <CreateSaleLineItemProductSelectionStep
              salesOrderId={salesOrderId}
              Footer={Footer}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
              onContinue={() => setStep(2)}
            />
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <CreateSaleLineItemPricingStep
              salesOrderId={salesOrderId}
              Footer={Footer}
              selectedProductId={selectedProductId}
            />
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <CreateSaleLineItemConfirmationStep
              salesOrderId={salesOrderId}
              onCancel={handleClose}
              onSubmit={onSuccess}
              onBack={() => setStep(2)}
            />
          )}
        </>
      )}
    </Dialog>
  );
};

export default CreateSaleLineItemDialog;
