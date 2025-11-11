"use client";

import { useNotification } from "@/providers/NotificationProvider";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import * as React from "react";

interface EditLineItemsDialogProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  quoteStatus: string;
  onSuccess?: () => void;
}

export function EditLineItemsDialog({
  open,
  onClose,
  quoteId,
  quoteStatus,
  onSuccess,
}: EditLineItemsDialogProps) {
  const { notifyInfo } = useNotification();

  const handleClose = () => {
    onClose();
  };

  const handleEdit = () => {
    notifyInfo("Line item editing feature coming soon");
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>Edit Line Items</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Manage quote line items
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
            This feature will allow you to:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Add new line items from the catalog
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Edit existing line items (quantity, dates, etc.)
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Remove line items
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Automatically create a new draft revision if the quote is SENT
            </Typography>
          </Box>
          <Typography variant="body2" color="info.main" sx={{ mt: 3 }}>
            💡 When editing a SENT quote, changes will create a new draft revision that becomes
            active when you send it to the buyer.
          </Typography>
          <Typography variant="body2" color="warning.main" sx={{ mt: 2, fontWeight: 500 }}>
            ⚠️ Backend support pending
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            The GraphQL schema needs to be updated to include mutations for adding, updating, and
            deleting quote revision line items before this feature can be implemented.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button variant="contained" onClick={handleEdit} disabled>
          Edit Line Items (Coming Soon)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
