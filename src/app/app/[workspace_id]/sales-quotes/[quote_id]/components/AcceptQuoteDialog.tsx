"use client";

import { graphql } from "@/graphql";
import { useAcceptQuoteMutation } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import {
  Alert,
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

graphql(`
  mutation AcceptQuoteOnBehalfOfBuyer($input: AcceptQuoteInput!) {
    acceptQuote(input: $input) {
      quote {
        id
        status
        updatedAt
      }
      salesOrder {
        id
        sales_order_number
      }
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
  const [acceptQuote, { loading }] = useAcceptQuoteMutation();
  const [approvalConfirmation, setApprovalConfirmation] = React.useState("");
  const [validationError, setValidationError] = React.useState("");

  const handleClose = () => {
    setApprovalConfirmation("");
    setValidationError("");
    onClose();
  };

  const handleAccept = async () => {
    // Validate approval confirmation
    if (!approvalConfirmation.trim()) {
      setValidationError("Please document how buyer approval was obtained");
      return;
    }

    setValidationError("");

    try {
      const result = await acceptQuote({
        variables: {
          input: {
            quoteId,
            approvalConfirmation: approvalConfirmation.trim(),
          },
        },
        refetchQueries: ["SalesQuoteDetail_GetQuoteById"],
      });

      const salesOrderNumber = result.data?.acceptQuote?.salesOrder?.sales_order_number;

      let successMessage = "Quote accepted successfully on behalf of buyer";
      if (salesOrderNumber) {
        successMessage += ` - Sales Order ${salesOrderNumber} created`;
      }

      notifySuccess(successMessage);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error accepting quote:", error);
      notifyError("Failed to accept quote. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Accept Quote on Behalf of Buyer</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            You are accepting this quote on behalf of the buyer. This will create a sales order and
            mark the quote as accepted.
          </Alert>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please document how you obtained buyer approval:
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="e.g., 'Buyer approved via phone call on Nov 19, 2025' or 'Email confirmation received from buyer on Nov 19, 2025'"
            value={approvalConfirmation}
            onChange={(e) => {
              setApprovalConfirmation(e.target.value);
              setValidationError("");
            }}
            error={!!validationError}
            helperText={validationError}
            sx={{ mt: 1 }}
            disabled={loading}
          />

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            By accepting, you confirm that:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 3 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              You have received approval from the buyer
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              A sales order will be automatically created
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              The buyer will be notified of the acceptance
            </Typography>
          </Box>
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
