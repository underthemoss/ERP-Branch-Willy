"use client";

import { PimCategoriesTreeView } from "@/ui/pim/PimCategoriesTreeView";
import { Box, DialogContent, DialogTitle, Typography } from "@mui/material";
import React from "react";
import { NewLineItem } from "../../page";
import { StepFooterComponent } from "./AddLineItemDialog";

interface LineItemCategoryStepProps {
  lineItem: Partial<NewLineItem>;
  onUpdate: (updates: Partial<NewLineItem>) => void;
  Footer: StepFooterComponent;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  workspaceId: string;
}

const LineItemCategoryStep: React.FC<LineItemCategoryStepProps> = ({
  lineItem,
  onUpdate,
  Footer,
  onNext,
  onBack,
  onClose,
  workspaceId,
}) => {
  const handleCategorySelect = (item: any) => {
    onUpdate({
      pimCategoryId: item.id,
      pimCategoryName: item.name,
      // Clear price selection when category changes
      priceId: undefined,
      priceName: undefined,
      priceBookName: undefined,
      unitCostInCents: undefined,
    });
  };

  return (
    <>
      <DialogTitle>
        <Box>
          <Typography variant="h6">Select Product Category</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <PimCategoriesTreeView
            selectedItemId={lineItem.pimCategoryId || undefined}
            onItemSelected={handleCategorySelect}
            includeProducts={false}
          />
        </Box>
      </DialogContent>
      <Footer
        nextEnabled={!!lineItem.pimCategoryId}
        onNext={onNext}
        onBack={onBack}
        onClose={onClose}
      />
    </>
  );
};

export default LineItemCategoryStep;
