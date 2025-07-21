"use client";

import { graphql } from "@/graphql";
import { TaxType } from "@/graphql/graphql";
import {
  useAddTaxLineItemMutation,
  useClearInvoiceTaxesMutation,
  useInvoiceForTaxSuggestionsQuery,
  useRemoveTaxLineItemMutation,
  useSuggestTaxObligationsLazyQuery,
  useUpdateTaxLineItemMutation,
} from "@/graphql/hooks";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import AddIcon from "@mui/icons-material/Add";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
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

// GraphQL query for tax suggestions
graphql(`
  query SuggestTaxObligations($invoiceDescription: String!) {
    llm {
      suggestTaxObligations(invoiceDescription: $invoiceDescription) {
        location {
          state
          county
          city
          zipCode
        }
        lineItems {
          description
          category
          amount
        }
        taxes {
          description
          type
          value
          order
          reason
        }
      }
    }
  }
`);

// GraphQL query to fetch invoice details for building description
graphql(`
  query InvoiceForTaxSuggestions($id: String!) {
    invoiceById(id: $id) {
      id
      subTotalInCents
      lineItems {
        chargeId
        description
        totalInCents
      }
      buyer {
        __typename
        ... on BusinessContact {
          id
          name
          address
        }
        ... on PersonContact {
          id
          name
        }
      }
    }
  }
`);

interface NewTaxLineItem {
  description: string;
  type: TaxType;
  value: number;
}

interface PresetTaxItem {
  id: string;
  description: string;
  type: TaxType;
  value: number;
  category: string;
  reason?: string;
}

// Empty array since we'll only use AI suggestions
const PRESET_TAX_ITEMS: PresetTaxItem[] = [];

// Helper function to build invoice description for tax suggestions
function buildInvoiceDescription(invoice: any): string {
  if (!invoice) return "";

  const parts: string[] = [];

  // Add invoice ID
  parts.push(`Invoice #${invoice.id}`);

  // Add buyer info
  if (invoice.buyer) {
    parts.push(`Customer: ${invoice.buyer.name}`);
    if (invoice.buyer.__typename === "BusinessContact" && invoice.buyer.address) {
      parts.push(`Location: ${invoice.buyer.address}`);
    }
  }

  // Add line items
  if (invoice.lineItems && invoice.lineItems.length > 0) {
    parts.push("\nLine Items:");
    invoice.lineItems.forEach((item: any, index: number) => {
      const amount = (item.totalInCents / 100).toFixed(2);
      parts.push(`${index + 1}. ${item.description} = £${amount}`);
    });
  }

  // Add subtotal
  if (invoice.subTotalInCents != null) {
    parts.push(`\nSubtotal: £${(invoice.subTotalInCents / 100).toFixed(2)}`);
  }

  return parts.join("\n");
}

