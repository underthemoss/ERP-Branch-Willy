"use client";

import {
  useGetSalesOrderSaleLineItemByIdCreateDialogQuery,
  useUpdateSaleSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { PimCategoriesTreeView } from "@/ui/pim/PimCategoriesTreeView";
import { Box, TextField, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { CreateSaleLineItemFooter } from "./CreateSaleLineItemDialog";

interface Props {
  lineItemId: string;
  Footer: CreateSaleLineItemFooter;
}

const CreateSaleLineItemProductSelectionStep: React.FC<Props> = ({ lineItemId, Footer }) => {
  const [quantity, setQuantity] = useState<string>("1");
  const [quantityError, setQuantityError] = useState<string>("");

  const { data, refetch } = useGetSalesOrderSaleLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });
  const [updateItem, { loading: updateLoading }] =
    useUpdateSaleSalesOrderLineCreateDialogMutation();

  const item =
    data?.getSalesOrderLineItemById?.__typename === "SaleSalesOrderLineItem"
      ? data.getSalesOrderLineItemById
      : null;

  // Initialize quantity from fetched data
  useEffect(() => {
    if (item?.so_quantity) {
      setQuantity(item.so_quantity.toString());
    }
  }, [item?.so_quantity]);

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
            so_quantity: numQuantity,
          },
        },
      });
    }
  };

  const isValid =
    Boolean(item.so_pim_id) && !quantityError && quantity && parseInt(quantity, 10) > 0;

  return (
    <Box>
      <Box p={3}>
        <Typography variant="h6" gutterBottom>
          Select Product & Quantity
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {item.so_pim_id && existingProduct
            ? `Currently selected: ${existingProduct.name || existingCategory?.name || "Unknown"}`
            : "Select a product to add to this sales order."}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <PimCategoriesTreeView
            selectedItemId={item.so_pim_id || undefined}
            onItemSelected={async (val) => {
              await updateItem({
                variables: {
                  input: {
                    id: lineItemId,
                    so_pim_id: val.id,
                  },
                },
              });
              await refetch();
            }}
          />
        </Box>

        {item.so_pim_id && (
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

export default CreateSaleLineItemProductSelectionStep;
