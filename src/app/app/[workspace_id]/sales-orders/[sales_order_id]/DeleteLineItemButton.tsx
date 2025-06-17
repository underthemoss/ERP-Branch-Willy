"use client";

import { useSoftDeleteSalesOrderLineItemMutation } from "@/graphql/hooks";
import { SOFT_DELETE_SALES_ORDER_LINE_ITEM } from "@/graphql/mutations";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress } from "@mui/material";
import * as React from "react";



export interface DeleteLineItemButtonProps {
  lineItemId: string;
  onDeleted?: () => void;
}

export const DeleteLineItemButton: React.FC<DeleteLineItemButtonProps> = ({ lineItemId, onDeleted }) => {
  const [open, setOpen] = React.useState(false);
  const [softDelete, { loading }] = useSoftDeleteSalesOrderLineItemMutation();

  const handleDelete = async () => {
    await softDelete({
      variables: { id: lineItemId },
    });
    setOpen(false);
    if (onDeleted) onDeleted();
  };

  return (
    <>
      <IconButton
        aria-label="Delete line item"
        color="error"
        onClick={() => setOpen(true)}
        size="small"
      >
        <DeleteIcon />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Delete Line Item?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this line item? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" disabled={loading} startIcon={loading ? <CircularProgress size={18} /> : null}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteLineItemButton;
