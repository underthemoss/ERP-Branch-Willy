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
  query PurchaseOrdersWithLookups($limit: Int = 20, $offset: Int = 0) {
    listPurchaseOrders(limit: $limit, offset: $offset) {
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
        order_id
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
      limit: 100,
      offset: 0,
    },
    fetchPolicy: "cache-and-network",
  });

  // Map GQL data to table rows
  type PurchaseOrderRow = {
    id: string;
    order_id: string;
    purchase_order_number: string;
    business: string;
    contact: string;
    project: string;
    status: PurchaseOrderStatus;
    total: string;
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

      return {
        id: order.id,
        order_id: order.order_id,
        purchase_order_number: order.purchase_order_number ?? "not implemented",
        business: businessName,
        contact: contactName,
        project: order.project?.name ?? "not implemented",
        status: order.status,
        total: `$${((order.pricing?.total_in_cents || 0) / 100).toFixed(2)}`,
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
    { field: "id", headerName: "ID", width: 120 },
    { field: "business", headerName: "Business", flex: 2, minWidth: 180 },
    { field: "contact", headerName: "Contact", flex: 1, minWidth: 150 },
    { field: "project", headerName: "Project", flex: 2, minWidth: 180 },
    { field: "total", headerName: "Total", width: 120 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) =>
        params.value === "not implemented" ? (
          "not implemented"
        ) : (
          <Chip
            label={params.value}
            color={params.value === PurchaseOrderStatus.Submitted ? "primary" : "default"}
            size="small"
          />
        ),
      sortable: false,
      filterable: false,
    },
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
                columns: {
                  columnVisibilityModel: {
                    id: false,
                  },
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
