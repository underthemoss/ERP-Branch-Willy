"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import React from "react";
import { InventoryAssignment_RentalFulFulfilment } from "./api";

type AddToExistingPurchaseOrderDialogProps = {
  open: boolean;
  onClose: () => void;
  fulfilment: InventoryAssignment_RentalFulFulfilment;
};

export function AddToExistingPurchaseOrderDialog({
  open,
  onClose,
  fulfilment,
}: AddToExistingPurchaseOrderDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add to Existing Purchase Order</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mt: 2 }}>
          This wizard will help you add this fulfilment to an existing purchase order.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Fulfilment ID: {fulfilment.id}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Product: {fulfilment.pimCategoryName}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Coming soon...
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onClose} variant="contained" color="primary">
          Add to PO
        </Button>
      </DialogActions>
    </Dialog>
  );
}
