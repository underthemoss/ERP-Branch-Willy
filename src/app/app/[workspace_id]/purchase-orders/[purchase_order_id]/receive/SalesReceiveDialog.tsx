"use client";

import { graphql } from "@/graphql";
import { InventoryCondition, InventoryStatus } from "@/graphql/graphql";
import {
  useBulkMarkSalesInventoryReceivedMutation,
  useSalesLineItemInventoryQuery,
} from "@/graphql/hooks";
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

// Query to fetch sales inventory for a specific line item
graphql(`
  query SalesLineItemInventory($purchaseOrderId: String!) {
    listInventory(query: { filter: { purchaseOrderId: $purchaseOrderId }, page: { size: 1000 } }) {
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
          ... on SalePurchaseOrderLineItem {
            id
            po_quantity
            lineitem_type
            delivery_date
            so_pim_category {
              name
            }
            so_pim_product {
              name
              model
            }
          }
          ... on RentalPurchaseOrderLineItem {
            id
            po_quantity
            lineitem_type
            delivery_date
            off_rent_date
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

// Mutation to bulk mark sales inventory as received
graphql(`
  mutation BulkMarkSalesInventoryReceived($input: BulkMarkInventoryReceivedInput!) {
    bulkMarkInventoryReceived(input: $input) {
      items {
        id
        status
        conditionOnReceipt
        conditionNotes
        receiptNotes
        receivedAt
        pimCategoryId
        pimCategoryName
        pimCategoryPath
        pimProductId
        assetId
      }
      totalProcessed
    }
  }
`);

interface SalesReceiveDialogProps {
  open: boolean;
  onClose: () => void;
  lineItemId: string;
  purchaseOrderId: string;
  onSuccess: () => void;
}

export default function SalesReceiveDialog({
  open,
  onClose,
  lineItemId,
  purchaseOrderId,
  onSuccess,
}: SalesReceiveDialogProps) {
  const [quantityToReceive, setQuantityToReceive] = useState<number>(1);
  const [receivedAt, setReceivedAt] = useState<string>("");
  const [conditionOnReceipt, setConditionOnReceipt] = useState<InventoryCondition>(
    InventoryCondition.New,
  );
  const [conditionNotes, setConditionNotes] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [resourceMapIds, setResourceMapIds] = useState<string[]>([]);

  // Fetch inventory items for this purchase order
  const { data, loading, error } = useSalesLineItemInventoryQuery({
    variables: {
      purchaseOrderId,
    },
    fetchPolicy: "network-only",
    skip: !open,
  });

  const [bulkMarkReceived, { loading: mutationLoading }] =
    useBulkMarkSalesInventoryReceivedMutation({
      onCompleted: () => {
        onSuccess();
      },
      onError: (error: any) => {
        console.error("Error receiving sales items:", error);
      },
    });

  // Filter items for this specific line item
  const allItems = data?.listInventory?.items ?? [];
  const lineItemItems = allItems.filter((item: any) => item.purchaseOrderLineItemId === lineItemId);

  // Calculate quantities
  const onOrderItems = lineItemItems.filter((item: any) => item.status === InventoryStatus.OnOrder);
  const receivedItems = lineItemItems.filter(
    (item: any) => item.status === InventoryStatus.Received,
  );
  const salesLineItem = lineItemItems[0]?.purchaseOrderLineItem;
  const totalOrdered =
    (salesLineItem && "po_quantity" in salesLineItem ? salesLineItem.po_quantity : null) ||
    lineItemItems.length;
  const alreadyReceived = receivedItems.length;
  const remainingToReceive = onOrderItems.length;
  const maxQuantity = remainingToReceive;

  // Set quantity to max when items are loaded
  useEffect(() => {
    if (maxQuantity > 0 && open) {
      setQuantityToReceive(maxQuantity);
    }
  }, [maxQuantity, open]);

  // Set default received date to delivery date from line item
  useEffect(() => {
    if (salesLineItem && open && !receivedAt) {
      // Use delivery_date if available, otherwise fallback to today
      const deliveryDate =
        salesLineItem && "delivery_date" in salesLineItem ? salesLineItem.delivery_date : null;

      if (deliveryDate && typeof deliveryDate === "string") {
        // Convert date to YYYY-MM-DD format for date input
        const date = new Date(deliveryDate);
        if (!isNaN(date.getTime())) {
          setReceivedAt(date.toISOString().split("T")[0]);
        } else {
          // Fallback to today if date is invalid
          setReceivedAt(new Date().toISOString().split("T")[0]);
        }
      } else {
        // Fallback to today if no date available
        setReceivedAt(new Date().toISOString().split("T")[0]);
      }
    }
  }, [salesLineItem, open, receivedAt]);

  // Get item description from the first item (they should all be the same for this line item)
  const itemDescription = lineItemItems.length > 0 ? getItemDescription(lineItemItems[0]) : "";
  const categoryName =
    lineItemItems[0]?.pimCategoryName ||
    (salesLineItem && "so_pim_category" in salesLineItem
      ? salesLineItem.so_pim_category?.name
      : "") ||
    "";
  const productName =
    (salesLineItem && "so_pim_product" in salesLineItem
      ? salesLineItem.so_pim_product?.name
      : "") || "";
  const productModel =
    (salesLineItem && "so_pim_product" in salesLineItem
      ? salesLineItem.so_pim_product?.model
      : "") || "";

  const handleSubmit = async () => {
    if (quantityToReceive === 0 || quantityToReceive > maxQuantity) {
      return;
    }

    // Select the first N items to mark as received
    const itemsToReceive = onOrderItems.slice(0, quantityToReceive).map((item: any) => item.id);

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
        <Typography variant="h6">Receive Sales Items</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Line Item ID: {lineItemId.slice(-8)}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ overflow: "visible" }}>
        {loading && <Typography>Loading sales items...</Typography>}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error loading items: {error.message}
          </Alert>
        )}

        {!loading && !error && lineItemItems.length === 0 && (
          <Alert severity="info">No sales items found for this line item.</Alert>
        )}

        {!loading && !error && lineItemItems.length > 0 && (
          <Stack spacing={3}>
            {/* Item Information Section */}
            <Paper
              elevation={0}
              sx={{ p: 2, bgcolor: "primary.50", border: "1px solid", borderColor: "primary.200" }}
            >
              <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary.main">
                Sales Item Information
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
                    Total ordered:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {totalOrdered} item{totalOrdered !== 1 ? "s" : ""}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Already received:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="primary.main">
                    {alreadyReceived} item{alreadyReceived !== 1 ? "s" : ""}
                  </Typography>
                </Box>
                <Box
                  sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Remaining to receive:
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="warning.main">
                    {remainingToReceive} item{remainingToReceive !== 1 ? "s" : ""}
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
                      onSelectionChange={(ids) => setResourceMapIds(ids.slice(0, 1))}
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
                  placeholder="Add any general notes about this sales delivery..."
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
          disabled={maxQuantity === 0 || mutationLoading}
          size="medium"
          color="primary"
        >
          {mutationLoading
            ? "Processing..."
            : maxQuantity === 1
              ? "Receive Sales Item"
              : `Receive ${quantityToReceive} Sales Item${quantityToReceive !== 1 ? "s" : ""}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
