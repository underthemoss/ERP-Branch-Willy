// "use client";

import { graphql } from "@/graphql";
import { useSalesOrderLineItemsDataGrid_GetSalesOrderByIdQuery } from "@/graphql/hooks";
import EmptyStateListViewIcon from "@/ui/icons/EmptyStateListViewIcon";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import * as React from "react";
import CreateSOLineItemDialog from "./CreateSOLineItemDialog";

// --- GQL Query (for codegen) ---
graphql(`
  query SalesOrderLineItemsDataGrid_GetSalesOrderById($id: String!) {
    getSalesOrderById(id: $id) {
      id
      line_items {
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
      }
    }
  }
`);

export interface SalesOrderLineItemsDataGridProps {
  salesOrderId: string;
}

export const SalesOrderLineItemsDataGrid: React.FC<SalesOrderLineItemsDataGridProps> = ({
  salesOrderId,
}) => {
  const { data, loading, error, refetch } = useSalesOrderLineItemsDataGrid_GetSalesOrderByIdQuery({
    variables: { id: salesOrderId },
    fetchPolicy: "cache-and-network",
  });

  const [addDialogOpen, setAddDialogOpen] = React.useState(false);

  const lineItems =
    data?.getSalesOrderById?.line_items
      ?.filter(
        (
          item,
        ): item is {
          id: string;
          so_pim_id: string;
          so_quantity: number;
          so_pim_product?: {
            name?: string | null;
            model?: string | null;
            sku?: string | null;
            manufacturer_part_number?: string | null;
            year?: string | null;
          } | null;
        } => !!item && !!item.id && !!item.so_pim_id && typeof item.so_quantity === "number",
      )
      .map((item) => ({
        id: item.id,
        so_pim_id: item.so_pim_id,
        so_quantity: item.so_quantity,
        pim_product_name: item.so_pim_product?.name ?? "",
        pim_product_model: item.so_pim_product?.model ?? "",
        pim_product_sku: item.so_pim_product?.sku ?? "",
        pim_product_manufacturer_part_number: item.so_pim_product?.manufacturer_part_number ?? "",
        pim_product_year: item.so_pim_product?.year ?? "",
      })) ?? [];

  const columns: GridColDef[] = [
    {
      field: "pim_product_name",
      headerName: "Product Name",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "pim_product_model",
      headerName: "Model",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "pim_product_sku",
      headerName: "SKU",
      flex: 1,
      minWidth: 120,
    },
    {
      field: "pim_product_manufacturer_part_number",
      headerName: "Mfr Part #",
      flex: 1,
      minWidth: 140,
    },
    {
      field: "pim_product_year",
      headerName: "Year",
      flex: 0.5,
      minWidth: 80,
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
              Manage each line item’s transaction type, details, and fulfillment requirements here.
            </Typography>
            <Button
              variant="contained"
              size="medium"
              onClick={() => setAddDialogOpen(true)}
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
              onClick={() => setAddDialogOpen(true)}
              sx={{ mt: 1, alignSelf: "flex-start" }}
            >
              Add Item
            </Button>
          </>
        )}
      </Box>
      <CreateSOLineItemDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        salesOrderId={salesOrderId}
        onSuccess={() => {
          setAddDialogOpen(false);
          refetch();
        }}
      />
    </Box>
  );
};

export default SalesOrderLineItemsDataGrid;
