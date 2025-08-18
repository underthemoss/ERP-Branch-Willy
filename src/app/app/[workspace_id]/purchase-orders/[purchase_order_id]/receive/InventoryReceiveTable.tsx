"use client";

import { Box, Button, Chip, LinearProgress, Paper, Typography } from "@mui/material";
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

  // Group items by line item ID and separate by type
  const { salesGroups, rentalGroups } = useMemo(() => {
    const allGroups = groupInventoryByLineItem(items);

    // Separate groups based on line item type
    const sales = allGroups.filter((group) => {
      const firstItem = group.items[0];
      return firstItem?.purchaseOrderLineItem?.lineitem_type === "SALE";
    });

    const rentals = allGroups.filter((group) => {
      const firstItem = group.items[0];
      return firstItem?.purchaseOrderLineItem?.lineitem_type === "RENTAL";
    });

    return {
      salesGroups: sales,
      rentalGroups: rentals,
    };
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

  // Additional columns specific to rental items
  const rentalColumns: GridColDef[] = [
    ...columns.slice(0, 2), // Keep Line Item ID and Category/Product columns
    {
      field: "deliveryDate",
      headerName: "Delivery Date",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => {
        const deliveryDate = params.row.deliveryDate;
        if (!deliveryDate) return "-";
        return new Date(deliveryDate).toLocaleDateString();
      },
    },
    {
      field: "offRentDate",
      headerName: "Off Rent Date",
      width: 130,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams) => {
        const offRentDate = params.row.offRentDate;
        if (!offRentDate) return "-";
        return new Date(offRentDate).toLocaleDateString();
      },
    },
    ...columns.slice(2), // Keep remaining columns
  ];

  const createRows = (groups: any[]) => {
    return groups.map((group, index) => ({
      id: group.lineItemId || `no-line-item-${index}`,
      lineItemId: group.lineItemId,
      categoryName: group.categoryName,
      productName: group.productName,
      productModel: group.productModel,
      totalCount: group.totalCount,
      receivedCount: group.receivedCount,
      onOrderCount: group.onOrderCount,
      fulfillmentPercentage: group.fulfillmentPercentage,
      deliveryDate: group.items[0]?.purchaseOrderLineItem?.delivery_date,
      offRentDate: group.items[0]?.purchaseOrderLineItem?.off_rent_date,
      items: group.items,
    }));
  };

  const salesRows = createRows(salesGroups);
  const rentalRows = createRows(rentalGroups);

  const renderDataGrid = (rows: any[], columnsToUse: GridColDef[], title: string) => (
    <Paper elevation={0} sx={{ mb: 3, border: "1px solid", borderColor: "divider" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
        <Typography variant="subtitle1" fontWeight="medium">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {rows.length} line item{rows.length !== 1 ? "s" : ""}
        </Typography>
      </Box>
      {rows.length > 0 ? (
        <DataGrid
          rows={rows}
          columns={columnsToUse}
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
            border: 0,
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
      ) : (
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No {title.toLowerCase()} found
          </Typography>
        </Box>
      )}
    </Paper>
  );

  return (
    <>
      {/* Sales Line Items Section */}
      {(salesRows.length > 0 || rentalRows.length === 0) &&
        renderDataGrid(salesRows, columns, "Sales Line Items")}

      {/* Rental Line Items Section */}
      {(rentalRows.length > 0 || salesRows.length === 0) &&
        renderDataGrid(rentalRows, rentalColumns, "Rental Line Items")}

      {/* Show message if no items at all */}
      {salesRows.length === 0 && rentalRows.length === 0 && !loading && (
        <Paper
          elevation={0}
          sx={{ p: 3, textAlign: "center", border: "1px solid", borderColor: "divider" }}
        >
          <Typography variant="body1" color="text.secondary">
            No inventory items found for this purchase order
          </Typography>
        </Paper>
      )}

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
