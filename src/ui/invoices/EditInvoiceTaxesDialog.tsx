"use client";

import { graphql } from "@/graphql";
import { TaxType } from "@/graphql/graphql";
import {
  useAddTaxLineItemMutation,
  useClearInvoiceTaxesMutation,
  useRemoveTaxLineItemMutation,
  useUpdateTaxLineItemMutation,
} from "@/graphql/hooks";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";

interface TaxLineItem {
  id: string;
  description: string;
  type: TaxType;
  value: number;
  order: number;
  calculatedAmountInCents?: number | null;
}

interface EditInvoiceTaxesDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  currentTaxPercent?: number;
  taxLineItems?: TaxLineItem[];
}

// GraphQL mutations
graphql(`
  mutation AddTaxLineItem($input: AddTaxLineItemInput!) {
    addTaxLineItem(input: $input) {
      id
      taxLineItems {
        id
        description
        type
        value
        order
        calculatedAmountInCents
      }
      totalTaxesInCents
      finalSumInCents
    }
  }
`);

graphql(`
  mutation UpdateTaxLineItem($input: UpdateTaxLineItemInput!) {
    updateTaxLineItem(input: $input) {
      id
      taxLineItems {
        id
        description
        type
        value
        order
        calculatedAmountInCents
      }
      totalTaxesInCents
      finalSumInCents
    }
  }
`);

graphql(`
  mutation RemoveTaxLineItem($input: RemoveTaxLineItemInput!) {
    removeTaxLineItem(input: $input) {
      id
      taxLineItems {
        id
        description
        type
        value
        order
        calculatedAmountInCents
      }
      totalTaxesInCents
      finalSumInCents
    }
  }
`);

graphql(`
  mutation ClearInvoiceTaxes($invoiceId: ID!) {
    clearInvoiceTaxes(invoiceId: $invoiceId) {
      id
      taxLineItems {
        id
        description
        type
        value
        order
        calculatedAmountInCents
      }
      totalTaxesInCents
      finalSumInCents
    }
  }
`);

interface NewTaxLineItem {
  description: string;
  type: TaxType;
  value: number;
}