export default function EditInvoiceTaxesDialog({
  open,
  onClose,
  invoiceId,
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
  const [totalTaxesInCents, setTotalTaxesInCents] = useState<number | null>(null);

  // Local state for input values to allow empty strings
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const [newItemInputValue, setNewItemInputValue] = useState<string>("0");

  // State for suggested tax items
  const [suggestedTaxItems, setSuggestedTaxItems] = useState<PresetTaxItem[]>([]);

  const [addTaxLineItem, { loading: addLoading }] = useAddTaxLineItemMutation({
    onCompleted: (data) => {
      if (data.addTaxLineItem.totalTaxesInCents != null) {
        setTotalTaxesInCents(data.addTaxLineItem.totalTaxesInCents);
      }
    },
  });
  const [updateTaxLineItem, { loading: updateLoading }] = useUpdateTaxLineItemMutation({
    onCompleted: (data) => {
      if (data.updateTaxLineItem.totalTaxesInCents != null) {
        setTotalTaxesInCents(data.updateTaxLineItem.totalTaxesInCents);
      }
    },
  });
  const [removeTaxLineItem, { loading: removeLoading }] = useRemoveTaxLineItemMutation({
    onCompleted: (data) => {
      if (data.removeTaxLineItem.totalTaxesInCents != null) {
        setTotalTaxesInCents(data.removeTaxLineItem.totalTaxesInCents);
      }
    },
  });
  const [clearInvoiceTaxes, { loading: clearLoading }] = useClearInvoiceTaxesMutation({
    onCompleted: (data) => {
      if (data.clearInvoiceTaxes.totalTaxesInCents != null) {
        setTotalTaxesInCents(data.clearInvoiceTaxes.totalTaxesInCents);
      }
    },
  });

  const [suggestTaxObligations, { loading: suggestLoading }] = useSuggestTaxObligationsLazyQuery({
    fetchPolicy: "cache-and-network",
    onCompleted: (data: any) => {
      if (data.llm?.suggestTaxObligations?.taxes) {
        const suggestedTaxes = data.llm.suggestTaxObligations.taxes;

        // Convert suggested taxes to preset tax items format
        const newSuggestedItems: PresetTaxItem[] = suggestedTaxes.map(
          (tax: any, index: number) => ({
            id: `suggested-${index}-${Date.now()}`,
            description: tax.description,
            type: tax.type,
            value: tax.type === TaxType.FixedAmount ? tax.value * 100 : tax.value, // Convert to cents for fixed amounts
            category: "AI Suggested Taxes",
            reason: tax.reason,
          }),
        );

        setSuggestedTaxItems(newSuggestedItems);
      }
    },
  });

  // Fetch invoice data to build description
  const { data: invoiceData } = useInvoiceForTaxSuggestionsQuery({
    variables: { id: invoiceId },
    skip: !open,
    fetchPolicy: "cache-and-network",
  });

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

      // Calculate initial total from existing items
      const initialTotal = sortedItems.reduce((sum, item) => {
        return sum + (item.calculatedAmountInCents || 0);
      }, 0);
      setTotalTaxesInCents(initialTotal);

      setNewItem({
        description: "",
        type: TaxType.Percentage,
        value: 0,
      });
      setNewItemInputValue("0");
      setErrors([]);
    } else if (!open) {
      // Clear suggested items when dialog closes
      setSuggestedTaxItems([]);
    }
  }, [open, taxLineItems, isReordering]);

  // Fetch tax suggestions when invoice data is loaded
  useEffect(() => {
    if (open && invoiceData?.invoiceById) {
      const invoiceDescription = buildInvoiceDescription(invoiceData.invoiceById);
      if (invoiceDescription) {
        suggestTaxObligations({
          variables: {
            invoiceDescription,
          },
        });
      }
    }
  }, [open, invoiceData, suggestTaxObligations]);

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

    // Handle drag from preset items to tax items
    if (
      result.source.droppableId === "preset-items" &&
      result.destination.droppableId === "tax-items"
    ) {
      const presetItem = suggestedTaxItems.find((item) => item.id === result.draggableId);
      if (presetItem) {
        try {
          await addTaxLineItem({
            variables: {
              input: {
                invoiceId,
                description: presetItem.description,
                type: presetItem.type,
                value:
                  presetItem.type === TaxType.FixedAmount
                    ? Math.round(presetItem.value)
                    : presetItem.value,
                order: result.destination.index,
              },
            },
          });
        } catch (error) {
          setErrors([`Failed to add preset tax item: ${error}`]);
        }
      }
      return;
    }

    // Handle reordering within tax items
    if (
      result.source.droppableId === "tax-items" &&
      result.destination.droppableId === "tax-items"
    ) {
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
    }
  };

  // Group suggested items by category
  const groupedPresetItems = suggestedTaxItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, PresetTaxItem[]>,
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
            height: "90vh",
            maxHeight: "900px",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "1.5rem",
            fontWeight: 600,
            pb: 1,
          }}
        >
          Edit Taxes
        </DialogTitle>
        {loading && (
          <LinearProgress
            sx={{
              position: "absolute",
              top: "64px",
              left: 0,
              right: 0,
              zIndex: 1,
            }}
          />
        )}
        <Divider />
        <DialogContent sx={{ p: 0, display: "flex", height: "calc(100% - 120px)" }}>
          {/* Left Sidebar with Preset Tax Items */}
          <Box
            sx={{
              width: 320,
              borderRight: "1px solid",
              borderColor: "divider",
              p: 2,
              backgroundColor: "grey.50",
              overflowY: "auto",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                mb: 2,
                fontSize: "1rem",
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              Suggested Tax Items
            </Typography>
            {suggestLoading ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 4,
                  gap: 2,
                }}
              >
                <CircularProgress size={40} thickness={4} />
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    textAlign: "center",
                  }}
                >
                  Analyzing invoice details and generating tax suggestions...
                </Typography>
              </Box>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 2,
                  color: "text.secondary",
                }}
              >
                {suggestedTaxItems.length > 0
                  ? "Drag items to add them to your invoice"
                  : "No tax suggestions available"}
              </Typography>
            )}

            {!suggestLoading && (
              <Droppable droppableId="preset-items" isDropDisabled={true}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {Object.entries(groupedPresetItems).map(([category, items]) => (
                      <Box key={category} sx={{ mb: 3 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            mb: 1,
                            fontWeight: 600,
                            color: "primary.main",
                            fontSize: "0.875rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                          {category}
                        </Typography>
                        <Stack spacing={1}>
                          {items.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <>
                                  <Paper
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    elevation={snapshot.isDragging ? 4 : 0}
                                    sx={{
                                      p: 1.5,
                                      cursor: "grab",
                                      border: "1px solid",
                                      borderColor: snapshot.isDragging
                                        ? "primary.main"
                                        : "primary.light",
                                      backgroundColor: snapshot.isDragging
                                        ? "primary.50"
                                        : "primary.50",
                                      "&:hover": {
                                        borderColor: "primary.main",
                                        backgroundColor: "primary.100",
                                      },
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {item.description}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {item.type === TaxType.Percentage
                                        ? `${(item.value * 100).toFixed(2)}%`
                                        : `$${(item.value / 100).toFixed(2)}`}
                                    </Typography>
                                    {item.reason && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                          display: "block",
                                          mt: 0.5,
                                          fontStyle: "italic",
                                        }}
                                      >
                                        {item.reason}
                                      </Typography>
                                    )}
                                  </Paper>
                                  {snapshot.isDragging && (
                                    <Paper
                                      elevation={0}
                                      sx={{
                                        p: 1.5,
                                        border: "1px dashed",
                                        borderColor: "divider",
                                        backgroundColor: "grey.100",
                                        opacity: 0.5,
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {item.description}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {item.type === TaxType.Percentage
                                          ? `${(item.value * 100).toFixed(2)}%`
                                          : `$${(item.value / 100).toFixed(2)}`}
                                      </Typography>
                                    </Paper>
                                  )}
                                </>
                              )}
                            </Draggable>
                          ))}
                        </Stack>
                      </Box>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </Box>

          {/* Main Content Area */}
          <Box sx={{ flex: 1, p: 3, overflowY: "auto" }}>
            <Stack spacing={3}>
              {errors.length > 0 && (
                <Alert severity="error">
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </Alert>
              )}

              {/* Existing Tax Line Items */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "text.primary",
                  }}
                >
                  Tax Line Items
                </Typography>
                <Droppable droppableId="tax-items">
                  {(provided, snapshot) => (
                    <Stack spacing={1.5} {...provided.droppableProps} ref={provided.innerRef}>
                      {editedItems.length === 0 && (
                        <Paper
                          sx={{
                            p: 4,
                            border: "2px dashed",
                            borderColor: snapshot.isDraggingOver ? "primary.main" : "grey.300",
                            borderRadius: 2,
                            backgroundColor: snapshot.isDraggingOver ? "primary.50" : "grey.50",
                            textAlign: "center",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              color: "text.secondary",
                              mb: 1,
                              fontSize: "1rem",
                            }}
                          >
                            No tax items added yet
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "text.secondary",
                            }}
                          >
                            Drag tax items from the left sidebar or create a new one below
                          </Typography>
                        </Paper>
                      )}
                      {editedItems.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              elevation={snapshot.isDragging ? 8 : 0}
                              sx={{
                                p: 2,
                                border: "1px solid",
                                borderColor: snapshot.isDragging ? "primary.main" : "divider",
                                borderRadius: 2,
                                backgroundColor: snapshot.isDragging
                                  ? "primary.50"
                                  : "background.paper",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  borderColor: "primary.light",
                                  backgroundColor: "action.hover",
                                },
                              }}
                            >
                              <Grid container spacing={2} alignItems="center">
                                <Grid size={{ xs: "auto" }}>
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
                                </Grid>

                                <Grid size={{ xs: 12, sm: 3 }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mb: 0.5, display: "block" }}
                                  >
                                    Description
                                  </Typography>
                                  <TextField
                                    value={item.description}
                                    onChange={(e) =>
                                      handleUpdateItem(index, "description", e.target.value)
                                    }
                                    size="small"
                                    fullWidth
                                    variant="outlined"
                                    sx={{
                                      "& .MuiOutlinedInput-root": {
                                        backgroundColor: "background.default",
                                      },
                                    }}
                                  />
                                </Grid>

                                <Grid size={{ xs: 12, sm: 2 }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mb: 0.5, display: "block" }}
                                  >
                                    Type
                                  </Typography>
                                  <Select
                                    value={item.type}
                                    onChange={(e) => {
                                      handleUpdateItem(index, "type", e.target.value);
                                      const currentVal = parseFloat(inputValues[item.id] || "0");
                                      if (!isNaN(currentVal)) {
                                        const newValue =
                                          e.target.value === TaxType.Percentage
                                            ? (currentVal * 100).toString()
                                            : (currentVal / 100).toString();
                                        setInputValues({ ...inputValues, [item.id]: newValue });
                                      }
                                    }}
                                    size="small"
                                    fullWidth
                                    sx={{
                                      backgroundColor: "background.default",
                                    }}
                                  >
                                    <MenuItem value={TaxType.Percentage}>Percentage</MenuItem>
                                    <MenuItem value={TaxType.FixedAmount}>Fixed Amount</MenuItem>
                                  </Select>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 2 }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mb: 0.5, display: "block" }}
                                  >
                                    {item.type === TaxType.Percentage ? "Percentage" : "Amount (£)"}
                                  </Typography>
                                  <TextField
                                    value={inputValues[item.id] || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setInputValues({ ...inputValues, [item.id]: val });
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
                                      if (
                                        e.target.value === "" ||
                                        isNaN(parseFloat(e.target.value))
                                      ) {
                                        handleUpdateItem(index, "value", 0);
                                        setInputValues({ ...inputValues, [item.id]: "0" });
                                      }
                                    }}
                                    InputProps={{
                                      startAdornment:
                                        item.type === TaxType.Percentage ? null : (
                                          <InputAdornment position="start">£</InputAdornment>
                                        ),
                                      endAdornment:
                                        item.type === TaxType.Percentage ? (
                                          <InputAdornment position="end">%</InputAdornment>
                                        ) : null,
                                    }}
                                    inputProps={{
                                      min: 0,
                                      max: item.type === TaxType.Percentage ? 100 : undefined,
                                      step: 0.01,
                                    }}
                                    size="small"
                                    fullWidth
                                    sx={{
                                      "& .MuiOutlinedInput-root": {
                                        backgroundColor: "background.default",
                                      },
                                    }}
                                  />
                                </Grid>

                                {item.calculatedAmountInCents != null && (
                                  <Grid size={{ xs: 12, sm: 1.5 }}>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ mb: 0.5, display: "block" }}
                                    >
                                      Total
                                    </Typography>
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        fontWeight: 600,
                                        color: "primary.main",
                                      }}
                                    >
                                      £{(item.calculatedAmountInCents / 100).toFixed(2)}
                                    </Typography>
                                  </Grid>
                                )}

                                <Grid size={{ xs: 12, sm: "auto" }}>
                                  <Box sx={{ display: "flex", gap: 1, mt: { xs: 1, sm: 2.5 } }}>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      onClick={() => handleUpdateExistingItem(item)}
                                      disabled={loading}
                                      sx={{
                                        textTransform: "none",
                                        boxShadow: "none",
                                        "&:hover": {
                                          boxShadow: 1,
                                        },
                                      }}
                                    >
                                      Update
                                    </Button>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemoveItem(item.id)}
                                      disabled={loading}
                                      sx={{
                                        "&:hover": {
                                          backgroundColor: "error.50",
                                        },
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Stack>
                  )}
                </Droppable>
              </Box>

              {/* Total Tax Amount */}
              {totalTaxesInCents !== null && editedItems.length > 0 && (
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "grey.50",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <Typography variant="h6" sx={{ fontSize: "1.1rem", fontWeight: 600 }}>
                      Total Tax Amount
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: "primary.main",
                        fontSize: "1.5rem",
                      }}
                    >
                      £{(totalTaxesInCents / 100).toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              )}

              {/* Add New Tax Line Item */}
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "text.primary",
                  }}
                >
                  Add New Tax Item
                </Typography>
                <Paper
                  sx={{
                    p: 3,
                    border: "2px dashed",
                    borderColor: "primary.light",
                    borderRadius: 2,
                    backgroundColor: "primary.50",
                    backgroundImage:
                      "linear-gradient(135deg, rgba(25, 118, 210, 0.02) 0%, rgba(25, 118, 210, 0.05) 100%)",
                  }}
                >
                  <Grid container spacing={2} alignItems="flex-end">
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 0.5, display: "block" }}
                      >
                        Description
                      </Typography>
                      <TextField
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        size="small"
                        fullWidth
                        placeholder="e.g., VAT, Sales Tax"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: "background.paper",
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 0.5, display: "block" }}
                      >
                        Type
                      </Typography>
                      <Select
                        value={newItem.type}
                        onChange={(e) => {
                          const newType = e.target.value as TaxType;
                          setNewItem({ ...newItem, type: newType });
                          const currentVal = parseFloat(newItemInputValue || "0");
                          if (!isNaN(currentVal)) {
                            const newValue =
                              newType === TaxType.Percentage
                                ? (currentVal * 100).toString()
                                : (currentVal / 100).toString();
                            setNewItemInputValue(newValue);
                          }
                        }}
                        size="small"
                        fullWidth
                        sx={{
                          backgroundColor: "background.paper",
                        }}
                      >
                        <MenuItem value={TaxType.Percentage}>Percentage</MenuItem>
                        <MenuItem value={TaxType.FixedAmount}>Fixed Amount</MenuItem>
                      </Select>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 3 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 0.5, display: "block" }}
                      >
                        {newItem.type === TaxType.Percentage ? "Percentage" : "Amount (£)"}
                      </Typography>
                      <TextField
                        value={newItemInputValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewItemInputValue(val);
                          const numVal = parseFloat(val);
                          if (!isNaN(numVal)) {
                            setNewItem({
                              ...newItem,
                              value:
                                newItem.type === TaxType.Percentage ? numVal / 100 : numVal * 100,
                            });
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "" || isNaN(parseFloat(e.target.value))) {
                            setNewItem({
                              ...newItem,
                              value: 0,
                            });
                            setNewItemInputValue("0");
                          }
                        }}
                        InputProps={{
                          startAdornment:
                            newItem.type === TaxType.Percentage ? null : (
                              <InputAdornment position="start">£</InputAdornment>
                            ),
                          endAdornment:
                            newItem.type === TaxType.Percentage ? (
                              <InputAdornment position="end">%</InputAdornment>
                            ) : null,
                        }}
                        inputProps={{
                          min: 0,
                          max: newItem.type === TaxType.Percentage ? 100 : undefined,
                          step: 0.01,
                        }}
                        size="small"
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: "background.paper",
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddNewItem}
                        disabled={loading || !newItem.description.trim()}
                        fullWidth
                        sx={{
                          height: 40,
                          textTransform: "none",
                          fontWeight: 600,
                          boxShadow: "none",
                          background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
                          "&:hover": {
                            boxShadow: 2,
                            background: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
                          },
                          "&:disabled": {
                            background: "rgba(0, 0, 0, 0.12)",
                          },
                        }}
                      >
                        Add
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>

              {/* Clear All Button */}
              {editedItems.length > 0 && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleClearAll}
                    disabled={loading}
                    sx={{
                      textTransform: "none",
                      borderWidth: 2,
                      "&:hover": {
                        borderWidth: 2,
                        backgroundColor: "error.50",
                      },
                    }}
                  >
                    Clear All Taxes
                  </Button>
                </Box>
              )}
            </Stack>
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5, backgroundColor: "grey.50" }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
            sx={{
              textTransform: "none",
              minWidth: 100,
              borderColor: "divider",
              color: "text.secondary",
              "&:hover": {
                borderColor: "text.secondary",
                backgroundColor: "grey.100",
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </DragDropContext>
  );
}
