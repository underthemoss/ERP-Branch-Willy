"use client";

import { graphql } from "@/graphql";
import { useSoftDeleteSalesOrderLineItemMutation } from "@/graphql/hooks";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import * as React from "react";

// GQL mutation for soft deleting a sales order line item
graphql(`
  mutation SoftDeleteSalesOrderLineItem($id: String) {
    softDeleteSalesOrderLineItem(id: $id) {
      ... on RentalSalesOrderLineItem {
        id
      }
      ... on SaleSalesOrderLineItem {
        id
      }
    }
  }
`);

export interface DeleteLineItemButtonProps {
  lineItemId: string;
  onDeleted?: () => void;
  disabled?: boolean;
}

export const DeleteLineItemButton: React.FC<DeleteLineItemButtonProps> = ({
  lineItemId,
  onDeleted,
  disabled = false,
}) => {
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
        disabled={disabled}
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
          <Button
            onClick={handleDelete}
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteLineItemButton;
