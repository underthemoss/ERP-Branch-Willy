"use client";

import {
  useGetPurchaseOrderSaleLineItemByIdCreateDialogQuery,
  useUpdateSalePurchaseOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { PimCategoriesTreeView } from "@/ui/pim/PimCategoriesTreeView";
import { Box, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { CreateSalePurchaseOrderLineItemFooter } from "./CreateSalePurchaseOrderLineItemDialog";

interface Props {
  lineItemId: string;
  Footer: CreateSalePurchaseOrderLineItemFooter;
}

const CreateSalePurchaseOrderLineItemProductSelectionStep: React.FC<Props> = ({
  lineItemId,
  Footer,
}) => {
  const [quantity, setQuantity] = useState<string>("1");
  const [quantityError, setQuantityError] = useState<string>("");

  const { data, refetch } = useGetPurchaseOrderSaleLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });
  const [updateItem, { loading: updateLoading }] =
    useUpdateSalePurchaseOrderLineCreateDialogMutation();

  const item =
    data?.getPurchaseOrderLineItemById?.__typename === "SalePurchaseOrderLineItem"
      ? data.getPurchaseOrderLineItemById
      : null;

  // Initialize quantity from fetched data
  useEffect(() => {
    if (item?.po_quantity) {
      setQuantity(item.po_quantity.toString());
    }
  }, [item?.po_quantity]);

  if (!item) {
    return null;
  }

  // Get the existing product info for display
  const existingProduct = item.so_pim_product;
  const existingCategory = item.so_pim_category;

  const handleQuantityChange = (value: string) => {
    setQuantity(value);

    // Validate quantity
    const numValue = parseInt(value, 10);
    if (!value || isNaN(numValue) || numValue < 1) {
      setQuantityError("Quantity must be at least 1");
    } else if (numValue > 999999) {
      setQuantityError("Quantity is too large");
    } else {
      setQuantityError("");
    }
  };

  const handleSaveQuantity = async () => {
    const numQuantity = parseInt(quantity, 10);
    if (!quantityError && numQuantity > 0) {
      await updateItem({
        variables: {
          input: {
            id: lineItemId,
            po_quantity: numQuantity,
          },
        },
      });
    }
  };

  const isValid: boolean =
    Boolean(item.po_pim_id) && !quantityError && Boolean(quantity) && parseInt(quantity, 10) > 0;

  return (
    <Box>
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          Select Product & Quantity
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {item.lineitem_status === "CONFIRMED"
            ? "This product selection cannot be changed after the line item has been added to the purchase order. Please create a new line item if you need a different product."
            : item.po_pim_id && existingProduct
              ? `Currently selected: ${existingProduct.name || existingCategory?.name || "Unknown"}`
              : "Select a product to add to this purchase order."}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <PimCategoriesTreeView
            selectedItemId={item.po_pim_id || undefined}
            disabled={item.lineitem_status === "CONFIRMED"}
            onItemSelected={async (val) => {
              await updateItem({
                variables: {
                  input: {
                    id: lineItemId,
                    po_pim_id: val.id,
                  },
                },
              });
              await refetch();
            }}
          />
        </Box>

        {item.po_pim_id && (
          <Box sx={{ mt: 3 }}>
            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              onBlur={handleSaveQuantity}
              error={!!quantityError}
              helperText={quantityError || " "}
              fullWidth
              inputProps={{
                min: 1,
                step: 1,
              }}
              sx={{ maxWidth: 200 }}
            />
          </Box>
        )}
      </Box>
      <Footer nextEnabled={isValid} loading={updateLoading} onNextClick={handleSaveQuantity} />
    </Box>
  );
};

export default CreateSalePurchaseOrderLineItemProductSelectionStep;
