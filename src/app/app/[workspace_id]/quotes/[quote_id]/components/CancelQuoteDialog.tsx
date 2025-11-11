"use client";

import { graphql } from "@/graphql";
import { QuoteStatus } from "@/graphql/graphql";
import { useUpdateQuoteStatusMutation } from "@/graphql/hooks";
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

const UPDATE_QUOTE_STATUS = graphql(`
  mutation UpdateQuoteStatusForCancel($input: UpdateQuoteStatusInput!) {
    updateQuoteStatus(input: $input) {
      id
      status
      updatedAt
    }
  }
`);

interface CancelQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  onSuccess?: () => void;
}

export function CancelQuoteDialog({ open, onClose, quoteId, onSuccess }: CancelQuoteDialogProps) {
  const { notifySuccess, notifyError } = useNotification();
  const [updateQuoteStatus, { loading }] = useUpdateQuoteStatusMutation();

  const handleClose = () => {
    onClose();
  };

  const handleCancel = async () => {
    try {
      await updateQuoteStatus({
        variables: {
          input: {
            id: quoteId,
            status: QuoteStatus.Cancelled,
          },
        },
        refetchQueries: ["GetQuoteById"],
      });

      notifySuccess("Quote cancelled successfully");
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error cancelling quote:", error);
      notifyError("Failed to cancel quote. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cancel Quote</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to cancel this quote?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This action will mark the quote as cancelled. The buyer will be notified, and this quote
            will no longer be active. This action cannot be undone.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Go Back
        </Button>
        <Button variant="contained" onClick={handleCancel} disabled={loading} color="error">
          {loading ? "Cancelling..." : "Cancel Quote"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
