"use client";

import { Box, Typography } from "@mui/material";
import React from "react";
import { CreateSaleLineItemFooter } from "./CreateSaleLineItemDialog";

interface Props {
  salesOrderId: string;
  Footer: CreateSaleLineItemFooter;
  selectedProductId: string;
}

const CreateSaleLineItemPricingStep: React.FC<Props> = ({
  salesOrderId,
  Footer,
  selectedProductId,
}) => {
  const [unitPrice, setUnitPrice] = React.useState<number | "">("");

  const isValidPrice = typeof unitPrice === "number" && unitPrice > 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Set Pricing
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {selectedProductId
          ? `Set the unit price for product ID: ${selectedProductId}`
          : "No product selected."}
      </Typography>
      <Box sx={{ mb: 3, maxWidth: 300 }}>
        <label htmlFor="unit-price-input">Unit Price</label>
        <input
          id="unit-price-input"
          type="number"
          min={0}
          step={0.01}
          value={unitPrice}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setUnitPrice(isNaN(val) ? "" : val);
          }}
          style={{ width: "100%", padding: "8px", fontSize: "1rem" }}
        />
      </Box>
      <Footer nextEnabled={isValidPrice} loading={false} />
    </Box>
  );
};

export default CreateSaleLineItemPricingStep;
