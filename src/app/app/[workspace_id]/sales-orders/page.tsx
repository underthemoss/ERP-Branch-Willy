"use client";

import { graphql } from "@/graphql";
import { useSalesOrdersWithLookupsQuery } from "@/graphql/hooks";
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
  query SalesOrdersWithLookups(
    $limit: Int = 20
    $offset: Int = 0
    $contactsFilter: ListContactsFilter!
    $contactsPage: ListContactsPage
  ) {
    listSalesOrders(limit: $limit, offset: $offset) {
      items {
        id
        order_id
        buyer_id
        project_id
        company_id
        purchase_order_number
        created_at
        updated_at
        updated_by
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
    listProjects {
      id
      name
    }
    listContacts(filter: $contactsFilter, page: $contactsPage) {
      items {
        ... on BusinessContact {
          id
          name
        }
        ... on PersonContact {
          id
          name
        }
      }
    }
  }
`);

export default function SalesOrdersPage() {
  const [statusFilter, setStatusFilter] = React.useState("All Statuses");
  const [searchTerm, setSearchTerm] = React.useState("");

  // Fetch sales orders, projects, and contacts
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const { data, loading, error } = useSalesOrdersWithLookupsQuery({
    variables: {
      limit: 100,
      offset: 0,
      contactsFilter: { workspaceId: workspace_id },
      contactsPage: { number: 1, size: 100 },
    },
    fetchPolicy: "cache-and-network",
  });

  // Map GQL data to table rows
  type SalesOrderRow = {
    id: string;
    buyer: string;
    project: string;
    status: string;
    total: string;
    created_by: string;
    updated_by: string;
    created_at: string;
    updated_at: string;
  };

  const rows: SalesOrderRow[] = React.useMemo(() => {
    if (!data?.listSalesOrders?.items || !data.listProjects || !data.listContacts?.items) return [];

    // Build lookup maps
    const projectMap = new Map(
      data.listProjects
        .filter((proj): proj is { id: string; name: string } => !!proj)
        .map((proj) => [proj.id, proj.name]),
    );
    const contactMap = new Map(
      data.listContacts.items
        .filter((contact): contact is { id: string; name: string } => !!contact)
        .map((contact) => [contact.id, contact.name]),
    );

    return data.listSalesOrders.items.map(
      (order: {
        id: string;
        buyer_id?: string | null;
        project_id?: string | null;
        created_at?: string | null;
        updated_at?: string | null;
        updated_by?: string | null;
        created_by_user?: {
          firstName?: string | null;
          lastName?: string | null;
          email?: string | null;
        } | null;
        updated_by_user?: {
          firstName?: string | null;
          lastName?: string | null;
          email?: string | null;
        } | null;
      }): SalesOrderRow => ({
        id: order.id,
        buyer: contactMap.get(order.buyer_id ?? "") ?? order.buyer_id ?? "not implemented",
        project: projectMap.get(order.project_id ?? "") ?? order.project_id ?? "not implemented",
        status: "not implemented",
        total: "not implemented",
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
      }),
    );
  }, [data]);

  const filteredRows = React.useMemo(() => {
    let filtered = rows;
    if (statusFilter !== "All Statuses") {
      filtered = filtered.filter((row: SalesOrderRow) => row.status === statusFilter);
    }
    if (!searchTerm) return filtered;
    const lower = searchTerm.toLowerCase();
    return filtered.filter((row: SalesOrderRow) =>
      Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
    );
  }, [rows, searchTerm, statusFilter]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "Order #", width: 120 },
    { field: "buyer", headerName: "Buyer", flex: 2, minWidth: 180 },
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
            color={params.value === "Open" ? "success" : "default"}
            size="small"
            sx={{ fontWeight: 600 }}
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
        if (params.value === "not implemented") return "not implemented";
        const date = params.value ? parseISO(params.value) : null;
        return date ? (
          <Tooltip title={format(date, "MMMM d, yyyy, h:mm a")} arrow>
            <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
          </Tooltip>
        ) : (
          ""
        );
      },
    },
    {
      field: "updated_at",
      headerName: "Updated At",
      width: 180,
      renderCell: (params) => {
        if (params.value === "not implemented") return "not implemented";
        const date = params.value ? parseISO(params.value) : null;
        return date ? (
          <Tooltip title={format(date, "MMMM d, yyyy, h:mm a")} arrow>
            <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
          </Tooltip>
        ) : (
          ""
        );
      },
    },
  ];

  const router = useRouter();

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={1}>
          <Typography variant="h1">Sales Orders</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none", fontWeight: 600 }}
            onClick={() => router.push("sales-orders/new-sales-order")}
          >
            + Create Sales Order
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary" mb={2}>
          View, manage, and organize your sales orders.
        </Typography>
        <Box mb={2} display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search sales orders"
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
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 140 }}
            data-testid="sales-order-status-filter"
            MenuProps={{
              MenuListProps: {
                dense: true,
              },
            }}
          >
            <MenuItem value="All Statuses">All Statuses</MenuItem>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
          </Select>
        </Box>
        <Box sx={{ height: 600 }}>
          <div data-testid="sales-order-list" style={{ height: "100%" }}>
            <DataGridPremium
              columns={columns}
              rows={filteredRows}
              loading={loading}
              disableRowSelectionOnClick
              hideFooter
              getRowId={(row: SalesOrderRow) => row.id}
              initialState={{
                pinnedColumns: { left: ["id"] },
              }}
              sx={{
                cursor: "pointer",
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
              getRowClassName={() => "sales-order-list-item"}
              onRowClick={(params) => {
                router.push(`/app/${workspace_id}/sales-orders/${params.id}`);
              }}
            />
            {error && (
              <Typography color="error" mt={2}>
                Failed to load sales orders.
              </Typography>
            )}
          </div>
        </Box>
      </Container>
    </PageContainer>
  );
}
