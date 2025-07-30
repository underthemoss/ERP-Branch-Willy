"use client";

import { graphql } from "@/graphql";
import { PurchaseOrderLineItemsQuery, PurchaseOrderStatus } from "@/graphql/graphql";
import { usePurchaseOrderLineItemsQuery } from "@/graphql/hooks";
import { parseDate } from "@/lib/parseDate";
import EmptyStateListViewIcon from "@/ui/icons/EmptyStateListViewIcon";
import ErrorStateListViewIcon from "@/ui/icons/ErrorStateListViewIcon";
import DateRangeIcon from "@mui/icons-material/DateRange";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { DataGridPremium, GridColDef, Toolbar } from "@mui/x-data-grid-premium";
import * as React from "react";

// --- GQL Query (for codegen) ---
graphql(`
  query PurchaseOrderLineItems($purchaseOrderId: String!) {
    getPurchaseOrderById(id: $purchaseOrderId) {
      pricing {
        sub_total_in_cents
        total_in_cents
      }
      line_items {
        ... on RentalPurchaseOrderLineItem {
          id
          po_pim_id
          po_quantity
          so_pim_product {
            name
            model
            sku
            manufacturer_part_number
            year
          }
          so_pim_category {
            id
            name
            description
          }
          created_by_user {
            firstName
            lastName
          }
          updated_by_user {
            firstName
            lastName
          }
          price {
            ... on RentalPrice {
              priceBook {
                name
                id
              }
            }
          }
          calulate_price {
            strategy
            rentalPeriod {
              days28
              days7
              days1
            }
            details {
              optimalSplit {
                days28
                days7
                days1
              }
              plainText
              rates {
                pricePer28DaysInCents
                pricePer7DaysInCents
                pricePer1DayInCents
              }
            }
            total_including_delivery_in_cents
          }
          price_id
          price {
            ... on RentalPrice {
              pricePerDayInCents
              pricePerWeekInCents
              pricePerMonthInCents
            }
          }
          delivery_location
          delivery_date
          delivery_method
          delivery_charge_in_cents
          off_rent_date
          created_at
          updated_at
          lineitem_status
          totalDaysOnRent
        }
        ... on SalePurchaseOrderLineItem {
          id
          po_pim_id
          po_quantity
          so_pim_product {
            name
            model
            sku
            manufacturer_part_number
            year
          }
          so_pim_category {
            id
            name
            description
          }
          price {
            ... on SalePrice {
              unitCostInCents
              priceBook {
                name
                id
              }
            }
          }
          delivery_location
          delivery_date
          delivery_method
          delivery_charge_in_cents
          deliveryNotes
          created_at
          updated_at
          lineitem_status
        }
      }
    }
  }
`);

export interface PurchaseOrderLineItemsDataGridProps {
  purchaseOrderId: string;
  purchaseOrderStatus: PurchaseOrderStatus;
  onAddNewItem?: () => void;
  onEditItem?: (
    lineItemId: string,
    lineItemType: "RentalPurchaseOrderLineItem" | "SalePurchaseOrderLineItem",
  ) => void;
}

type RowType = NonNullable<
  NonNullable<
    NonNullable<PurchaseOrderLineItemsQuery["getPurchaseOrderById"]>["line_items"]
  >[number]
>;

