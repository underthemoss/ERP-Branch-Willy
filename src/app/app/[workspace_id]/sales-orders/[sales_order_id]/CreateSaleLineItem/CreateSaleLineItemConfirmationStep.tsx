"use client";

import { LineItemStatus } from "@/graphql/graphql";
import {
  useGetSalesOrderSaleLineItemByIdCreateDialogQuery,
  useUpdateSaleSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { Box, Button, Typography } from "@mui/material";
import React from "react";
import type { CreateSaleLineItemFooter } from "./CreateSaleLineItemDialog";

interface Props {
  lineItemId: string;
  Footer: CreateSaleLineItemFooter;
}

const CreateSaleLineItemConfirmationStep: React.FC<Props> = ({
  lineItemId,

  Footer,
}) => {
  const { data, loading } = useGetSalesOrderSaleLineItemByIdCreateDialogQuery({
    variables: { id: lineItemId },
    fetchPolicy: "cache-and-network",
  });
  const [updateLineItem, { loading: updateLoading }] =
    useUpdateSaleSalesOrderLineCreateDialogMutation();

  const lineItem =
    data?.getSalesOrderLineItemById &&
    data.getSalesOrderLineItemById.__typename === "SaleSalesOrderLineItem"
      ? data.getSalesOrderLineItemById
      : null;

  return (
    <Box>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Confirm Sale Line Item
        </Typography>
        {loading ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Loading line item details...
          </Typography>
        ) : !lineItem ? (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            Unable to load line item details.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Product
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lineItem.so_pim_product?.name || "N/A"}
              {lineItem.so_pim_product?.model ? ` — Model: ${lineItem.so_pim_product.model}` : ""}
              {lineItem.so_pim_product?.sku ? ` — SKU: ${lineItem.so_pim_product.sku}` : ""}
              {lineItem.so_pim_product?.manufacturer_part_number
                ? ` — MPN: ${lineItem.so_pim_product.manufacturer_part_number}`
                : ""}
              {lineItem.so_pim_product?.year ? ` — Year: ${lineItem.so_pim_product.year}` : ""}
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Category
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lineItem.so_pim_category?.name || "N/A"}
              {lineItem.so_pim_category?.description
                ? ` — ${lineItem.so_pim_category.description}`
                : ""}
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Quantity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lineItem.so_quantity ?? "N/A"}
            </Typography>

            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lineItem.lineitem_status || "N/A"}
            </Typography>
          </Box>
        )}
      </Box>
      <Footer
        nextEnabled={!!lineItem}
        loading={loading || updateLoading}
        onNextClick={async () => {
          // Update the line item status to CONFIRMED
          await updateLineItem({
            variables: {
              input: {
                id: lineItemId,
                lineitem_status: LineItemStatus.Confirmed,
              },
            },
          });
        }}
      />
    </Box>
  );
};

export default CreateSaleLineItemConfirmationStep;