export default function EditInvoiceTaxesDialog({
  open,
  onClose,
  invoiceId,
  currentTaxPercent,
  taxLineItems = [],
}: EditInvoiceTaxesDialogProps) {
  const [editedItems, setEditedItems] = useState<TaxLineItem[]>([]);
  const [newItem, setNewItem] = useState<NewTaxLineItem>({
    description: "",
    type: TaxType.Percentage,
    value: 0,
  });
  const [errors, setErrors] = useState<string[]>([]);

  const [addTaxLineItem, { loading: addLoading }] = useAddTaxLineItemMutation();
  const [updateTaxLineItem, { loading: updateLoading }] = useUpdateTaxLineItemMutation();
  const [removeTaxLineItem, { loading: removeLoading }] = useRemoveTaxLineItemMutation();
  const [clearInvoiceTaxes, { loading: clearLoading }] = useClearInvoiceTaxesMutation();

  const loading = addLoading || updateLoading || removeLoading || clearLoading;

  useEffect(() => {
    if (open) {
      // Convert cents to dollars for fixed amounts when loading
      const itemsWithConvertedValues = taxLineItems.map((item) => ({
        ...item,
        value: item.type === TaxType.FixedAmount ? item.value : item.value,
      }));
      setEditedItems(itemsWithConvertedValues);
      setNewItem({
        description: "",
        type: TaxType.Percentage,
        value: 0,
      });
      setErrors([]);
    }
  }, [open, taxLineItems]);

  const handleUpdateItem = (index: number, field: keyof TaxLineItem, value: any) => {
    const updated = [...editedItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditedItems(updated);
  };

  const handleAddNewItem = async () => {
    if (!newItem.description.trim()) {
      setErrors(["Description is required for new tax item"]);
      return;
    }

    try {
      await addTaxLineItem({
        variables: {
          input: {
            invoiceId,
            description: newItem.description,
            type: newItem.type,
            value: newItem.type === TaxType.FixedAmount ? Math.round(newItem.value) : newItem.value,
            order: editedItems.length,
          },
        },
      });

      // Reset new item form
      setNewItem({
        description: "",
        type: TaxType.Percentage,
        value: 0,
      });
      setErrors([]);
    } catch (error) {
      setErrors([`Failed to add tax item: ${error}`]);
    }
  };

  const handleUpdateExistingItem = async (item: TaxLineItem) => {
    try {
      await updateTaxLineItem({
        variables: {
          input: {
            invoiceId,
            taxLineItemId: item.id,
            description: item.description,
            type: item.type,
            value: item.type === TaxType.FixedAmount ? Math.round(item.value) : item.value,
            order: item.order,
          },
        },
      });
    } catch (error) {
      setErrors([`Failed to update tax item: ${error}`]);
    }
  };

  const handleRemoveItem = async (taxLineItemId: string) => {
    try {
      await removeTaxLineItem({
        variables: {
          input: {
            invoiceId,
            taxLineItemId,
          },
        },
      });
    } catch (error) {
      setErrors([`Failed to remove tax item: ${error}`]);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearInvoiceTaxes({
        variables: {
          invoiceId,
        },
      });
    } catch (error) {
      setErrors([`Failed to clear taxes: ${error}`]);
    }
  };

  const handleClose = () => {
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Taxes</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {errors.length > 0 && (
            <Alert severity="error">
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </Alert>
          )}

          {/* Existing Tax Line Items */}
          {editedItems.length > 0 && (
            <>
              <Typography variant="subtitle1">Tax Line Items</Typography>
              {editedItems.map((item, index) => (
                <Box
                  key={item.id}
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "center",
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                  }}
                >
                  <TextField
                    label="Description"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(index, "description", e.target.value)}
                    size="small"
                    sx={{ flex: 2 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={item.type}
                      label="Type"
                      onChange={(e) => handleUpdateItem(index, "type", e.target.value)}
                    >
                      <MenuItem value={TaxType.Percentage}>Percentage</MenuItem>
                      <MenuItem value={TaxType.FixedAmount}>Fixed Amount</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label={item.type === TaxType.Percentage ? "Percentage" : "Amount ($)"}
                    type="number"
                    value={item.type === TaxType.Percentage ? item.value * 100 : item.value / 100}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      handleUpdateItem(
                        index,
                        "value",
                        item.type === TaxType.Percentage ? val / 100 : val * 100,
                      );
                    }}
                    inputProps={{
                      min: 0,
                      max: item.type === TaxType.Percentage ? 100 : undefined,
                      step: item.type === TaxType.Percentage ? 0.01 : 0.01,
                    }}
                    size="small"
                    sx={{ width: 120 }}
                  />
                  {item.calculatedAmountInCents != null && (
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                      £{(item.calculatedAmountInCents / 100).toFixed(2)}
                    </Typography>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleUpdateExistingItem(item)}
                    disabled={loading}
                  >
                    Update
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={loading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </>
          )}

          {/* Add New Tax Line Item */}
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Add New Tax Item
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                p: 2,
                border: "1px solid",
                borderColor: "primary.main",
                borderRadius: 1,
                backgroundColor: "action.hover",
              }}
            >
              <TextField
                label="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                size="small"
                sx={{ flex: 2 }}
                placeholder="e.g., VAT, Sales Tax"
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newItem.type}
                  label="Type"
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value as TaxType })}
                >
                  <MenuItem value={TaxType.Percentage}>Percentage</MenuItem>
                  <MenuItem value={TaxType.FixedAmount}>Fixed Amount</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={newItem.type === TaxType.Percentage ? "Percentage" : "Amount ($)"}
                type="number"
                value={
                  newItem.type === TaxType.Percentage ? newItem.value * 100 : newItem.value / 100
                }
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setNewItem({
                    ...newItem,
                    value: newItem.type === TaxType.Percentage ? val / 100 : val * 100,
                  });
                }}
                inputProps={{
                  min: 0,
                  max: newItem.type === TaxType.Percentage ? 100 : undefined,
                  step: newItem.type === TaxType.Percentage ? 0.01 : 0.01,
                }}
                size="small"
                sx={{ width: 120 }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddNewItem}
                disabled={loading || !newItem.description.trim()}
              >
                Add
              </Button>
            </Box>
          </Box>

          {/* Clear All Button */}
          {editedItems.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="outlined" color="error" onClick={handleClearAll} disabled={loading}>
                Clear All Taxes
              </Button>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
