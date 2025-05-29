"use client";

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
import { DataGridPro, GridColDef } from "@mui/x-data-grid-pro";
import { PageContainer } from "@toolpad/core/PageContainer";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

const stubSalesOrders = [
  {
    id: "SO-1001",
    buyer: "Business Entity",
    project: "Project Name",
    date: "2025-06-02T10:00:00Z",
    status: "Open",
    total: "$12,000",
    created_by: "Jane Doe",
  },
  {
    id: "SO-1002",
    buyer: "Acme Corp",
    project: "Warehouse Expansion",
    date: "2025-05-15T14:30:00Z",
    status: "Closed",
    total: "$8,500",
    created_by: "John Smith",
  },
  {
    id: "SO-1003",
    buyer: "Frontier LLC",
    project: "Site Prep",
    date: "2025-05-20T09:00:00Z",
    status: "Open",
    total: "$3,200",
    created_by: "Alice Johnson",
  },
];

export default function SalesOrdersPage() {
  const [statusFilter, setStatusFilter] = React.useState("All Statuses");
  const [searchTerm, setSearchTerm] = React.useState("");

  const rows = React.useMemo(() => stubSalesOrders, []);

  const filteredRows = React.useMemo(() => {
    let filtered = rows;
    if (statusFilter !== "All Statuses") {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }
    if (!searchTerm) return filtered;
    const lower = searchTerm.toLowerCase();
    return filtered.filter((row) =>
      Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
    );
  }, [rows, searchTerm, statusFilter]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "Order #", width: 120 },
    { field: "buyer", headerName: "Buyer", flex: 2, minWidth: 180 },
    { field: "project", headerName: "Project", flex: 2, minWidth: 180 },
    {
      field: "date",
      headerName: "Date",
      width: 180,
      renderCell: (params) => {
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
    { field: "total", headerName: "Total", width: 120 },
    { field: "created_by", headerName: "Created By", width: 160 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
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
  ];

  const router = useRouter();
  const { workspace_id } = useParams<{ workspace_id: string }>();

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
            <DataGridPro
              columns={columns}
              rows={filteredRows}
              disableRowSelectionOnClick
              hideFooter
              getRowId={(row) => row.id}
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
            />
          </div>
        </Box>
      </Container>
    </PageContainer>
  );
}
