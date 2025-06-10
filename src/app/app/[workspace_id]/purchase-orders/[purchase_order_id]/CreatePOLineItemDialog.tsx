"use client";

import { graphql } from "@/graphql";
import { useCreatePurchaseOrderLineItemMutation } from "@/graphql/hooks";
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
  mutation createPurchaseOrderLineItem($input: CreatePurchaseOrderLineItemInput!) {
    createPurchaseOrderLineItem(input: $input) {
      id
      po_pim_id
      po_quantity
    }
  }
`);

interface CreatePOLineItemDialogProps {
  open: boolean;
  onClose: () => void;
  purchaseOrderId: string;
  onSuccess: () => void;
}

export const CreatePOLineItemDialog: React.FC<CreatePOLineItemDialogProps> = ({
  open,
  onClose,
  purchaseOrderId,
  onSuccess,
}) => {
  const [poPimId, setPoPimId] = useState<string>("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const [createLineItem, { loading }] = useCreatePurchaseOrderLineItemMutation();

  const handleClose = () => {
    setPoPimId("");
    setQuantity("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!poPimId) {
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
            po_pim_id: poPimId,
            po_quantity: Number(quantity),
            purchase_order_id: purchaseOrderId,
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
      <DialogTitle>Add Purchase Order Line Item</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Typography fontWeight={600}>
              Product <span style={{ color: "#d32f2f" }}>*</span>
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Select a product to add to this purchase order.
            </Typography>
            <PimProductsTreeView onProductSelected={setPoPimId} />
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

export default CreatePOLineItemDialog;
