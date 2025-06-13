"use client";

import { graphql } from "@/graphql";
import { RentalSalesOrderLineItem, SalesOrderLineItem } from "@/graphql/graphql";
import { useGetSalesOrderRentalLineItemByIdCreateDialogQuery } from "@/graphql/hooks";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";

/* Removed duplicate GetSalesOrderLineItemById query definition; now defined in api.ts */

export interface ConfirmationStepProps {
  lineItemId: string;
  onCancel: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

const CreateRentalLineItemConfirmationStep: React.FC<ConfirmationStepProps> = ({
  lineItemId,
  onCancel,
  onSubmit,
  onBack,
}) => {
  // Use the generated hook for fetching a single line item by ID
  const { data, loading, error } = useGetSalesOrderRentalLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });
  const lineItem = data?.getSalesOrderLineItemById as RentalSalesOrderLineItem | null;

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>Loading line item details...</Typography>
      </Box>
    );
  }

  if (error || !lineItem) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error">
          {error ? `Error loading line item: ${error.message}` : "Line item not found"}
        </Typography>
      </Box>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <DialogTitle>Confirm Line Item Details</DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Please review the line item details before submitting.
        </Typography>
        <Box sx={{ display: "grid", gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Product
            </Typography>
            <Typography variant="body1">
              {lineItem?.so_pim_product?.name ?? lineItem?.so_pim_category?.name}
            </Typography>
            {lineItem?.so_pim_product?.model && (
              <Typography variant="body2" color="text.secondary">
                Model: {lineItem?.so_pim_product.model}
              </Typography>
            )}
            {lineItem?.so_pim_product?.sku && (
              <Typography variant="body2" color="text.secondary">
                SKU: {lineItem?.so_pim_product.sku}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Quantity
            </Typography>
            <Typography variant="body1">{lineItem?.so_quantity}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Pricing
            </Typography>
            {lineItem?.price_per_day_in_cents && (
              <Typography variant="body2">
                Daily Rate: ${(lineItem?.price_per_day_in_cents / 100).toFixed(2)}
              </Typography>
            )}
            {lineItem?.price_per_week_in_cents && (
              <Typography variant="body2">
                Weekly Rate: ${(lineItem?.price_per_week_in_cents / 100).toFixed(2)}
              </Typography>
            )}
            {lineItem?.price_per_month_in_cents && (
              <Typography variant="body2">
                Monthly Rate: ${(lineItem?.price_per_month_in_cents / 100).toFixed(2)}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Delivery Details
            </Typography>
            {lineItem?.delivery_location && (
              <Typography variant="body2">Location: {lineItem?.delivery_location}</Typography>
            )}
            {lineItem?.delivery_date && (
              <Typography variant="body2">
                Date: {new Date(lineItem?.delivery_date).toLocaleDateString()}
              </Typography>
            )}
            {lineItem?.delivery_method && (
              <Typography variant="body2">Method: {lineItem?.delivery_method}</Typography>
            )}
            {lineItem?.delivery_charge_in_cents && (
              <Typography variant="body2">
                Delivery Charge: ${(lineItem?.delivery_charge_in_cents / 100).toFixed(2)}
              </Typography>
            )}
          </Box>
          {lineItem?.off_rent_date && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Off-Rent Date
              </Typography>
              <Typography variant="body2">
                {new Date(lineItem?.off_rent_date).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          bgcolor: "grey.100",
          borderTop: 1,
          borderColor: "divider",
          px: 3,
          mt: 3,
          py: 1.5,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onBack} color="inherit">
            Back
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Submit
          </Button>
        </Box>
      </DialogActions>
    </form>
  );
};

export default CreateRentalLineItemConfirmationStep;
