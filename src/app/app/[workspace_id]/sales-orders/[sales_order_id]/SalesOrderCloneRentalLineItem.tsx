"use client";

import { graphql } from "@/graphql";
import {
  useCreateRentalSalesOrderLineItemMutation,
  useGetRentalLineItemForCloneQuery,
} from "@/graphql/hooks";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import * as React from "react";

// GraphQL query to get rental line item details for cloning
graphql(`
  query GetRentalLineItemForClone($lineItemId: String!) {
    getSalesOrderLineItemById(id: $lineItemId) {
      ... on RentalSalesOrderLineItem {
        id
        sales_order_id
        so_pim_id
        so_quantity
        price_id
        delivery_location
        delivery_date
        delivery_method
        delivery_charge_in_cents
        off_rent_date
        lineitem_status
        deliveryNotes
        so_pim_product {
          name
          model
        }
        so_pim_category {
          name
        }
      }
    }
  }
`);

// GraphQL mutation to create a new rental line item
graphql(`
  mutation CreateRentalSalesOrderLineItem($input: CreateRentalSalesOrderLineItemInput!) {
    createRentalSalesOrderLineItem(input: $input) {
      id
    }
  }
`);

interface SalesOrderCloneRentalLineItemProps {
  open: boolean;
  onClose: () => void;
  lineItemId: string;
  onSuccess?: () => void;
}

export const SalesOrderCloneRentalLineItem: React.FC<SalesOrderCloneRentalLineItemProps> = ({
  open,
  onClose,
  lineItemId,
  onSuccess,
}) => {
  const [isCloning, setIsCloning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [duplicateCount, setDuplicateCount] = React.useState(1);

  // Fetch the line item details
  const {
    data,
    loading,
    error: queryError,
  } = useGetRentalLineItemForCloneQuery({
    variables: { lineItemId },
    skip: !open,
    fetchPolicy: "cache-and-network",
  });

  // Mutation to create new line item
  const [createRentalLineItem] = useCreateRentalSalesOrderLineItemMutation();

  const lineItem = data?.getSalesOrderLineItemById;
  const isRentalItem = lineItem?.__typename === "RentalSalesOrderLineItem";

  const handleConfirm = async () => {
    if (!isRentalItem || !lineItem) return;

    // Validate duplicate count
    if (duplicateCount < 1 || duplicateCount > 100) {
      setError("Please enter a number between 1 and 100");
      return;
    }

    setIsCloning(true);
    setError(null);

    try {
      // Create the input object for duplication
      const input = {
        sales_order_id: lineItem.sales_order_id,
        so_pim_id: lineItem.so_pim_id,
        so_quantity: lineItem.so_quantity,
        price_id: lineItem.price_id,
        delivery_location: lineItem.delivery_location,
        delivery_date: lineItem.delivery_date,
        delivery_method: lineItem.delivery_method,
        delivery_charge_in_cents: lineItem.delivery_charge_in_cents,
        off_rent_date: lineItem.off_rent_date,
        lineitem_status: lineItem.lineitem_status,
        deliveryNotes: lineItem.deliveryNotes,
      };

      // Create multiple line items based on duplicateCount
      const promises = [];
      for (let i = 0; i < duplicateCount; i++) {
        promises.push(
          createRentalLineItem({
            variables: { input },
          }),
        );
      }

      // Execute all mutations
      await Promise.all(promises);

      // Success - close dialog and trigger refresh
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error cloning rental line items:", err);
      setError(err instanceof Error ? err.message : "Failed to duplicate rental line items");
    } finally {
      setIsCloning(false);
    }
  };

  const getItemDescription = () => {
    if (!isRentalItem || !lineItem) return "";

    const productName =
      lineItem.so_pim_product?.name || lineItem.so_pim_category?.name || "Unknown Item";
    const model = lineItem.so_pim_product?.model;
    const quantity = lineItem.so_quantity || 1;

    return `${productName}${model ? ` (${model})` : ""} - Quantity: ${quantity}`;
  };

  // Reset duplicate count when dialog opens
  React.useEffect(() => {
    if (open) {
      setDuplicateCount(1);
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Duplicate Rental Line Item</DialogTitle>
      <DialogContent>
        {loading && <CircularProgress size={24} sx={{ display: "block", margin: "20px auto" }} />}

        {queryError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load line item details: {queryError.message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !queryError && isRentalItem && (
          <>
            <DialogContentText>
              How many times would you like to duplicate this rental line item?
              <br />
              <br />
              <strong>{getItemDescription()}</strong>
            </DialogContentText>

            <Box sx={{ mt: 3, mb: 2 }}>
              <TextField
                label="Number of Duplicates"
                type="number"
                value={duplicateCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value)) {
                    setDuplicateCount(value);
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        onClick={() => setDuplicateCount(Math.max(1, duplicateCount - 1))}
                        disabled={isCloning || duplicateCount <= 1}
                        edge="start"
                        size="small"
                      >
                        <RemoveIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setDuplicateCount(Math.min(100, duplicateCount + 1))}
                        disabled={isCloning || duplicateCount >= 100}
                        edge="end"
                        size="small"
                      >
                        <AddIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                inputProps={{
                  min: 1,
                  max: 100,
                  step: 1,
                  style: { textAlign: "center" },
                }}
                sx={{ width: 200 }}
                helperText="Enter a number between 1 and 100"
                error={duplicateCount < 1 || duplicateCount > 100}
                disabled={isCloning}
              />
            </Box>

            <DialogContentText variant="body2" color="text.secondary">
              This will create {duplicateCount} new line item{duplicateCount > 1 ? "s" : ""} with
              the same details including pricing, delivery information, and rental dates.
            </DialogContentText>
          </>
        )}

        {!loading && !queryError && !isRentalItem && lineItem && (
          <Alert severity="warning">This action is only available for rental line items.</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isCloning}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={
            loading ||
            isCloning ||
            !isRentalItem ||
            !!queryError ||
            duplicateCount < 1 ||
            duplicateCount > 100
          }
        >
          {isCloning
            ? `Duplicating ${duplicateCount} item${duplicateCount > 1 ? "s" : ""}...`
            : `Duplicate ${duplicateCount} item${duplicateCount > 1 ? "s" : ""}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalesOrderCloneRentalLineItem;
