"use client";

import { graphql } from "@/graphql";
import { InventoryCondition, InventoryStatus } from "@/graphql/graphql";
import { useBulkMarkInventoryReceivedMutation, useLineItemInventoryQuery } from "@/graphql/hooks";
import ResourceMapSearchSelector from "@/ui/resource_map/ResourceMapSearchSelector";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getItemDescription } from "./utils";

// Query to fetch inventory for a specific line item
graphql(`
  query LineItemInventory($purchaseOrderId: String!) {
    listInventory(query: { filter: { purchaseOrderId: $purchaseOrderId, status: ON_ORDER } }) {
      items {
        id
        status
        pimCategoryId
        pimCategoryName
        assetId
        pimProductId
        purchaseOrderLineItemId
        asset {
          id
          name
          custom_name
          pim_product_name
        }
        purchaseOrderLineItem {
          ... on RentalPurchaseOrderLineItem {
            id
            po_quantity
            so_pim_category {
              name
            }
            so_pim_product {
              name
              model
            }
          }
          ... on SalePurchaseOrderLineItem {
            id
            po_quantity
            so_pim_category {
              name
            }
            so_pim_product {
              name
              model
            }
          }
        }
      }
    }
  }
`);

interface ReceiveInventoryDialogProps {
  open: boolean;
  onClose: () => void;
  lineItemId: string;
  purchaseOrderId: string;
  onSuccess: () => void;
}