export const PurchaseOrderLineItemsDataGrid: React.FC<PurchaseOrderLineItemsDataGridProps> = ({
  purchaseOrderId,
  purchaseOrderStatus,
  onAddNewItem,
  onEditItem,
}) => {
  const { data, loading, error, refetch } = usePurchaseOrderLineItemsQuery({
    variables: { purchaseOrderId },
    fetchPolicy: "cache-and-network",
  });

  const handleAddNewItem = async () => {
    if (onAddNewItem) {
      await onAddNewItem();
      await refetch();
    }
  };

  const lineItems = data?.getPurchaseOrderById?.line_items || [];

  const columns: GridColDef[] = [
    // Line item type icon column (first)
    {
      field: "line_item_type",
      headerName: "",
      width: 50,
      sortable: false,
      filterable: false,
      align: "center",
      renderCell: (params) => {
        if (params.row.__typename === "RentalPurchaseOrderLineItem") {
          return (
            <Tooltip title="Rental" arrow>
              <span>
                <DateRangeIcon color="primary" fontSize="small" />
              </span>
            </Tooltip>
          );
        }
        if (params.row.__typename === "SalePurchaseOrderLineItem") {
          return (
            <Tooltip title="Sale" arrow>
              <span>
                <ShoppingCartIcon color="secondary" fontSize="small" />
              </span>
            </Tooltip>
          );
        }
        return null;
      },
    },
    // Core identifiers and product/category info
    {
      field: "id",
      headerName: "ID",
      minWidth: 120,
      flex: 1,
    },
    {
      field: "po_pim_id",
      headerName: "PIM ID",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row: RowType) => row.po_pim_id ?? "-",
    },
    {
      field: "so_pim_product.name",
      headerName: "Product Name",
      minWidth: 180,
      flex: 1,
      valueGetter: (_, row: RowType) => {
        // Try product name first
        if (row.so_pim_product?.name) {
          return row.so_pim_product.name;
        }
        // Fall back to category name
        if (row.so_pim_category?.name) {
          return row.so_pim_category.name;
        }
        // Fall back to model if available
        if (row.so_pim_product?.model) {
          return `Model: ${row.so_pim_product.model}`;
        }
        // Try SKU
        if (row.so_pim_product?.sku) {
          return `SKU: ${row.so_pim_product.sku}`;
        }
        return "-";
      },
    },
    {
      field: "so_pim_product.model",
      headerName: "Model",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row: RowType) => row.so_pim_product?.model ?? "-",
    },
    {
      field: "so_pim_product.sku",
      headerName: "SKU",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row: RowType) => row.so_pim_product?.sku ?? "-",
    },
    {
      field: "po_quantity",
      headerName: "Quantity",
      type: "number",
      minWidth: 100,
      flex: 0.5,
    },
    {
      field: "lineitem_status",
      headerName: "Line Item Status",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) => row.lineitem_status ?? "-",
    },
    {
      field: "delivery_method",
      headerName: "Delivery Method",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row) => row.delivery_method ?? "-",
    },
    {
      field: "delivery_location",
      headerName: "Delivery Location",
      minWidth: 160,
      flex: 1,
      valueGetter: (_, row) => row.delivery_location ?? "-",
    },
    {
      field: "delivery_charge_in_cents",
      headerName: "Delivery Charge",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row) =>
        typeof row.delivery_charge_in_cents === "number"
          ? `$${(row.delivery_charge_in_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "-",
    },
    {
      field: "delivery_date",
      headerName: "Delivery Date",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) =>
        row.delivery_date ? (parseDate(row.delivery_date)?.toLocaleDateString() ?? "-") : "-",
    },
    {
      field: "line_item_total_incl_delivery",
      headerName: "Line Item Price (Incl. Delivery)",
      minWidth: 180,
      flex: 1,
      valueGetter: (_, row: RowType) => {
        // Rental: use calulate_price.total_including_delivery_in_cents if present
        if (
          row.__typename === "RentalPurchaseOrderLineItem" &&
          row.calulate_price &&
          typeof row.calulate_price.total_including_delivery_in_cents === "number"
        ) {
          return `$${(row.calulate_price.total_including_delivery_in_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        // Sale: use unit_cost_in_cents if present
        if (row.__typename === "SalePurchaseOrderLineItem") {
          const quantity = row.po_quantity || 1;
          const priceBookUnitPrice =
            row.price?.__typename === "SalePrice" ? row.price.unitCostInCents : null;
          if (!priceBookUnitPrice) return "-";
          const subtotal = priceBookUnitPrice * quantity;
          const deliveryCharge = row.delivery_charge_in_cents || 0;
          const totalIncludingDelivery = subtotal + deliveryCharge;
          return `$${(totalIncludingDelivery / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return "-";
      },
    },
    {
      field: "created_at",
      headerName: "Created At",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) =>
        row.created_at ? (parseDate(row.created_at)?.toLocaleString() ?? "-") : "-",
    },
    {
      field: "updated_at",
      headerName: "Updated At",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) =>
        row.updated_at ? (parseDate(row.updated_at)?.toLocaleString() ?? "-") : "-",
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Order Items
      </Typography>
      <Box sx={{ width: "100%", mb: 2 }}>
        {error ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 6,
              minHeight: 320,
              textAlign: "center",
              background: "background.paper",
              borderRadius: 2,
            }}
          >
            <ErrorStateListViewIcon sx={{ width: 104, height: 101, mb: 3 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Error loading order items
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
              Something went wrong. Please try again.
            </Typography>

            <Button
              variant="outlined"
              size="small"
              onClick={() => refetch()}
              sx={{ minWidth: 160 }}
            >
              Retry
            </Button>
          </Box>
        ) : lineItems.length === 0 && !loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 6,
              minHeight: 320,
              textAlign: "center",
              background: "background.paper",
              borderRadius: 2,
            }}
          >
            <EmptyStateListViewIcon style={{ width: 104, height: 101, marginBottom: 24 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Items in the order will show here
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
              Manage each line item&apos;s transaction type, details, and fulfillment requirements
              here.
            </Typography>
            <Button
              variant="contained"
              size="medium"
              onClick={onAddNewItem}
              sx={{ minWidth: 160 }}
              disabled={purchaseOrderStatus === PurchaseOrderStatus.Submitted}
            >
              Add New Item
            </Button>
          </Box>
        ) : (
          <>
            <DataGridPremium
              rows={lineItems}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              autoHeight
              getRowId={(row) => row.id}
              sx={{ backgroundColor: "background.paper" }}
              initialState={{
                columns: {
                  columnVisibilityModel: {
                    // Show only these columns by default
                    "so_pim_product.name": true,
                    po_quantity: true,
                    line_item_total_incl_delivery: true,
                    lineitem_status: true,
                    delivery_method: true,
                    delivery_date: true,
                    // All others hidden by default
                    id: false,
                    po_pim_id: false,
                    "so_pim_product.model": false,
                    "so_pim_product.sku": false,
                    delivery_location: false,
                    delivery_charge_in_cents: false,
                    created_at: false,
                    updated_at: false,
                  },
                },
              }}
              slots={{
                toolbar: Toolbar,
                footer: () => {
                  // Calculate subtotal including delivery charges
                  let totalIncludingDelivery = 0;

                  lineItems.forEach((item) => {
                    if (!item) return;

                    if (item.__typename === "RentalPurchaseOrderLineItem") {
                      if (item.calulate_price?.total_including_delivery_in_cents) {
                        totalIncludingDelivery +=
                          item.calulate_price.total_including_delivery_in_cents;
                      }
                    } else if (item.__typename === "SalePurchaseOrderLineItem") {
                      const quantity = item.po_quantity || 1;
                      const priceBookUnitPrice =
                        item.price?.__typename === "SalePrice" ? item.price.unitCostInCents : 0;
                      const subtotal = priceBookUnitPrice * quantity;
                      const deliveryCharge = item.delivery_charge_in_cents || 0;
                      totalIncludingDelivery += subtotal + deliveryCharge;
                    }
                  });

                  const totalIncludingDeliveryFormatted = `$${(totalIncludingDelivery / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                  return (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        px: 2,
                        py: 1,
                        background: "background.paper",
                        borderTop: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", color: "primary.main" }}
                      >
                        Total: {totalIncludingDeliveryFormatted}
                      </Typography>
                    </Box>
                  );
                },
              }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddNewItem}
              sx={{ mt: 1, alignSelf: "flex-start" }}
              disabled={purchaseOrderStatus === PurchaseOrderStatus.Submitted}
            >
              Add Item
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default PurchaseOrderLineItemsDataGrid;
