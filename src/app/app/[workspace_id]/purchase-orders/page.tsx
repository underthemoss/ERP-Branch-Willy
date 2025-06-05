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
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import { PageContainer } from "@toolpad/core/PageContainer";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useParams } from "next/navigation";
import * as React from "react";

// Mock data for purchase orders
const mockPurchaseOrders = [
  {
    id: "PO-1001",
    order_id: "PO-1001",
    supplier: "Columbia Building Supply",
    project: "Mizzou Science Building Renovation",
    status: "Open",
    total: "$12,500.00",
    created_by: "Jane Smith",
    updated_by: "Jane Smith",
    created_at: "2024-05-01T10:00:00Z",
    updated_at: "2024-05-02T15:30:00Z",
  },
  {
    id: "PO-1002",
    order_id: "PO-1002",
    supplier: "Show-Me Electric",
    project: "Downtown Parking Garage",
    status: "Closed",
    total: "$8,200.00",
    created_by: "John Doe",
    updated_by: "John Doe",
    created_at: "2024-04-15T09:30:00Z",
    updated_at: "2024-04-20T11:45:00Z",
  },
  {
    id: "PO-1003",
    order_id: "PO-1003",
    supplier: "Boone County Concrete",
    project: "Boone Hospital Expansion",
    status: "Open",
    total: "$15,750.00",
    created_by: "Emily Clark",
    updated_by: "Emily Clark",
    created_at: "2024-03-10T14:20:00Z",
    updated_at: "2024-03-12T09:10:00Z",
  },
  {
    id: "PO-1004",
    order_id: "PO-1004",
    supplier: "Tiger HVAC Services",
    project: "Stephens Lake Park Pavilion",
    status: "Open",
    total: "$6,400.00",
    created_by: "Michael Brown",
    updated_by: "Michael Brown",
    created_at: "2024-02-22T11:00:00Z",
    updated_at: "2024-02-23T13:45:00Z",
  },
  {
    id: "PO-1005",
    order_id: "PO-1005",
    supplier: "Mid-Missouri Plumbing",
    project: "Columbia Public Library Upgrade",
    status: "Closed",
    total: "$3,950.00",
    created_by: "Sarah Lee",
    updated_by: "Sarah Lee",
    created_at: "2024-01-18T08:30:00Z",
    updated_at: "2024-01-20T10:00:00Z",
  },
  {
    id: "PO-1006",
    order_id: "PO-1006",
    supplier: "Gateway Paint & Supply",
    project: "Rock Bridge High School Gym",
    status: "Open",
    total: "$2,800.00",
    created_by: "David Kim",
    updated_by: "David Kim",
    created_at: "2024-03-05T15:10:00Z",
    updated_at: "2024-03-06T16:20:00Z",
  },
  {
    id: "PO-1007",
    order_id: "PO-1007",
    supplier: "Central Missouri Glass",
    project: "Columbia Mall Storefronts",
    status: "Closed",
    total: "$7,600.00",
    created_by: "Anna White",
    updated_by: "Anna White",
    created_at: "2024-02-01T12:00:00Z",
    updated_at: "2024-02-03T09:30:00Z",
  },
  {
    id: "PO-1008",
    order_id: "PO-1008",
    supplier: "Boone County Lumber",
    project: "Flat Branch Park Bridge",
    status: "Open",
    total: "$9,100.00",
    created_by: "Chris Evans",
    updated_by: "Chris Evans",
    created_at: "2024-04-10T10:45:00Z",
    updated_at: "2024-04-11T11:15:00Z",
  },
  {
    id: "PO-1009",
    order_id: "PO-1009",
    supplier: "Columbia Flooring Pros",
    project: "Forum Shopping Center Remodel",
    status: "Closed",
    total: "$5,300.00",
    created_by: "Lisa Green",
    updated_by: "Lisa Green",
    created_at: "2024-03-25T13:00:00Z",
    updated_at: "2024-03-27T14:30:00Z",
  },
  {
    id: "PO-1010",
    order_id: "PO-1010",
    supplier: "Midwest Safety Equipment",
    project: "Fire Station #3 Modernization",
    status: "Open",
    total: "$4,750.00",
    created_by: "Brian Hall",
    updated_by: "Brian Hall",
    created_at: "2024-05-03T09:20:00Z",
    updated_at: "2024-05-04T10:40:00Z",
  },
];

type PurchaseOrderRow = (typeof mockPurchaseOrders)[number];

export default function PurchaseOrdersPage() {
  const [statusFilter, setStatusFilter] = React.useState("All Statuses");
  const [searchTerm, setSearchTerm] = React.useState("");

  // Filtering logic
  const filteredRows = React.useMemo(() => {
    let filtered = mockPurchaseOrders;
    if (statusFilter !== "All Statuses") {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }
    if (!searchTerm) return filtered;
    const lower = searchTerm.toLowerCase();
    return filtered.filter((row) =>
      Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
    );
  }, [searchTerm, statusFilter]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "Order #", width: 120 },
    { field: "supplier", headerName: "Supplier", flex: 2, minWidth: 180 },
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
        if (!params.value) return "";
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
        if (!params.value) return "";
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

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={1}>
          <Typography variant="h1">Purchase Orders</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none", fontWeight: 600 }}
            disabled
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
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 140 }}
            data-testid="purchase-order-status-filter"
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
          <div data-testid="purchase-order-list" style={{ height: "100%" }}>
            <DataGridPremium
              columns={columns}
              rows={filteredRows}
              loading={false}
              disableRowSelectionOnClick
              hideFooter
              getRowId={(row: PurchaseOrderRow) => row.id}
              initialState={{
                pinnedColumns: { left: ["id"] },
              }}
              sx={{
                cursor: "pointer",
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
              getRowClassName={() => "purchase-order-list-item"}
              // No row click for now
            />
          </div>
        </Box>
      </Container>
    </PageContainer>
  );
}
