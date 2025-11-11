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
  mutation UpdateQuoteStatusForAccept($input: UpdateQuoteStatusInput!) {
    updateQuoteStatus(input: $input) {
      id
      status
      updatedAt
    }
  }
`);

interface AcceptQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  onSuccess?: () => void;
}

export function AcceptQuoteDialog({ open, onClose, quoteId, onSuccess }: AcceptQuoteDialogProps) {
  const { notifySuccess, notifyError } = useNotification();
  const [updateQuoteStatus, { loading }] = useUpdateQuoteStatusMutation();

  const handleClose = () => {
    onClose();
  };

  const handleAccept = async () => {
    try {
      await updateQuoteStatus({
        variables: {
          input: {
            id: quoteId,
            status: QuoteStatus.Accepted,
          },
        },
        refetchQueries: ["GetQuoteById"],
      });

      notifySuccess("Quote accepted successfully");
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error accepting quote:", error);
      notifyError("Failed to accept quote. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Accept Quote</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to accept this quote?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            By accepting this quote, you are confirming that you agree to the terms, pricing, and
            conditions outlined. The seller will be notified of your acceptance.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleAccept} disabled={loading} color="success">
          {loading ? "Accepting..." : "Accept Quote"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
