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
import * as React from "react";

// Mock data for work orders
const mockWorkOrders = [
  {
    id: "WO-2001",
    description: "Routine maintenance on CAT 320 Excavator",
    location: "Ashland Road Site",
    assigned_to: "Alex Johnson",
    status: "Open",
    priority: "High",
    created_by: "Jane Smith",
    updated_by: "Alex Johnson",
    created_at: "2024-05-01T08:00:00Z",
    updated_at: "2024-05-01T12:30:00Z",
  },
  {
    id: "WO-2002",
    description: "Move Genie S-65 Boom Lift to Broadway Apartments",
    location: "Equipment Yard",
    assigned_to: "Maria Lopez",
    status: "Closed",
    priority: "Medium",
    created_by: "John Doe",
    updated_by: "Maria Lopez",
    created_at: "2024-04-20T09:15:00Z",
    updated_at: "2024-04-21T10:45:00Z",
  },
  {
    id: "WO-2003",
    description: "Refuel and inspect John Deere Loader",
    location: "Forum Shopping Center Expansion",
    assigned_to: "Chris Evans",
    status: "Open",
    priority: "Low",
    created_by: "Emily Clark",
    updated_by: "Chris Evans",
    created_at: "2024-03-15T10:00:00Z",
    updated_at: "2024-03-16T11:00:00Z",
  },
  {
    id: "WO-2004",
    description: "Replace hydraulic hoses on Bobcat Skid Steer",
    location: "Boone Hospital Parking Garage",
    assigned_to: "Lisa Green",
    status: "Open",
    priority: "Medium",
    created_by: "Michael Brown",
    updated_by: "Lisa Green",
    created_at: "2024-02-28T13:30:00Z",
    updated_at: "2024-03-01T09:45:00Z",
  },
  {
    id: "WO-2005",
    description: "Deliver 20 bags of Portland cement",
    location: "Stephens Lake Park Pavilion",
    assigned_to: "David Kim",
    status: "Closed",
    priority: "High",
    created_by: "Sarah Lee",
    updated_by: "David Kim",
    created_at: "2024-01-22T07:45:00Z",
    updated_at: "2024-01-22T12:00:00Z",
  },
  {
    id: "WO-2006",
    description: "Rent out Kubota Mini Excavator to City Utilities",
    location: "Equipment Rental Office",
    assigned_to: "Anna White",
    status: "Open",
    priority: "Low",
    created_by: "Chris Evans",
    updated_by: "Anna White",
    created_at: "2024-03-10T14:20:00Z",
    updated_at: "2024-03-12T09:10:00Z",
  },
  {
    id: "WO-2007",
    description: "Replace worn out teeth on Komatsu Dozer blade",
    location: "Rock Bridge High School Gym",
    assigned_to: "Brian Hall",
    status: "Closed",
    priority: "Medium",
    created_by: "Emily Clark",
    updated_by: "Brian Hall",
    created_at: "2024-02-05T11:00:00Z",
    updated_at: "2024-02-06T13:45:00Z",
  },
  {
    id: "WO-2008",
    description: "Inspect and lubricate tower crane cables",
    location: "Downtown Office Tower",
    assigned_to: "Sarah Lee",
    status: "Open",
    priority: "High",
    created_by: "Michael Brown",
    updated_by: "Sarah Lee",
    created_at: "2024-04-10T10:45:00Z",
    updated_at: "2024-04-11T11:15:00Z",
  },
  {
    id: "WO-2009",
    description: "Restock diesel fuel for all site generators",
    location: "Columbia Mall Expansion",
    assigned_to: "David Kim",
    status: "Closed",
    priority: "Low",
    created_by: "Lisa Green",
    updated_by: "David Kim",
    created_at: "2024-03-25T13:00:00Z",
    updated_at: "2024-03-27T14:30:00Z",
  },
  {
    id: "WO-2010",
    description: "Move JLG Telehandler to Flat Branch Park Bridge",
    location: "Equipment Yard",
    assigned_to: "Anna White",
    status: "Open",
    priority: "Medium",
    created_by: "Brian Hall",
    updated_by: "Anna White",
    created_at: "2024-05-03T09:20:00Z",
    updated_at: "2024-05-04T10:40:00Z",
  },
  {
    id: "WO-2011",
    description: "Replace air filters on all site compressors",
    location: "Mizzou Science Building Renovation",
    assigned_to: "Alex Johnson",
    status: "Open",
    priority: "High",
    created_by: "Jane Smith",
    updated_by: "Alex Johnson",
    created_at: "2024-05-05T08:00:00Z",
    updated_at: "2024-05-05T12:30:00Z",
  },
  {
    id: "WO-2012",
    description: "Deliver 100 ft extension cords to jobsite",
    location: "Boone County Courthouse",
    assigned_to: "Maria Lopez",
    status: "Closed",
    priority: "Medium",
    created_by: "John Doe",
    updated_by: "Maria Lopez",
    created_at: "2024-04-22T09:15:00Z",
    updated_at: "2024-04-22T10:45:00Z",
  },
  {
    id: "WO-2013",
    description: "Inspect and test backup generators",
    location: "Fire Station #3",
    assigned_to: "Chris Evans",
    status: "Open",
    priority: "Low",
    created_by: "Emily Clark",
    updated_by: "Chris Evans",
    created_at: "2024-03-18T10:00:00Z",
    updated_at: "2024-03-18T11:00:00Z",
  },
  {
    id: "WO-2014",
    description: "Move scissor lift to Columbia Public Library",
    location: "Equipment Yard",
    assigned_to: "Lisa Green",
    status: "Open",
    priority: "Medium",
    created_by: "Michael Brown",
    updated_by: "Lisa Green",
    created_at: "2024-02-28T13:30:00Z",
    updated_at: "2024-03-01T09:45:00Z",
  },
  {
    id: "WO-2015",
    description: "Replace broken LED work lights",
    location: "Forum Shopping Center Remodel",
    assigned_to: "David Kim",
    status: "Closed",
    priority: "High",
    created_by: "Sarah Lee",
    updated_by: "David Kim",
    created_at: "2024-01-25T07:45:00Z",
    updated_at: "2024-01-25T12:00:00Z",
  },
  {
    id: "WO-2016",
    description: "Restock PPE (hard hats, gloves, vests)",
    location: "Warehouse A",
    assigned_to: "Anna White",
    status: "Open",
    priority: "Low",
    created_by: "Chris Evans",
    updated_by: "Anna White",
    created_at: "2024-03-12T14:20:00Z",
    updated_at: "2024-03-12T15:10:00Z",
  },
  {
    id: "WO-2017",
    description: "Service and calibrate laser level equipment",
    location: "Downtown Parking Garage",
    assigned_to: "Brian Hall",
    status: "Closed",
    priority: "Medium",
    created_by: "Emily Clark",
    updated_by: "Brian Hall",
    created_at: "2024-02-10T11:00:00Z",
    updated_at: "2024-02-10T13:45:00Z",
  },
  {
    id: "WO-2018",
    description: "Deliver rebar tying wire and cutters",
    location: "Boone Hospital Expansion",
    assigned_to: "Sarah Lee",
    status: "Open",
    priority: "High",
    created_by: "Michael Brown",
    updated_by: "Sarah Lee",
    created_at: "2024-04-12T10:45:00Z",
    updated_at: "2024-04-12T11:15:00Z",
  },
  {
    id: "WO-2019",
    description: "Move portable toilets to new site entrance",
    location: "Ashland Road Site",
    assigned_to: "David Kim",
    status: "Closed",
    priority: "Low",
    created_by: "Lisa Green",
    updated_by: "David Kim",
    created_at: "2024-03-28T13:00:00Z",
    updated_at: "2024-03-28T14:30:00Z",
  },
  {
    id: "WO-2020",
    description: "Replace worn out tires on dump truck",
    location: "Equipment Yard",
    assigned_to: "Anna White",
    status: "Open",
    priority: "Medium",
    created_by: "Brian Hall",
    updated_by: "Anna White",
    created_at: "2024-05-06T09:20:00Z",
    updated_at: "2024-05-06T10:40:00Z",
  },
];

