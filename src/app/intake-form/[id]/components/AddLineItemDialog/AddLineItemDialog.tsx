"use client";

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import React, { useEffect, useState } from "react";
import { NewLineItem } from "../../page";
import LineItemCategoryStep from "./LineItemCategoryStep";
import LineItemDeliveryStep from "./LineItemDeliveryStep";
import LineItemPriceStep from "./LineItemPriceStep";
import LineItemTypeStep from "./LineItemTypeStep";

interface AddLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (lineItem: NewLineItem) => void;
  editingItem?: NewLineItem;
  editingIndex?: number | null;
  pricebookId?: string | null;
  workspaceId: string;
}

export type StepFooterComponent = React.FC<{
  nextEnabled: boolean;
  loading?: boolean;
  onNext: () => void;
  onBack?: () => void;
  onClose: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}>;

const DEFAULT_LINE_ITEM: Partial<NewLineItem> = {
  quantity: 1,
  deliveryMethod: "DELIVERY",
};

const AddLineItemDialog: React.FC<AddLineItemDialogProps> = ({
  open,
  onClose,
  onSave,
  editingItem,
  editingIndex,
  pricebookId,
  workspaceId,
}) => {
  const [step, setStep] = useState(1);
  const [lineItem, setLineItem] = useState<Partial<NewLineItem>>(DEFAULT_LINE_ITEM);

  // Reset or load editing data when dialog opens
  useEffect(() => {
    if (open) {
      if (editingItem) {
        // Load existing item for editing
        setLineItem({ ...editingItem });
        // When editing, skip type selection since we already know the type
        if (editingItem.isCustomProduct) {
          // Custom products go directly to the custom product name step
          setStep(3);
        } else if (editingItem.pimCategoryId) {
          // Items with categories go to category selection
          setStep(2);
        } else {
          // Shouldn't happen, but default to category selection for non-custom items
          setStep(2);
        }
      } else {
        // Reset for new item
        setLineItem({ ...DEFAULT_LINE_ITEM });
        setStep(1);
      }
    }
  }, [open, editingItem]);

  const handleUpdateLineItem = (updates: Partial<NewLineItem>) => {
    setLineItem((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    // Check if we're on the last step (delivery step)
    if (step === 4) {
      handleSave();
      return;
    }

    // Skip category step if custom product
    if (step === 1 && lineItem.isCustomProduct) {
      setStep(3); // Go directly to price/custom product step
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    // Handle back navigation based on editing state and item type
    if (editingItem) {
      // When editing, we skip step 1 (type selection)
      if (step === 3 && lineItem.isCustomProduct) {
        // Can't go back from custom product name when editing
        return;
      } else if (step === 2) {
        // Can't go back from category selection when editing
        return;
      } else {
        setStep((prev) => prev - 1);
      }
    } else {
      // When creating new, handle normal back navigation
      if (step === 3 && lineItem.isCustomProduct) {
        setStep(1); // Go back to type step
      } else {
        setStep((prev) => prev - 1);
      }
    }
  };

  const handleSave = () => {
    // Ensure all required fields are present
    const completeLineItem: NewLineItem = {
      type: lineItem.type || "PURCHASE",
      pimCategoryId: lineItem.pimCategoryId || "",
      pimCategoryName: lineItem.pimCategoryName,
      priceId: lineItem.priceId,
      priceName: lineItem.priceName,
      priceBookName: lineItem.priceBookName,
      unitCostInCents: lineItem.unitCostInCents,
      isCustomProduct: lineItem.isCustomProduct,
      customProductName: lineItem.customProductName,
      quantity: lineItem.quantity || 1,
      deliveryDate: lineItem.deliveryDate,
      deliveryLocation: lineItem.deliveryLocation,
      deliveryMethod: lineItem.deliveryMethod || "DELIVERY",
      deliveryNotes: lineItem.deliveryNotes,
      rentalDuration: lineItem.rentalDuration,
      rentalStartDate: lineItem.rentalStartDate,
      rentalEndDate: lineItem.rentalEndDate,
      pricePerDayInCents: lineItem.pricePerDayInCents,
      pricePerWeekInCents: lineItem.pricePerWeekInCents,
      pricePerMonthInCents: lineItem.pricePerMonthInCents,
    };
    onSave(completeLineItem);
    onClose();
  };

  const Footer: StepFooterComponent = ({
    nextEnabled,
    loading,
    onNext,
    onBack,
    onClose,
    isFirstStep,
    isLastStep,
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
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          {!isFirstStep && (
            <Button onClick={onBack} disabled={loading} color="inherit">
              Back
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            disabled={!nextEnabled || loading}
            onClick={onNext}
          >
            {isLastStep ? "Save" : "Continue"}
          </Button>
        </Box>
      </DialogActions>
    );
  };

  const getStepContent = () => {
    // Determine if current step is the first step based on editing state
    const isFirstStep = editingItem
      ? lineItem.isCustomProduct
        ? step === 3
        : step === 2
      : step === 1;

    switch (step) {
      case 1:
        return (
          <LineItemTypeStep
            lineItem={lineItem}
            onUpdate={handleUpdateLineItem}
            Footer={Footer}
            onNext={handleNext}
            onClose={onClose}
          />
        );
      case 2:
        // Skip this step if custom product
        if (lineItem.isCustomProduct) {
          return null;
        }
        return (
          <LineItemCategoryStep
            lineItem={lineItem}
            onUpdate={handleUpdateLineItem}
            Footer={(props: any) => <Footer {...props} isFirstStep={isFirstStep} />}
            onNext={handleNext}
            onBack={handleBack}
            onClose={onClose}
            workspaceId={workspaceId}
          />
        );
      case 3:
        return (
          <LineItemPriceStep
            lineItem={lineItem}
            onUpdate={handleUpdateLineItem}
            Footer={(props: any) => <Footer {...props} isFirstStep={isFirstStep} />}
            onNext={handleNext}
            onBack={handleBack}
            onClose={onClose}
            pricebookId={pricebookId}
            workspaceId={workspaceId}
          />
        );
      case 4:
        return (
          <LineItemDeliveryStep
            lineItem={lineItem}
            onUpdate={handleUpdateLineItem}
            Footer={(props: any) => <Footer {...props} isLastStep={true} />}
            onNext={handleNext}
            onBack={handleBack}
            onClose={onClose}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {getStepContent()}
    </Dialog>
  );
};

export default AddLineItemDialog;
