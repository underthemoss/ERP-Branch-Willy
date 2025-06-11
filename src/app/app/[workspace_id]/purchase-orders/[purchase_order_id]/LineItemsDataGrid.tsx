"use client";

import { graphql } from "@/graphql";
import { useLineItemsDataGrid_GetPurchaseOrderByIdQuery } from "@/graphql/hooks";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import * as React from "react";
import CreatePOLineItemDialog from "./CreatePOLineItemDialog";

export interface LineItemsDataGridProps {
  purchaseOrderId: string;
}

const LINE_ITEMS_QUERY = graphql(`
  query LineItemsDataGrid_GetPurchaseOrderById($id: String!) {
    getPurchaseOrderById(id: $id) {
      id
      line_items {
        id
        po_pim_id
        po_quantity
        pim_product {
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

export const LineItemsDataGrid: React.FC<LineItemsDataGridProps> = ({ purchaseOrderId }) => {
  const { data, loading, error, refetch } = useLineItemsDataGrid_GetPurchaseOrderByIdQuery({
    variables: { id: purchaseOrderId },
    fetchPolicy: "cache-and-network",
  });

  const [addDialogOpen, setAddDialogOpen] = React.useState(false);

  const lineItems =
    data?.getPurchaseOrderById?.line_items
      ?.filter(
        (
          item,
        ): item is {
          id: string;
          po_pim_id: string;
          po_quantity: number;
          pim_product?: {
            name?: string | null;
            model?: string | null;
            sku?: string | null;
            manufacturer_part_number?: string | null;
            year?: string | null;
          } | null;
        } => !!item && !!item.id && !!item.po_pim_id && typeof item.po_quantity === "number",
      )
      .map((item) => ({
        id: item.id,
        po_pim_id: item.po_pim_id,
        po_quantity: item.po_quantity,
        pim_product_name: item.pim_product?.name ?? "",
        pim_product_model: item.pim_product?.model ?? "",
        pim_product_sku: item.pim_product?.sku ?? "",
        pim_product_manufacturer_part_number: item.pim_product?.manufacturer_part_number ?? "",
        pim_product_year: item.pim_product?.year ?? "",
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
      field: "po_quantity",
      headerName: "Quantity",
      type: "number",
      flex: 0.5,
      minWidth: 100,
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Line items
      </Typography>
      <Box sx={{ width: "100%", mb: 2 }}>
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
            Error loading line items: {error.message}
          </Typography>
        )}
      </Box>
      <Button
        variant="outlined"
        size="small"
        onClick={() => setAddDialogOpen(true)}
        sx={{ mt: 1, alignSelf: "flex-start" }}
      >
        Add Item
      </Button>
      <CreatePOLineItemDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        purchaseOrderId={purchaseOrderId}
        onSuccess={() => {
          setAddDialogOpen(false);
          refetch();
        }}
      />
    </Box>
  );
};

export default LineItemsDataGrid;
