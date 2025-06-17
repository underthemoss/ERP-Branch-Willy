// "use client";

import { graphql } from "@/graphql";
import { useSalesOrderLineItemsQuery } from "@/graphql/hooks";
import EmptyStateListViewIcon from "@/ui/icons/EmptyStateListViewIcon";
import ErrorStateListViewIcon from "@/ui/icons/ErrorStateListViewIcon";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid, GridColDef, Toolbar } from "@mui/x-data-grid";
import * as React from "react";

// --- GQL Query (for codegen) ---
graphql(`
  query SalesOrderLineItems($salesOrderId: String!) {
    getSalesOrderById(id: $salesOrderId) {
      line_items {
        ... on RentalSalesOrderLineItem {
          id
          so_pim_id
          so_quantity
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
            total_including_delivery_in_cents
          }
          price_id
          price_per_day_in_cents
          price_per_week_in_cents
          price_per_month_in_cents
          delivery_location
          delivery_date
          delivery_method
          delivery_charge_in_cents
          off_rent_date
          created_at
          updated_at
          lineitem_status
        }
        ... on SaleSalesOrderLineItem {
          id
          so_pim_id
          so_quantity
          so_pim_product {
            name
          }
          unit_cost_in_cents
          created_at
          updated_at
        }
      }
    }
  }
`);

export interface SalesOrderLineItemsDataGridProps {
  salesOrderId: string;
  onAddNewItem?: () => void;
}

