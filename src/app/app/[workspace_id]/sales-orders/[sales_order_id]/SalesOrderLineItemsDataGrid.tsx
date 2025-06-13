// "use client";

import { graphql } from "@/graphql";
import { useSalesOrderLineItemsQuery } from "@/graphql/hooks";
import EmptyStateListViewIcon from "@/ui/icons/EmptyStateListViewIcon";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
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
          price_per_day_in_cents
          price_per_week_in_cents
          price_per_month_in_cents
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
      refetch();
    }
  };

  const lineItems = data?.getSalesOrderById?.line_items || [];

  const columns: GridColDef[] = [
    {
      field: "so_pim_product.name",
      headerName: "Product Name",
      flex: 1,
      minWidth: 180,
      valueGetter: (_, row) => row.so_pim_product?.name ?? row.so_pim_category?.name ?? "-",
    },
    {
      field: "so_pim_product.model",
      headerName: "Model",
      flex: 1,
      minWidth: 120,
      valueGetter: (_, row) => row.so_pim_product?.model ?? "-",
    },
    {
      field: "so_pim_product.sku",
      headerName: "SKU",
      flex: 1,
      minWidth: 120,
      valueGetter: (_, row) => row.so_pim_product?.sku ?? "-",
    },
    {
      field: "so_pim_product.manufacturer_part_number",
      headerName: "Mfr Part #",
      flex: 1,
      minWidth: 140,
      valueGetter: (_, row) => row.so_pim_product?.manufacturer_part_number ?? "-",
    },
    {
      field: "so_pim_product.year",
      headerName: "Year",
      flex: 0.5,
      minWidth: 80,
      valueGetter: (_, row) => row.so_pim_product?.year ?? "-",
    },
    {
      field: "so_quantity",
      headerName: "Quantity",
      type: "number",
      flex: 0.5,
      minWidth: 100,
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Order Items
      </Typography>
      <Box sx={{ width: "100%", mb: 2 }}>
        {lineItems.length === 0 && !loading ? (
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
              hideFooter
              sx={{ backgroundColor: "background.paper" }}
            />
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                Error loading order items: {error.message}
              </Typography>
            )}
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
