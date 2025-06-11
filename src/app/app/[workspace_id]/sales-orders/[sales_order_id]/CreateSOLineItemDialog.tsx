// "use client";

import { graphql } from "@/graphql";
import { useCreateSalesOrderLineItemMutation } from "@/graphql/hooks";
import { PimProductsTreeView } from "@/ui/pim/PimProductsTreeView";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

// GQL mutation declaration (for codegen)
graphql(`
  mutation createSalesOrderLineItem($input: CreateSalesOrderLineItemInput!) {
    createSalesOrderLineItem(input: $input) {
      id
      so_pim_id
      so_quantity
    }
  }
`);

interface CreateSOLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  salesOrderId: string;
  onSuccess: () => void;
}

export const CreateSOLineItemDialog: React.FC<CreateSOLineItemDialogProps> = ({
  open,
  onClose,
  salesOrderId,
  onSuccess,
}) => {
  const [soPimId, setSoPimId] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const [createLineItem, { loading }] = useCreateSalesOrderLineItemMutation();

  const handleClose = () => {
    setSoPimId("");
    setQuantity("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!soPimId) {
      setError("Please select a product.");
      return;
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }
    try {
      await createLineItem({
        variables: {
          input: {
            so_pim_id: soPimId,
            so_quantity: Number(quantity),
            sales_order_id: salesOrderId,
          },
        },
      });
      handleClose();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Sales Order Line Item</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Typography fontWeight={600}>
              Product <span style={{ color: "#d32f2f" }}>*</span>
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Select a product to add to this sales order.
            </Typography>
            <PimProductsTreeView onProductSelected={setSoPimId} />
          </Box>
          <Box>
            <Typography fontWeight={600}>
              Quantity <span style={{ color: "#d32f2f" }}>*</span>
            </Typography>
            <TextField
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
              inputProps={{ min: 1 }}
              fullWidth
              required
              placeholder="Enter quantity"
            />
          </Box>
          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? "Adding..." : "Add Item"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateSOLineItemDialog;
