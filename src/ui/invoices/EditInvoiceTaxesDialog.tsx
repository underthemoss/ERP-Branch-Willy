"use client";

import { graphql } from "@/graphql";
import { TaxType } from "@/graphql/graphql";
import {
  useAddTaxLineItemMutation,
  useClearInvoiceTaxesMutation,
  useRemoveTaxLineItemMutation,
  useUpdateTaxLineItemMutation,
} from "@/graphql/hooks";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
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
  const [isReordering, setIsReordering] = useState(false);

  // Local state for input values to allow empty strings
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [newItemInputValue, setNewItemInputValue] = useState<string>("0");

  const [addTaxLineItem, { loading: addLoading }] = useAddTaxLineItemMutation();
  const [updateTaxLineItem, { loading: updateLoading }] = useUpdateTaxLineItemMutation();
  const [removeTaxLineItem, { loading: removeLoading }] = useRemoveTaxLineItemMutation();
  const [clearInvoiceTaxes, { loading: clearLoading }] = useClearInvoiceTaxesMutation();

  const loading = addLoading || updateLoading || removeLoading || clearLoading;

  useEffect(() => {
    if (open && !isReordering) {
      // Convert cents to dollars for fixed amounts when loading
      const itemsWithConvertedValues = taxLineItems.map((item) => ({
        ...item,
        value: item.type === TaxType.FixedAmount ? item.value : item.value,
      }));
      // Sort items by order
      const sortedItems = [...itemsWithConvertedValues].sort((a, b) => a.order - b.order);
      setEditedItems(sortedItems);

      // Initialize input values
      const initialInputValues: { [key: string]: string } = {};
      sortedItems.forEach((item) => {
        const displayValue = item.type === TaxType.Percentage ? item.value * 100 : item.value / 100;
        initialInputValues[item.id] = displayValue.toString();
      });
      setInputValues(initialInputValues);

      setNewItem({
        description: "",
        type: TaxType.Percentage,
        value: 0,
      });
      setNewItemInputValue("0");
      setErrors([]);
    }
  }, [open, taxLineItems, isReordering]);

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
      setNewItemInputValue("0");
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
    setIsReordering(false);
    onClose();
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(editedItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order property for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setEditedItems(updatedItems);
    setIsReordering(true);

    // Update the order in the backend for the moved item and affected items
    try {
      // We need to update all items that had their order changed
      const updatePromises = updatedItems
        .filter((item, index) => item.order !== editedItems.findIndex((ei) => ei.id === item.id))
        .map((item) =>
          updateTaxLineItem({
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
            // Disable automatic cache updates to prevent flickering
            update: () => {},
          }),
        );

      await Promise.all(updatePromises);
      setIsReordering(false);
    } catch (error) {
      setErrors([`Failed to reorder tax items: ${error}`]);
      // Revert the order on error
      setEditedItems([...editedItems].sort((a, b) => a.order - b.order));
      setIsReordering(false);
    }
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
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="tax-items">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {editedItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              sx={{
                                display: "flex",
                                gap: 2,
                                alignItems: "center",
                                p: 2,
                                mb: 1,
                                border: "1px solid",
                                borderColor: snapshot.isDragging ? "primary.main" : "divider",
                                borderRadius: 1,
                                backgroundColor: snapshot.isDragging
                                  ? "action.hover"
                                  : "background.paper",
                                boxShadow: snapshot.isDragging ? 3 : 0,
                                transition: "all 0.2s ease",
                              }}
                            >
                              <Box
                                {...provided.dragHandleProps}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  cursor: "grab",
                                  color: "text.secondary",
                                  "&:active": {
                                    cursor: "grabbing",
                                  },
                                }}
                              >
                                <DragIndicatorIcon />
                              </Box>
                              <TextField
                                label="Description"
                                value={item.description}
                                onChange={(e) =>
                                  handleUpdateItem(index, "description", e.target.value)
                                }
                                size="small"
                                sx={{ flex: 2 }}
                              />
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Type</InputLabel>
                                <Select
                                  value={item.type}
                                  label="Type"
                                  onChange={(e) => {
                                    handleUpdateItem(index, "type", e.target.value);
                                    // Recalculate display value when type changes
                                    const currentVal = parseFloat(inputValues[item.id] || "0");
                                    if (!isNaN(currentVal)) {
                                      const newValue =
                                        e.target.value === TaxType.Percentage
                                          ? (currentVal * 100).toString()
                                          : (currentVal / 100).toString();
                                      setInputValues({ ...inputValues, [item.id]: newValue });
                                    }
                                  }}
                                >
                                  <MenuItem value={TaxType.Percentage}>Percentage</MenuItem>
                                  <MenuItem value={TaxType.FixedAmount}>Fixed Amount</MenuItem>
                                </Select>
                              </FormControl>
                              <TextField
                                label={
                                  item.type === TaxType.Percentage ? "Percentage" : "Amount ($)"
                                }
                                value={inputValues[item.id] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  // Update local input value (allows empty string)
                                  setInputValues({ ...inputValues, [item.id]: val });

                                  // Update actual value if valid number
                                  const numVal = parseFloat(val);
                                  if (!isNaN(numVal)) {
                                    handleUpdateItem(
                                      index,
                                      "value",
                                      item.type === TaxType.Percentage
                                        ? numVal / 100
                                        : numVal * 100,
                                    );
                                  }
                                }}
                                onBlur={(e) => {
                                  // Ensure a valid value on blur
                                  if (e.target.value === "" || isNaN(parseFloat(e.target.value))) {
                                    handleUpdateItem(index, "value", 0);
                                    setInputValues({ ...inputValues, [item.id]: "0" });
                                  }
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
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ minWidth: 80 }}
                                >
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
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
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
                  onChange={(e) => {
                    const newType = e.target.value as TaxType;
                    setNewItem({ ...newItem, type: newType });
                    // Recalculate display value when type changes
                    const currentVal = parseFloat(newItemInputValue || "0");
                    if (!isNaN(currentVal)) {
                      const newValue =
                        newType === TaxType.Percentage
                          ? (currentVal * 100).toString()
                          : (currentVal / 100).toString();
                      setNewItemInputValue(newValue);
                    }
                  }}
                >
                  <MenuItem value={TaxType.Percentage}>Percentage</MenuItem>
                  <MenuItem value={TaxType.FixedAmount}>Fixed Amount</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label={newItem.type === TaxType.Percentage ? "Percentage" : "Amount ($)"}
                value={newItemInputValue}
                onChange={(e) => {
                  const val = e.target.value;
                  // Update local input value (allows empty string)
                  setNewItemInputValue(val);

                  // Update actual value if valid number
                  const numVal = parseFloat(val);
                  if (!isNaN(numVal)) {
                    setNewItem({
                      ...newItem,
                      value: newItem.type === TaxType.Percentage ? numVal / 100 : numVal * 100,
                    });
                  }
                }}
                onBlur={(e) => {
                  // Ensure a valid value on blur
                  if (e.target.value === "" || isNaN(parseFloat(e.target.value))) {
                    setNewItem({
                      ...newItem,
                      value: 0,
                    });
                    setNewItemInputValue("0");
                  }
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
