"use client";

import { Box, Button, Chip, LinearProgress, Typography } from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams, GridRowParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import BaseReceiveInventoryDialog from "./BaseReceiveInventoryDialog";
import { groupInventoryByLineItem } from "./utils";

interface InventoryReceiveTableProps {
  items: any[];
  loading: boolean;
  purchaseOrderId: string;
  workspaceId: string;
  onReceiveSuccess: () => void;
}

export default function InventoryReceiveTable({
  items,
  loading,
  purchaseOrderId,
  workspaceId,
  onReceiveSuccess,
}: InventoryReceiveTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLineItemId, setSelectedLineItemId] = useState<string | null>(null);

  // Group items by line item ID
  const groupedData = useMemo(() => {
    return groupInventoryByLineItem(items);
  }, [items]);

  const handleReceiveClick = (lineItemId: string) => {
    setSelectedLineItemId(lineItemId);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedLineItemId(null);
  };

  const handleReceiveSuccess = () => {
    handleDialogClose();
    onReceiveSuccess();
  };

  const columns: GridColDef[] = [
    {
      field: "lineItemId",
      headerName: "Line Item ID",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => (params.value ? params.value.slice(-8) : "-"),
    },
    {
      field: "categoryName",
      headerName: "Category / Product",
      flex: 1,
      minWidth: 200,
      align: "left",
      headerAlign: "left",
      renderCell: (params: GridRenderCellParams) => {
        const categoryOrProduct = params.row.categoryName || params.row.productName || "N/A";
        const model = params.row.productModel ? ` (Model: ${params.row.productModel})` : "";
        return `${categoryOrProduct}${model}`;
      },
    },
    {
      field: "quantity",
      headerName: "Quantity",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => (
        <>
          {params.row.receivedCount}/{params.row.totalCount}
        </>
      ),
    },
    {
      field: "fulfillmentProgress",
      headerName: "Progress",
      width: 150,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => {
        const percentage = params.row.fulfillmentPercentage;
        return (
          <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
            <Box sx={{ width: "100%" }}>
              <LinearProgress
                variant="determinate"
                value={percentage}
                color={percentage === 100 ? "success" : percentage > 0 ? "primary" : "inherit"}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
            <Typography variant="caption" sx={{ minWidth: 35 }}>
              {percentage}%
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => {
        const isFullyReceived = params.row.receivedCount === params.row.totalCount;
        const isPartiallyReceived = params.row.receivedCount > 0;

        if (isFullyReceived) {
          return <Chip label="Received" size="small" color="success" />;
        } else if (isPartiallyReceived) {
          return <Chip label="Partial" size="small" color="warning" />;
        } else {
          return <Chip label="On Order" size="small" color="default" />;
        }
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => {
        const isFullyReceived = params.row.receivedCount === params.row.totalCount;
        const hasOnOrderItems = params.row.onOrderCount > 0;

        return (
          <Button
            variant="contained"
            size="small"
            onClick={() => handleReceiveClick(params.row.lineItemId)}
            disabled={isFullyReceived || !hasOnOrderItems}
          >
            Receive
          </Button>
        );
      },
    },
  ];

  const rows = groupedData.map((group, index) => ({
    id: group.lineItemId || `no-line-item-${index}`,
    lineItemId: group.lineItemId,
    categoryName: group.categoryName,
    productName: group.productName,
    productModel: group.productModel,
    totalCount: group.totalCount,
    receivedCount: group.receivedCount,
    onOrderCount: group.onOrderCount,
    fulfillmentPercentage: group.fulfillmentPercentage,
    items: group.items,
  }));

  return (
    <>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        autoHeight
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10 },
          },
        }}
        sx={{
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(224, 224, 224, 1)",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "action.hover",
          },
        }}
        getRowClassName={(params: GridRowParams) => {
          if (params.row.receivedCount === params.row.totalCount) {
            return "row-fully-received";
          }
          return "";
        }}
      />

      {/* Receive Dialog */}
      {selectedLineItemId && (
        <BaseReceiveInventoryDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          lineItemId={selectedLineItemId}
          purchaseOrderId={purchaseOrderId}
          onSuccess={handleReceiveSuccess}
        />
      )}
    </>
  );
}
