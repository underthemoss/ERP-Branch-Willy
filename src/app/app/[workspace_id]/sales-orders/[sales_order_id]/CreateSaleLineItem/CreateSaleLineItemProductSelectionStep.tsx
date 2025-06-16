"use client";

import { PimCategoriesTreeView } from "@/ui/pim/PimCategoriesTreeView";
import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import { CreateSaleLineItemFooter } from "./CreateSaleLineItemDialog";

interface Props {
  salesOrderId: string;
  Footer: CreateSaleLineItemFooter;
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  onContinue: () => void;
}

const CreateSaleLineItemProductSelectionStep: React.FC<Props> = ({
  salesOrderId,
  Footer,
  selectedProductId,
  setSelectedProductId,
  onContinue,
}) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Select Product
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select a product to add to this sales order.
      </Typography>
      <Box sx={{ mb: 3 }}>
        <PimCategoriesTreeView onItemSelected={(item) => setSelectedProductId(item.id || "")} />
      </Box>
      <Footer
        nextEnabled={!!selectedProductId}
        loading={false}
        onNextClick={async () => {
          onContinue();
        }}
      />
    </Box>
  );
};

export default CreateSaleLineItemProductSelectionStep;
