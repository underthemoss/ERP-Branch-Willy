"use client";

import { graphql } from "@/graphql";
import { PurchaseOrderStatus } from "@/graphql/graphql";
import { usePurchaseOrdersWithLookupsQuery } from "@/graphql/hooks";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import { PageContainer } from "@toolpad/core/PageContainer";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

graphql(`
  query PurchaseOrdersWithLookups($workspaceId: String!, $limit: Int = 20, $offset: Int = 0) {
    listPurchaseOrders(workspaceId: $workspaceId, limit: $limit, offset: $offset) {
      items {
        id
        project {
          id
          name
        }
        seller {
          ... on BusinessContact {
            id
            name
          }
          ... on PersonContact {
            id
            name
            business {
              id
              name
            }
          }
        }
        seller_id
        status
        project_id
        company_id
        purchase_order_number
        created_at
        updated_at
        updated_by
        pricing {
          total_in_cents
        }
        fulfillmentProgress {
          fulfillmentPercentage
          isFullyFulfilled
          isPartiallyFulfilled
          onOrderItems
          receivedItems
          status
          totalItems
        }
        created_by_user {
          id
          firstName
          lastName
          email
        }
        updated_by_user {
          id
          firstName
          lastName
          email
        }
      }
      total
      limit
      offset
    }
  }
`);

