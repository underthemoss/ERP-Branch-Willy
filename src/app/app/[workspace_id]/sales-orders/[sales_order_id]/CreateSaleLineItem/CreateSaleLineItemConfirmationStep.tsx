"use client";

import { LineItemStatus } from "@/graphql/graphql";
import {
  useGetSalesOrderSaleLineItemByIdCreateDialogQuery,
  useUpdateSaleSalesOrderLineCreateDialogMutation,
} from "@/graphql/hooks";
import { Box, Divider, Typography } from "@mui/material";
import dayjs from "dayjs";
import React from "react";
import type { CreateSaleLineItemFooter } from "./CreateSaleLineItemDialog";

interface Props {
  lineItemId: string;
  Footer: CreateSaleLineItemFooter;
}

const CreateSaleLineItemConfirmationStep: React.FC<Props> = ({ lineItemId, Footer }) => {
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

  const formatCurrency = (cents: number | null | undefined) => {
    if (cents === null || cents === undefined) return "N/A";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return dayjs(dateString).format("MMM D, YYYY");
  };

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
            {/* Product Information */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Product Information
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Product:</strong> {lineItem.so_pim_product?.name || "N/A"}
                  {lineItem.so_pim_product?.model
                    ? ` — Model: ${lineItem.so_pim_product.model}`
                    : ""}
                  {lineItem.so_pim_product?.sku ? ` — SKU: ${lineItem.so_pim_product.sku}` : ""}
                  {lineItem.so_pim_product?.manufacturer_part_number
                    ? ` — MPN: ${lineItem.so_pim_product.manufacturer_part_number}`
                    : ""}
                  {lineItem.so_pim_product?.year ? ` — Year: ${lineItem.so_pim_product.year}` : ""}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Category:</strong> {lineItem.so_pim_category?.name || "N/A"}
                  {lineItem.so_pim_category?.description
                    ? ` — ${lineItem.so_pim_category.description}`
                    : ""}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Quantity:</strong> {lineItem.so_quantity ?? "N/A"}
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Pricing Information */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Pricing Information
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Unit Cost:</strong>{" "}
                  {formatCurrency(
                    lineItem.price?.__typename === "SalePrice"
                      ? lineItem.price.unitCostInCents
                      : null,
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Total Cost:</strong>{" "}
                  {formatCurrency(
                    lineItem.price?.__typename === "SalePrice" &&
                      lineItem.price.unitCostInCents &&
                      lineItem.so_quantity
                      ? lineItem.price.unitCostInCents * lineItem.so_quantity
                      : null,
                  )}
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Fulfillment Details */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Fulfillment Details
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Method:</strong> {lineItem.delivery_method || "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Location:</strong> {lineItem.delivery_location || "N/A"}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Delivery Date:</strong> {formatDate(lineItem.delivery_date)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Delivery Charge:</strong>{" "}
                  {formatCurrency(lineItem.delivery_charge_in_cents)}
                </Typography>
              </Box>
            </Box>

            {lineItem.deliveryNotes && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Delivery Notes
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: "pre-wrap" }}
                    >
                      {lineItem.deliveryNotes}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}

            <Divider />

            {/* Status */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Status
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {lineItem.lineitem_status || "DRAFT"}
                </Typography>
              </Box>
            </Box>
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
