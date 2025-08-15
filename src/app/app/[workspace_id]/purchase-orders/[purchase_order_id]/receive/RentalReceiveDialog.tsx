"use client";

import { graphql } from "@/graphql";
import { InventoryCondition, InventoryStatus } from "@/graphql/graphql";
import {
  useBulkMarkRentalInventoryReceivedMutation,
  useRentalLineItemInventoryQuery,
  useUpdateInventoryExpectedReturnDateMutation,
} from "@/graphql/hooks";
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

// Query to fetch rental inventory for a specific line item
graphql(`
  query RentalLineItemInventory($purchaseOrderId: String!) {
    listInventory(
      query: {
        filter: { purchaseOrderId: $purchaseOrderId, status: ON_ORDER }
        page: { size: 1000 }
      }
    ) {
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
            lineitem_type
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

// Mutation to bulk mark rental inventory as received
graphql(`
  mutation BulkMarkRentalInventoryReceived($input: BulkMarkInventoryReceivedInput!) {
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
        expectedReturnDate
      }
      totalProcessed
    }
  }
`);

// Mutation to update expected return date for inventory
graphql(`
  mutation UpdateInventoryExpectedReturnDate($id: String!, $expectedReturnDate: DateTime!) {
    updateInventoryExpectedReturnDate(id: $id, expectedReturnDate: $expectedReturnDate) {
      id
      expectedReturnDate
    }
  }
`);

interface RentalReceiveDialogProps {
  open: boolean;
  onClose: () => void;
  lineItemId: string;
  purchaseOrderId: string;
  onSuccess: () => void;
}

export default function RentalReceiveDialog({
  open,
  onClose,
  lineItemId,
  purchaseOrderId,
  onSuccess,
}: RentalReceiveDialogProps) {
  const [quantityToReceive, setQuantityToReceive] = useState<number>(1);
  const [receivedAt, setReceivedAt] = useState<string>(new Date().toISOString().split("T")[0]);
  const [conditionOnReceipt, setConditionOnReceipt] = useState<InventoryCondition>(
    InventoryCondition.New,
  );
  const [conditionNotes, setConditionNotes] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>("");

  // Fetch inventory items for this purchase order
  const { data, loading, error } = useRentalLineItemInventoryQuery({
    variables: {
      purchaseOrderId,
    },
    fetchPolicy: "network-only",
    skip: !open,
  });

  const [bulkMarkReceived, { loading: mutationLoading }] =
    useBulkMarkRentalInventoryReceivedMutation({
      onError: (error: any) => {
        console.error("Error receiving rental items:", error);
      },
    });

  const [updateExpectedReturnDate] = useUpdateInventoryExpectedReturnDateMutation();

  // Filter items for this specific line item that are still on order
  const allItems = data?.listInventory?.items ?? [];
  const items = allItems.filter((item: any) => item.purchaseOrderLineItemId === lineItemId);
  const maxQuantity = items.length;

  // Get item description from the first item (they should all be the same for this line item)
  const itemDescription = items.length > 0 ? getItemDescription(items[0]) : "";
  const rentalLineItem = items[0]?.purchaseOrderLineItem;
  const categoryName =
    items[0]?.pimCategoryName ||
    (rentalLineItem && "so_pim_category" in rentalLineItem
      ? rentalLineItem.so_pim_category?.name
      : "") ||
    "";
  const productName =
    (rentalLineItem && "so_pim_product" in rentalLineItem
      ? rentalLineItem.so_pim_product?.name
      : "") || "";
  const productModel =
    (rentalLineItem && "so_pim_product" in rentalLineItem
      ? rentalLineItem.so_pim_product?.model
      : "") || "";

  // Get rental-specific information
  const offRentDate =
    rentalLineItem && "off_rent_date" in rentalLineItem ? rentalLineItem.off_rent_date : null;

  // Set quantity to max when items are loaded
  useEffect(() => {
    if (maxQuantity > 0 && open) {
      setQuantityToReceive(maxQuantity);
    }
  }, [maxQuantity, open]);

  // Set default expected return date to off_rent_date from line item
  useEffect(() => {
    if (offRentDate && open && !expectedReturnDate) {
      // Convert off_rent_date to YYYY-MM-DD format for date input
      const date = new Date(String(offRentDate));
      if (!isNaN(date.getTime())) {
        setExpectedReturnDate(date.toISOString().split("T")[0]);
      }
    }
  }, [offRentDate, open, expectedReturnDate]);

  const handleSubmit = async () => {
    if (quantityToReceive === 0 || quantityToReceive > maxQuantity) {
      return;
    }

    // Select the first N items to mark as received
    const itemsToReceive = items.slice(0, quantityToReceive).map((item: any) => item.id);

    try {
      // First, mark items as received
      const result = await bulkMarkReceived({
        variables: {
          input: {
            ids: itemsToReceive,
            conditionOnReceipt,
            conditionNotes,
            receiptNotes,
            receivedAt: new Date(receivedAt).toISOString(),
          },
        },
        refetchQueries: [
          "ReceiveInventoryEnhanced",
          "PurchaseOrderDetailsForReceiving",
          "LineItemInventory",
        ],
      });

      // If an expected return date was provided, update it for all received items
      if (expectedReturnDate && result.data?.bulkMarkInventoryReceived?.items) {
        const receivedItems = result.data.bulkMarkInventoryReceived.items;
        const updatePromises = receivedItems.map((item) =>
          updateExpectedReturnDate({
            variables: {
              id: item.id,
              expectedReturnDate: new Date(expectedReturnDate).toISOString(),
            },
          }),
        );

        await Promise.all(updatePromises);
      }

      // Call success callback after all operations complete
      onSuccess();
    } catch (error) {
      console.error("Error in receive process:", error);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setConditionNotes("");
    setReceiptNotes("");
    setExpectedReturnDate("");
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
        <Typography variant="h6">Receive Rental Items</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Line Item ID: {lineItemId.slice(-8)}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ overflow: "visible" }}>
        {loading && <Typography>Loading rental items...</Typography>}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error loading items: {error.message}
          </Alert>
        )}

        {!loading && !error && items.length === 0 && (
          <Alert severity="info">No rental items pending receipt for this line item.</Alert>
        )}

        {!loading && !error && items.length > 0 && (
          <Stack spacing={3}>
            {/* Item Information Section */}
            <Paper
              elevation={0}
              sx={{ p: 2, bgcolor: "primary.50", border: "1px solid", borderColor: "primary.200" }}
            >
              <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary.main">
                Rental Equipment Information
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

                {/* Expected Return Date for Rentals */}
                <TextField
                  label="Expected Return Date"
                  type="date"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  helperText="When do you expect this rental equipment to be returned?"
                />
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
                  placeholder="Add any general notes about this rental delivery..."
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
          color="primary"
        >
          {mutationLoading
            ? "Processing..."
            : maxQuantity === 1
              ? "Receive Rental Item"
              : `Receive ${quantityToReceive} Rental Item${quantityToReceive !== 1 ? "s" : ""}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