type WorkOrderRow = (typeof mockWorkOrders)[number];

export default function WorkOrdersPage() {
  const [statusFilter, setStatusFilter] = React.useState("All Statuses");
  const [searchTerm, setSearchTerm] = React.useState("");

  // Filtering logic
  const filteredRows = React.useMemo(() => {
    let filtered = mockWorkOrders;
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
    { field: "description", headerName: "Description", flex: 2, minWidth: 180 },
    { field: "location", headerName: "Location", flex: 2, minWidth: 180 },
    { field: "assigned_to", headerName: "Assigned To", width: 140 },
    {
      field: "priority",
      headerName: "Priority",
      width: 100,
      renderCell: (params) =>
        params.value === "High" ? (
          <Chip label="High" color="error" size="small" sx={{ fontWeight: 600 }} />
        ) : params.value === "Medium" ? (
          <Chip label="Medium" color="warning" size="small" sx={{ fontWeight: 600 }} />
        ) : (
          <Chip label="Low" color="default" size="small" sx={{ fontWeight: 600 }} />
        ),
      sortable: false,
      filterable: false,
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) =>
        params.value === "Open" ? (
          <Chip label="Open" color="success" size="small" sx={{ fontWeight: 600 }} />
        ) : (
          <Chip label="Closed" color="default" size="small" sx={{ fontWeight: 600 }} />
        ),
      sortable: false,
      filterable: false,
    },
    { field: "created_by", headerName: "Created By", width: 120 },
    { field: "updated_by", headerName: "Updated By", width: 120 },
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
          <Typography variant="h1">Work Orders</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none", fontWeight: 600 }}
            disabled
          >
            + Create Work Order
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary" mb={2}>
          View, manage, and organize your work orders.
        </Typography>
        <Box mb={2} display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search work orders"
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
            data-testid="work-order-status-filter"
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
          <div data-testid="work-order-list" style={{ height: "100%" }}>
            <DataGridPremium
              columns={columns}
              rows={filteredRows}
              loading={false}
              disableRowSelectionOnClick
              hideFooter
              getRowId={(row: WorkOrderRow) => row.id}
              initialState={{
                pinnedColumns: { left: ["id"] },
              }}
              sx={{
                cursor: "pointer",
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
              getRowClassName={() => "work-order-list-item"}
              // No row click for now
            />
          </div>
        </Box>
      </Container>
    </PageContainer>
  );
}