export default function ReceiveInventoryDialog({
  open,
  onClose,
  lineItemId,
  purchaseOrderId,
  onSuccess,
}: ReceiveInventoryDialogProps) {
  const [quantityToReceive, setQuantityToReceive] = useState<number>(1);
  const [receivedAt, setReceivedAt] = useState<string>(new Date().toISOString().split("T")[0]);
  const [conditionOnReceipt, setConditionOnReceipt] = useState<InventoryCondition>(
    InventoryCondition.New,
  );
  const [conditionNotes, setConditionNotes] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [resourceMapIds, setResourceMapIds] = useState<string[]>([]);

  // Fetch inventory items for this purchase order
  const { data, loading, error } = useLineItemInventoryQuery({
    variables: {
      purchaseOrderId,
    },
    fetchPolicy: "network-only", // Always fetch fresh data
    skip: !open, // Don't fetch if dialog is closed
  });

  const [bulkMarkReceived, { loading: mutationLoading }] = useBulkMarkInventoryReceivedMutation({
    onCompleted: () => {
      onSuccess();
    },
    onError: (error) => {
      console.error("Error receiving items:", error);
    },
  });

  // Filter items for this specific line item that are still on order
  const allItems = data?.listInventory?.items ?? [];
  const items = allItems.filter((item: any) => item.purchaseOrderLineItemId === lineItemId);
  const maxQuantity = items.length;

  // Set quantity to max when items are loaded
  useEffect(() => {
    if (maxQuantity > 0 && open) {
      setQuantityToReceive(maxQuantity);
    }
  }, [maxQuantity, open]);

  // Get item description from the first item (they should all be the same for this line item)
  const itemDescription = items.length > 0 ? getItemDescription(items[0]) : "";
  const categoryName =
    items[0]?.pimCategoryName || items[0]?.purchaseOrderLineItem?.so_pim_category?.name || "";
  const productName = items[0]?.purchaseOrderLineItem?.so_pim_product?.name || "";
  const productModel = items[0]?.purchaseOrderLineItem?.so_pim_product?.model || "";

  const handleSubmit = async () => {
    if (quantityToReceive === 0 || quantityToReceive > maxQuantity) {
      return;
    }

    // Select the first N items to mark as received
    const itemsToReceive = items.slice(0, quantityToReceive).map((item: any) => item.id);

    await bulkMarkReceived({
      variables: {
        input: {
          ids: itemsToReceive,
          conditionOnReceipt,
          conditionNotes,
          receiptNotes,
          receivedAt: new Date(receivedAt).toISOString(),
          resourceMapId: resourceMapIds.length > 0 ? resourceMapIds[0] : undefined,
        },
      },
      refetchQueries: [
        "ReceiveInventoryEnhanced",
        "PurchaseOrderDetailsForReceiving",
        "LineItemInventory",
      ],
    });
  };

  const handleClose = () => {
    // Reset state when closing
    setConditionNotes("");
    setReceiptNotes("");
    setResourceMapIds([]);
    onClose();
  };

  const handleQuantityChange = (value: number) => {
    setQuantityToReceive(Math.min(Math.max(1, value), maxQuantity));
  };

  const incrementQuantity = () => {
    handleQuantityChange(quantityToReceive + 1);
  };

  const decrementQuantity = () => {
    handleQuantityChange(quantityToReceive - 1);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          overflow: "visible",
          position: "relative",
          zIndex: 1300,
        },
        "& .MuiBackdrop-root": {
          zIndex: 1299,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6">Receive Inventory</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Line Item ID: {lineItemId.slice(-8)}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ overflow: "visible" }}>
        {loading && <Typography>Loading inventory items...</Typography>}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error loading items: {error.message}
          </Alert>
        )}

        {!loading && !error && items.length === 0 && (
          <Alert severity="info">No items pending receipt for this line item.</Alert>
        )}

        {!loading && !error && items.length > 0 && (
          <Stack spacing={3}>
            {/* Item Information Section */}
            <Paper
              elevation={0}
              sx={{ p: 2, bgcolor: "primary.50", border: "1px solid", borderColor: "primary.200" }}
            >
              <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary.main">
                Item Information
              </Typography>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {categoryName || productName || "N/A"}
                  </Typography>
                  {productModel && (
                    <Typography variant="body2" color="text.secondary">
                      Model: {productModel}
                    </Typography>
                  )}
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box
                  sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Available to receive:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {maxQuantity} item{maxQuantity !== 1 ? "s" : ""}
                  </Typography>
                </Box>
                {maxQuantity > 1 && (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Quantity to receive:
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={decrementQuantity}
                          disabled={quantityToReceive <= 1}
                          sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                            p: 0.5,
                          }}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <TextField
                          type="number"
                          size="small"
                          value={quantityToReceive}
                          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                          InputProps={{
                            inputProps: {
                              min: 1,
                              max: maxQuantity,
                              style: { textAlign: "center" },
                            },
                          }}
                          sx={{
                            width: "70px",
                            "& .MuiInputBase-input": {
                              textAlign: "center",
                              padding: "4px 8px",
                            },
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={incrementQuantity}
                          disabled={quantityToReceive >= maxQuantity}
                          sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                            p: 0.5,
                          }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                )}
              </Stack>
            </Paper>

            {/* Receipt Details Section */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                Receipt Details
              </Typography>
              <Stack spacing={2.5}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    label="Received Date"
                    type="date"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={receivedAt}
                    onChange={(e) => setReceivedAt(e.target.value)}
                    required
                    sx={{ flex: 1 }}
                  />
                  <FormControl size="small" fullWidth sx={{ flex: 1 }}>
                    <InputLabel>Condition</InputLabel>
                    <Select
                      value={conditionOnReceipt}
                      onChange={(e) => setConditionOnReceipt(e.target.value as InventoryCondition)}
                      label="Condition"
                    >
                      <MenuItem value={InventoryCondition.New}>New</MenuItem>
                      <MenuItem value={InventoryCondition.Used}>Used</MenuItem>
                      <MenuItem value={InventoryCondition.Refurbished}>Refurbished</MenuItem>
                      <MenuItem value={InventoryCondition.Damaged}>Damaged</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {/* Location Selection */}
                <Box>
                  <Typography variant="body2" fontWeight={500} gutterBottom sx={{ mb: 1 }}>
                    Storage Location
                  </Typography>
                  <Box
                    sx={{
                      position: "relative",
                      "& .MuiAutocomplete-popper": {
                        zIndex: 1400,
                      },
                      "& .MuiPopper-root": {
                        zIndex: 1400,
                      },
                    }}
                  >
                    <ResourceMapSearchSelector
                      selectedIds={resourceMapIds}
                      onSelectionChange={(ids) => setResourceMapIds(ids.slice(0, 1))} // Only allow one selection
                      readonly={false}
                    />
                  </Box>
                </Box>
              </Stack>
            </Box>

            {/* Notes Section */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                Additional Notes
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Condition Notes"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="Describe any specific condition details..."
                  variant="outlined"
                />

                <TextField
                  label="General Receipt Notes"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="Add any general notes about this delivery..."
                  variant="outlined"
                />
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={mutationLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={items.length === 0 || mutationLoading}
          size="medium"
        >
          {mutationLoading
            ? "Processing..."
            : maxQuantity === 1
              ? "Receive Item"
              : `Receive ${quantityToReceive} Item${quantityToReceive !== 1 ? "s" : ""}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
