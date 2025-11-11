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
  TextField,
  Typography,
} from "@mui/material";
import * as React from "react";

const UPDATE_QUOTE_STATUS = graphql(`
  mutation UpdateQuoteStatusForReject($input: UpdateQuoteStatusInput!) {
    updateQuoteStatus(input: $input) {
      id
      status
      updatedAt
    }
  }
`);

interface RejectQuoteDialogProps {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  onSuccess?: () => void;
}

export function RejectQuoteDialog({ open, onClose, quoteId, onSuccess }: RejectQuoteDialogProps) {
  const { notifySuccess, notifyError } = useNotification();
  const [updateQuoteStatus, { loading }] = useUpdateQuoteStatusMutation();
  const [reason, setReason] = React.useState<string>("");

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleReject = async () => {
    try {
      await updateQuoteStatus({
        variables: {
          input: {
            id: quoteId,
            status: QuoteStatus.Rejected,
            // Note: The schema might need to be updated to include a reason field
            // For now, we'll just update the status
          },
        },
        refetchQueries: ["GetQuoteById"],
      });

      notifySuccess("Quote rejected successfully");
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error rejecting quote:", error);
      notifyError("Failed to reject quote. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reject Quote</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to reject this quote?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
            The seller will be notified of your rejection. You can optionally provide a reason
            below.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason for rejection (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let the seller know why you're rejecting this quote..."
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Note: The reason field will be available once backend support is added.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleReject} disabled={loading} color="error">
          {loading ? "Rejecting..." : "Reject Quote"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
