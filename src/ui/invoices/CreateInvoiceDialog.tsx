"use client";

import { graphql } from "@/graphql";
import { useCreateInvoiceMutation } from "@/graphql/hooks";
import ContactSelector from "@/ui/ContactSelector";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export const CreateInvoiceMutation = graphql(`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
      buyerId
      sellerId
      subTotalInCents
      status
      createdAt
    }
  }
`);

interface CreateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  workspaceId: string;
}

export default function CreateInvoiceDialog({
  open,
  onClose,
  onCreated,
  workspaceId,
}: CreateInvoiceDialogProps) {
  const [buyerId, setBuyerId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [createInvoice, { loading, error }] = useCreateInvoiceMutation();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createInvoice({
      variables: {
        input: {
          buyerId,
          sellerId,
          workspaceId,
        },
      },
    });
    setBuyerId("");
    setSellerId("");
    onCreated();
    onClose();
    // Redirect to the new invoice display page
    const newInvoiceId = result.data?.createInvoice?.id;
    if (newInvoiceId) {
      router.push(`/app/${workspaceId}/invoices/${newInvoiceId}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create Invoice</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box>
              <Box mb={1} fontWeight={600}>
                Buyer
              </Box>
              <ContactSelector
                contactId={buyerId}
                onChange={setBuyerId}
                workspaceId={workspaceId}
              />
            </Box>
            <Box>
              <Box mb={1} fontWeight={600}>
                Seller
              </Box>
              <ContactSelector
                contactId={sellerId}
                onChange={setSellerId}
                workspaceId={workspaceId}
              />
            </Box>
            {error && (
              <Box color="error.main" mt={1}>
                {error.message}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
