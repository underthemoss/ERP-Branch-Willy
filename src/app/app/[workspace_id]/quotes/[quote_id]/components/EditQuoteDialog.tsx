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

interface EditQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  onSuccess?: () => void;
}

export function EditQuoteDialog({ open, onClose, quoteId, onSuccess }: EditQuoteDialogProps) {
  const { notifyInfo } = useNotification();

  const handleClose = () => {
    onClose();
  };

  const handleEdit = () => {
    notifyInfo("Quote editing feature coming soon");
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Quote</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Edit quote metadata
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
            This feature will allow you to edit:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Buyer contact
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Project
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Valid until date
            </Typography>
          </Box>
          <Typography variant="body2" color="warning.main" sx={{ mt: 3, fontWeight: 500 }}>
            ⚠️ Backend support pending
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            The GraphQL schema needs to be updated to include an updateQuote mutation before this
            feature can be implemented.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button variant="contained" onClick={handleEdit} disabled>
          Edit Quote (Coming Soon)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