export default function PurchaseOrdersPage() {
  const [statusFilter, setStatusFilter] = React.useState<PurchaseOrderStatus | "All Statuses">(
    "All Statuses",
  );
  const [searchTerm, setSearchTerm] = React.useState("");

  // Fetch purchase orders
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const { data, loading, error } = usePurchaseOrdersWithLookupsQuery({
    variables: {
      workspaceId: workspace_id,
      limit: 100,
      offset: 0,
    },
    fetchPolicy: "cache-and-network",
  });

  // Map GQL data to table rows
  type PurchaseOrderRow = {
    id: string;
    purchase_order_number: string;
    business: string;
    contact: string;
    project: string;
    status: PurchaseOrderStatus;
    fulfillmentStatus: "DRAFT" | "ORDERED" | "PARTIALLY_FULFILLED" | "FULFILLED";
    total: string;
    fulfillmentPercentage: number;
    receivedItems: number;
    totalItems: number;
    isFullyFulfilled: boolean;
    isPartiallyFulfilled: boolean;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
  };

  const rows: PurchaseOrderRow[] = React.useMemo(() => {
    if (!data?.listPurchaseOrders?.items) return [];

    return data.listPurchaseOrders.items.map((order): PurchaseOrderRow => {
      let businessName = "";
      let contactName = "";

      if (order.seller) {
        // Check if seller is a PersonContact (has business property)
        if ("business" in order.seller) {
          // PersonContact
          businessName = order.seller.business?.name ?? "";
          contactName = order.seller.name;
        } else {
          // BusinessContact
          businessName = order.seller.name;
          contactName = "-";
        }
      }

      // Compute fulfillment status based on order status and fulfillment progress
      let fulfillmentStatus: "DRAFT" | "ORDERED" | "PARTIALLY_FULFILLED" | "FULFILLED";

      if (order.status === PurchaseOrderStatus.Draft) {
        fulfillmentStatus = "DRAFT";
      } else if (order.fulfillmentProgress?.isFullyFulfilled) {
        fulfillmentStatus = "FULFILLED";
      } else if (order.fulfillmentProgress?.isPartiallyFulfilled) {
        fulfillmentStatus = "PARTIALLY_FULFILLED";
      } else {
        fulfillmentStatus = "ORDERED";
      }

      return {
        id: order.id,
        purchase_order_number: order.purchase_order_number ?? "not implemented",
        business: businessName,
        contact: contactName,
        project: order.project?.name ?? "not implemented",
        status: order.status,
        fulfillmentStatus,
        total: `$${((order.pricing?.total_in_cents || 0) / 100).toFixed(2)}`,
        fulfillmentPercentage: order.fulfillmentProgress?.fulfillmentPercentage ?? 0,
        receivedItems: order.fulfillmentProgress?.receivedItems ?? 0,
        totalItems: order.fulfillmentProgress?.totalItems ?? 0,
        isFullyFulfilled: order.fulfillmentProgress?.isFullyFulfilled ?? false,
        isPartiallyFulfilled: order.fulfillmentProgress?.isPartiallyFulfilled ?? false,
        created_by: order.created_by_user
          ? [order.created_by_user.firstName, order.created_by_user.lastName]
              .filter(Boolean)
              .join(" ") ||
            order.created_by_user.email ||
            "not implemented"
          : "not implemented",
        updated_by: order.updated_by_user
          ? [order.updated_by_user.firstName, order.updated_by_user.lastName]
              .filter(Boolean)
              .join(" ") ||
            order.updated_by_user.email ||
            "not implemented"
          : "not implemented",
        created_at: order.created_at ?? "not implemented",
        updated_at: order.updated_at ?? "not implemented",
      };
    });
  }, [data]);

  const filteredRows = React.useMemo(() => {
    let filtered = rows;
    if (statusFilter !== "All Statuses") {
      filtered = filtered.filter((row: PurchaseOrderRow) => row.status === statusFilter);
    }
    if (!searchTerm) return filtered;
    const lower = searchTerm.toLowerCase();
    return filtered.filter((row: PurchaseOrderRow) =>
      Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
    );
  }, [rows, searchTerm, statusFilter]);

  const columns: GridColDef[] = [
    { field: "purchase_order_number", headerName: "PO #", width: 120 },
    { field: "business", headerName: "Business", flex: 2, minWidth: 180 },
    { field: "contact", headerName: "Contact", flex: 1, minWidth: 150 },
    { field: "project", headerName: "Project", flex: 2, minWidth: 180 },
    { field: "total", headerName: "Total", width: 120 },
    {
      field: "fulfillmentStatus",
      headerName: "Status",
      width: 160,
      renderCell: (params) => {
        const status = params.value as string;
        let color: "default" | "primary" | "warning" | "success" = "default";
        let label = status;

        switch (status) {
          case "DRAFT":
            color = "default";
            label = "Draft";
            break;
          case "ORDERED":
            color = "primary";
            label = "Ordered";
            break;
          case "PARTIALLY_FULFILLED":
            color = "warning";
            label = "Partially Fulfilled";
            break;
          case "FULFILLED":
            color = "success";
            label = "Fulfilled";
            break;
        }

        return (
          <Chip
            label={label}
            color={color}
            size="small"
            variant={status === "FULFILLED" ? "filled" : "outlined"}
          />
        );
      },
    },
    {
      field: "fulfillmentPercentage",
      headerName: "Inventory Received",
      width: 200,
      renderCell: (params) => {
        const percentage = params.row.fulfillmentPercentage || 0;
        const receivedItems = params.row.receivedItems || 0;
        const totalItems = params.row.totalItems || 0;
        const isFullyFulfilled = params.row.isFullyFulfilled || false;

        // Don't show progress bar if there are no items
        if (totalItems === 0) {
          return (
            <Typography variant="caption" color="text.secondary">
              No items
            </Typography>
          );
        }

        return (
          <Tooltip
            title={`${receivedItems} of ${totalItems} items received (${percentage.toFixed(1)}%)`}
            arrow
          >
            <Box sx={{ width: "100%", position: "relative" }}>
              <LinearProgress
                variant="determinate"
                value={percentage}
                color={isFullyFulfilled ? "success" : percentage > 0 ? "primary" : "inherit"}
                sx={{
                  height: 24,
                  borderRadius: 1,
                  mt: 2,
                  backgroundColor: (theme) =>
                    theme.palette.mode === "light"
                      ? theme.palette.grey[200]
                      : theme.palette.grey[800],
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: percentage > 50 ? "white" : "text.primary",
                    fontWeight: 500,
                  }}
                >
                  {receivedItems}/{totalItems} items
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        );
      },
      sortComparator: (v1, v2) => (v1 as number) - (v2 as number),
    },
    { field: "id", headerName: "Order ID", width: 120 },
    { field: "created_by", headerName: "Created By", width: 160 },
    { field: "updated_by", headerName: "Updated By", width: 160 },
    {
      field: "created_at",
      headerName: "Created At",
      width: 180,
      renderCell: (params) => {
        if (!params?.value) return "";
        const date = new Date(Number(params.value));
        return (
          <Tooltip title={formatDistanceToNow(date, { addSuffix: true })} arrow>
            <span>{format(date, "MM/dd/yy, h:mm:ss a")}</span>
          </Tooltip>
        );
      },
    },
    {
      field: "updated_at",
      headerName: "Updated At",
      width: 180,
      renderCell: (params) => {
        if (!params?.value) return "";
        const date = new Date(Number(params.value));
        return (
          <Tooltip title={formatDistanceToNow(date, { addSuffix: true })} arrow>
            <span>{format(date, "MM/dd/yy, h:mm:ss a")}</span>
          </Tooltip>
        );
      },
    },
  ];

  const router = useRouter();

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={1}>
          <Typography variant="h1">Purchase Orders</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none", fontWeight: 600 }}
            onClick={() => router.push("purchase-orders/new-purchase-order")}
          >
            + Create Purchase Order
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary" mb={2}>
          View, manage, and organize your purchase orders.
        </Typography>
        <Box mb={2} display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search purchase orders"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
          <Select
            size="small"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as PurchaseOrderStatus | "All Statuses")
            }
            sx={{ minWidth: 140 }}
            data-testid="purchase-order-status-filter"
            MenuProps={{
              MenuListProps: {
                dense: true,
              },
            }}
          >
            <MenuItem value="All Statuses">All Statuses</MenuItem>
            <MenuItem value={PurchaseOrderStatus.Draft}>Draft</MenuItem>
            <MenuItem value={PurchaseOrderStatus.Submitted}>Submitted</MenuItem>
          </Select>
        </Box>
        <Box sx={{ height: 600 }}>
          <div data-testid="purchase-order-list" style={{ height: "100%" }}>
            <DataGridPremium
              columns={columns}
              rows={filteredRows}
              loading={loading}
              disableRowSelectionOnClick
              hideFooter
              getRowId={(row: PurchaseOrderRow) => row.id}
              initialState={{
                sorting: {
                  sortModel: [{ field: "updated_at", sort: "desc" }],
                },
              }}
              sx={{
                cursor: "pointer",
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
              getRowClassName={() => "purchase-order-list-item"}
              onRowClick={(params) => {
                router.push(`/app/${workspace_id}/purchase-orders/${params.id}`);
              }}
            />
            {error && (
              <Typography color="error" mt={2}>
                Failed to load purchase orders.
              </Typography>
            )}
          </div>
        </Box>
      </Container>
    </PageContainer>
  );
}
