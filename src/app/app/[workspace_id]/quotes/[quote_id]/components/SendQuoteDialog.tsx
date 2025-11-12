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
  mutation UpdateQuoteStatusForSend($input: UpdateQuoteStatusInput!) {
    updateQuoteStatus(input: $input) {
      id
      status
      updatedAt
    }
  }
`);

interface SendQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  onSuccess?: () => void;
}

export function SendQuoteDialog({ open, onClose, quoteId, onSuccess }: SendQuoteDialogProps) {
  const { notifySuccess, notifyError } = useNotification();
  const [updateQuoteStatus, { loading }] = useUpdateQuoteStatusMutation();

  const handleClose = () => {
    onClose();
  };

  const handleSend = async () => {
    try {
      await updateQuoteStatus({
        variables: {
          input: {
            id: quoteId,
            status: QuoteStatus.Active,
          },
        },
        refetchQueries: ["GetQuoteById"],
      });

      notifySuccess("Quote sent successfully");
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error sending quote:", error);
      notifyError("Failed to send quote. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Send Quote</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to send this quote to the buyer?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Once sent, the quote will be visible to the buyer and you will not be able to modify it
            directly. To make changes after sending, you will need to create a new revision.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSend} disabled={loading} color="primary">
          {loading ? "Sending..." : "Send Quote"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
