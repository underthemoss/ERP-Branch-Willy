"use client";

import { GetQuoteByIdQuery } from "@/graphql/graphql";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import * as React from "react";

type QuoteRevision = NonNullable<GetQuoteByIdQuery["quoteById"]>["currentRevision"];

interface RevisionHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  currentRevision?: QuoteRevision | null;
  quoteId: string;
}

function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RevisionHistoryDialog({
  open,
  onClose,
  currentRevision,
  quoteId,
}: RevisionHistoryDialogProps) {
  const totalAmount = React.useMemo(() => {
    if (!currentRevision?.lineItems) return 0;
    return currentRevision.lineItems.reduce((sum, item) => {
      return sum + (item.subtotalInCents || 0);
    }, 0);
  }, [currentRevision]);

  const createdByName = React.useMemo(() => {
    if (!currentRevision?.createdByUser) return "Unknown";
    const { firstName, lastName, email } = currentRevision.createdByUser;
    if (firstName || lastName) {
      return `${firstName || ""} ${lastName || ""}`.trim();
    }
    return email || "Unknown";
  }, [currentRevision]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Revision History</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Current Revision Display */}
          {currentRevision ? (
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">Revision #{currentRevision.revisionNumber}</Typography>
                <Chip label="Current" color="primary" size="small" />
              </Stack>

              <Stack spacing={1} sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body2">{createdByName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2">{formatDate(currentRevision.createdAt)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Valid Until
                  </Typography>
                  <Typography variant="body2">{formatDate(currentRevision.validUntil)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatPrice(totalAmount)}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Line Items ({currentRevision.lineItems.length})
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentRevision.lineItems.map((item, index) => (
                    <TableRow key={item.id || `item-${index}`}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Chip label={item.type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{formatPrice(item.subtotalInCents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No revision information available.
            </Typography>
          )}

          {/* Placeholder for Historical Revisions */}
          <Box
            sx={{
              p: 3,
              border: "2px dashed",
              borderColor: "divider",
              borderRadius: 1,
              textAlign: "center",
            }}
          >
            <Typography variant="body1" gutterBottom>
              📜 Revision History
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              View and compare all previous revisions of this quote
            </Typography>
            <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
              ⚠️ Backend support pending
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              The backend needs to provide a query to list all revisions for a quote (e.g.,
              listQuoteRevisions or add a revisions field to the Quote type).
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
