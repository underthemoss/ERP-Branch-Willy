"use client";

import { graphql } from "@/graphql";
import { useSetInvoiceTaxMutation } from "@/graphql/hooks";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import React, { useState } from "react";

interface EditInvoiceTaxesDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  currentTaxPercent: number;
}

const SET_INVOICE_TAX = graphql(`
  mutation SetInvoiceTax($input: SetInvoiceTaxInput!) {
    setInvoiceTax(input: $input) {
      id
      taxPercent
      taxesInCents
      subTotalInCents
      finalSumInCents
      updatedAt
    }
  }
`);

export default function EditInvoiceTaxesDialog({
  open,
  onClose,
  invoiceId,
  currentTaxPercent,
}: EditInvoiceTaxesDialogProps) {
  const [taxPercent, setTaxPercent] = useState<number | "">(currentTaxPercent * 100);
  const [setInvoiceTax, { loading, error }] = useSetInvoiceTaxMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taxPercent) {
      await setInvoiceTax({
        variables: {
          input: {
            invoiceId,
            taxPercent: taxPercent / 100,
          },
        },
      });
    }

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Taxes</DialogTitle>
        <DialogContent>
          <TextField
            label="Tax Percentage"
            type="number"
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value === "" ? "" : Number(e.target.value))}
            inputProps={{ min: 0, max: 100, step: 0.01 }}
            fullWidth
            margin="normal"
            required
          />
          {error && <div style={{ color: "red", marginTop: 8 }}>{error.message}</div>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Saving..." : "Submit"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