export const SalesOrderLineItemsDataGrid: React.FC<SalesOrderLineItemsDataGridProps> = ({
  salesOrderId,
  onAddNewItem,
}) => {
  const { data, loading, error, refetch } = useSalesOrderLineItemsQuery({
    variables: { salesOrderId },
    fetchPolicy: "cache-and-network",
  });

  const handleAddNewItem = async () => {
    if (onAddNewItem) {
      await onAddNewItem();
      await refetch();
    }
  };

  const lineItems = data?.getSalesOrderById?.line_items || [];

  const columns: GridColDef[] = [
    // Core identifiers and product/category info
    {
      field: "id",
      headerName: "ID",
      minWidth: 120,
      flex: 1,
    },
    {
      field: "so_pim_id",
      headerName: "PIM ID",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row) => row.so_pim_id ?? "-",
    },
    {
      field: "so_pim_product.name",
      headerName: "Product Name",
      minWidth: 180,
      flex: 1,
      valueGetter: (_, row) => row.so_pim_product?.name ?? row.so_pim_category?.name ?? "-",
    },
    {
      field: "so_pim_product.model",
      headerName: "Model",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row) => row.so_pim_product?.model ?? "-",
    },
    {
      field: "so_pim_product.sku",
      headerName: "SKU",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row) => row.so_pim_product?.sku ?? "-",
    },
    {
      field: "so_pim_product.manufacturer_part_number",
      headerName: "Mfr Part #",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) => row.so_pim_product?.manufacturer_part_number ?? "-",
    },
    {
      field: "so_pim_product.year",
      headerName: "Year",
      minWidth: 80,
      flex: 0.5,
      valueGetter: (_, row) => row.so_pim_product?.year ?? "-",
    },
    {
      field: "so_pim_category.name",
      headerName: "Category Name",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) => row.so_pim_category?.name ?? "-",
    },
    {
      field: "so_pim_category.description",
      headerName: "Category Description",
      minWidth: 180,
      flex: 1,
      valueGetter: (_, row) => row.so_pim_category?.description ?? "-",
    },
    {
      field: "so_pim_category.id",
      headerName: "Category ID",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row) => row.so_pim_category?.id ?? "-",
    },

    // Pricing
    {
      field: "price.priceBook.name",
      headerName: "Price Book Name",
      minWidth: 160,
      flex: 1,
      valueGetter: (_, row) => row.price?.priceBook?.name ?? "-",
    },
    {
      field: "price.priceBook.id",
      headerName: "Price Book ID",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row) => row.price?.priceBook?.id ?? "-",
    },
    {
      field: "price_per_day_in_cents",
      headerName: "Price/Day",
      minWidth: 100,
      flex: 1,
      valueGetter: (_, row) =>
        typeof row.price_per_day_in_cents === "number"
          ? `$${(row.price_per_day_in_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "-",
    },
    {
      field: "price_per_week_in_cents",
      headerName: "Price/Week",
      minWidth: 100,
      flex: 1,
      valueGetter: (_, row) =>
        typeof row.price_per_week_in_cents === "number"
          ? `$${(row.price_per_week_in_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "-",
    },
    {
      field: "price_per_month_in_cents",
      headerName: "Price/Month",
      minWidth: 110,
      flex: 1,
      valueGetter: (_, row) =>
        typeof row.price_per_month_in_cents === "number"
          ? `$${(row.price_per_month_in_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "-",
    },
    {
      field: "unit_cost_in_cents",
      headerName: "Unit Cost",
      minWidth: 100,
      flex: 1,
      valueGetter: (_, row) =>
        typeof row.unit_cost_in_cents === "number"
          ? `$${(row.unit_cost_in_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "-",
    },
    {
      field: "price_id",
      headerName: "Price ID",
      minWidth: 120,
      flex: 1,
      valueGetter: (_, row) => row.price_id ?? "-",
    },

    // Quantities and status
    {
      field: "so_quantity",
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

    // Fulfillment
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
        row.delivery_date ? new Date(row.delivery_date).toLocaleDateString() : "-",
    },
    {
      field: "off_rent_date",
      headerName: "Off-Rent Date",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) =>
        row.off_rent_date ? new Date(row.off_rent_date).toLocaleDateString() : "-",
    },

    // User and audit
    {
      field: "created_by_user",
      headerName: "Created By User",
      minWidth: 160,
      flex: 1,
      valueGetter: (_, row) =>
        row.created_by_user
          ? `${row.created_by_user.firstName ?? ""} ${row.created_by_user.lastName ?? ""}`.trim() ||
            "-"
          : "-",
    },
    {
      field: "updated_by_user",
      headerName: "Updated By User",
      minWidth: 160,
      flex: 1,
      valueGetter: (_, row) =>
        row.updated_by_user
          ? `${row.updated_by_user.firstName ?? ""} ${row.updated_by_user.lastName ?? ""}`.trim() ||
            "-"
          : "-",
    },
    {
      field: "created_at",
      headerName: "Created At",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) => (row.created_at ? new Date(row.created_at).toLocaleString() : "-"),
    },
    {
      field: "line_item_total_incl_delivery",
      headerName: "Line Item Price (Incl. Delivery)",
      minWidth: 180,
      flex: 1,
      valueGetter: (_, row) => {
        // Rental: use calulate_price.total_including_delivery_in_cents if present
        if (
          row.calulate_price &&
          typeof row.calulate_price.total_including_delivery_in_cents === "number"
        ) {
          return `$${(row.calulate_price.total_including_delivery_in_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        // Sale: use unit_cost_in_cents if present
        if (typeof row.unit_cost_in_cents === "number") {
          return `$${(row.unit_cost_in_cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return "-";
      },
    },
    {
      field: "updated_at",
      headerName: "Updated At",
      minWidth: 140,
      flex: 1,
      valueGetter: (_, row) => (row.updated_at ? new Date(row.updated_at).toLocaleString() : "-"),
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
              onClick={handleAddNewItem}
              sx={{ minWidth: 160 }}
            >
              Add New Item
            </Button>
          </Box>
        ) : (
          <>
            <DataGrid
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
                    so_quantity: true,
                    line_item_total_incl_delivery: true,
                    lineitem_status: true,
                    delivery_method: true,
                    // All others hidden by default
                    id: false,
                    so_pim_id: false,
                    "so_pim_product.model": false,
                    "so_pim_product.sku": false,
                    "so_pim_product.manufacturer_part_number": false,
                    "so_pim_product.year": false,
                    "so_pim_category.name": false,
                    "so_pim_category.description": false,
                    "so_pim_category.id": false,
                    "price.priceBook.name": false,
                    "price.priceBook.id": false,
                    price_per_day_in_cents: false,
                    price_per_week_in_cents: false,
                    price_per_month_in_cents: false,
                    unit_cost_in_cents: false,
                    price_id: false,
                    delivery_location: false,
                    delivery_charge_in_cents: false,
                    delivery_date: false,
                    off_rent_date: false,
                    created_by_user: false,
                    updated_by_user: false,
                    created_at: false,
                    updated_at: false,
                  },
                },
              }}
              slots={{
                toolbar: Toolbar,
                footer: () => {
                  // todo: should do this on the BE. Calculate total price for all line items using type guards
                  const totalCents = lineItems.reduce((sum, row) => {
                    if (!row || typeof row !== "object") return sum;
                    if (
                      row.__typename === "RentalSalesOrderLineItem" &&
                      row.calulate_price &&
                      typeof row.calulate_price.total_including_delivery_in_cents === "number"
                    ) {
                      return sum + row.calulate_price.total_including_delivery_in_cents;
                    }
                    if (
                      row.__typename === "SaleSalesOrderLineItem" &&
                      typeof row.unit_cost_in_cents === "number"
                    ) {
                      return sum + row.unit_cost_in_cents;
                    }
                    return sum;
                  }, 0);
                  const totalFormatted = `$${(totalCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  return (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        px: 2,
                        py: 1,
                        background: "background.paper",
                        borderTop: 1,
                        borderColor: "divider",
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                        Total: {totalFormatted}
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
            >
              Add Item
            </Button>
          </>
        )}
      </Box>
      {/* Dialog for adding items is now handled by parent */}
    </Box>
  );
};

export default SalesOrderLineItemsDataGrid;
