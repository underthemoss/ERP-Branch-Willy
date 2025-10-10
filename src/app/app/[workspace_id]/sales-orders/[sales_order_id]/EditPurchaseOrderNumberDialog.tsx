"use client";

import { graphql } from "@/graphql";
import { useUpdateSalesOrderMutation } from "@/graphql/hooks";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import * as React from "react";

graphql(`
  mutation UpdateSalesOrderPurchaseOrderNumber($input: UpdateSalesOrderInput) {
    updateSalesOrder(input: $input) {
      id
      purchase_order_number
    }
  }
`);

interface EditPurchaseOrderNumberDialogProps {
  open: boolean;
  onClose: () => void;
  salesOrderId: string;
  currentPurchaseOrderNumber: string;
  onSuccess?: () => void;
}

export default function EditPurchaseOrderNumberDialog({
  open,
  onClose,
  salesOrderId,
  currentPurchaseOrderNumber,
  onSuccess,
}: EditPurchaseOrderNumberDialogProps) {
  const [updateSalesOrder] = useUpdateSalesOrderMutation();

  // Form state
  const [poNumber, setPoNumber] = React.useState(currentPurchaseOrderNumber);
  const [loading, setLoading] = React.useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setPoNumber(currentPurchaseOrderNumber);
    }
  }, [open, currentPurchaseOrderNumber]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateSalesOrder({
        variables: {
          input: {
            id: salesOrderId,
            purchase_order_number: poNumber.trim() || null,
          },
        },
        refetchQueries: ["GetSalesOrderById"],
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error updating purchase order number:", error);
      alert("Failed to update purchase order number. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Purchase Order Number</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Purchase Order Number (optional)"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="Enter purchase order number"
            fullWidth
            autoFocus
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? "Updating..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
