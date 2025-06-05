"use client";

import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import { PageContainer } from "@toolpad/core/PageContainer";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import * as React from "react";

type PurchaseOrder = {
  id: string;
  description: string;
  vendor: string;
  requested_by: string;
  status: "Open" | "In Progress" | "Closed";
  priority: "High" | "Medium" | "Low";
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-1001",
    description: "Order 50 cubic yards of concrete for foundation pour",
    vendor: "Columbia Ready Mix",
    requested_by: "Alex Johnson",
    status: "Open",
    priority: "High",
    created_by: "Jane Smith",
    updated_by: "Alex Johnson",
    created_at: "2024-05-01T08:00:00Z",
    updated_at: "2024-05-01T12:30:00Z",
  },
  {
    id: "PO-1002",
    description: "Purchase 2000 ft of rebar for parking garage",
    vendor: "Steel Supply Co.",
    requested_by: "Maria Lopez",
    status: "In Progress",
    priority: "Medium",
    created_by: "John Doe",
    updated_by: "Maria Lopez",
    created_at: "2024-04-20T09:15:00Z",
    updated_at: "2024-04-21T10:45:00Z",
  },
  {
    id: "PO-1003",
    description: "Order 10 pallets of CMU blocks",
    vendor: "Masonry Depot",
    requested_by: "Chris Evans",
    status: "Open",
    priority: "Low",
    created_by: "Emily Clark",
    updated_by: "Chris Evans",
    created_at: "2024-03-15T10:00:00Z",
    updated_at: "2024-03-16T11:00:00Z",
  },
  {
    id: "PO-1004",
    description: "Purchase 5,000 sq ft of drywall",
    vendor: "Builders Supply",
    requested_by: "Lisa Green",
    status: "In Progress",
    priority: "Medium",
    created_by: "Michael Brown",
    updated_by: "Lisa Green",
    created_at: "2024-02-28T13:30:00Z",
    updated_at: "2024-03-01T09:45:00Z",
  },
  {
    id: "PO-1005",
    description: "Order 100 gallons of exterior paint",
    vendor: "Sherwin-Williams",
    requested_by: "David Kim",
    status: "Closed",
    priority: "High",
    created_by: "Sarah Lee",
    updated_by: "David Kim",
    created_at: "2024-01-22T07:45:00Z",
    updated_at: "2024-01-22T12:00:00Z",
  },
  {
    id: "PO-1006",
    description: "Purchase 20 LED high bay lights",
    vendor: "Lighting Solutions",
    requested_by: "Anna White",
    status: "Open",
    priority: "Low",
    created_by: "Chris Evans",
    updated_by: "Anna White",
    created_at: "2024-03-10T14:20:00Z",
    updated_at: "2024-03-12T09:10:00Z",
  },
  {
    id: "PO-1007",
    description: "Order 15 HVAC units for office building",
    vendor: "HVAC Direct",
    requested_by: "Brian Hall",
    status: "Closed",
    priority: "Medium",
    created_by: "Emily Clark",
    updated_by: "Brian Hall",
    created_at: "2024-02-05T11:00:00Z",
    updated_at: "2024-02-06T13:45:00Z",
  },
  {
    id: "PO-1008",
    description: "Purchase 5000 sq ft of carpet tiles",
    vendor: "Flooring Warehouse",
    requested_by: "Sarah Lee",
    status: "In Progress",
    priority: "High",
    created_by: "Michael Brown",
    updated_by: "Sarah Lee",
    created_at: "2024-04-10T10:45:00Z",
    updated_at: "2024-04-11T11:15:00Z",
  },
  {
    id: "PO-1009",
    description: "Order 10 portable toilets for site",
    vendor: "Site Services Inc.",
    requested_by: "David Kim",
    status: "Closed",
    priority: "Low",
    created_by: "Lisa Green",
    updated_by: "David Kim",
    created_at: "2024-03-25T13:00:00Z",
    updated_at: "2024-03-27T14:30:00Z",
  },
  {
    id: "PO-1010",
    description: "Purchase 100 safety helmets",
    vendor: "Safety First",
    requested_by: "Anna White",
    status: "Open",
    priority: "Medium",
    created_by: "Brian Hall",
    updated_by: "Anna White",
    created_at: "2024-05-03T09:20:00Z",
    updated_at: "2024-05-04T10:40:00Z",
  },
  {
    id: "PO-1011",
    description: "Order 20 fire extinguishers",
    vendor: "FireSafe Supplies",
    requested_by: "Alex Johnson",
    status: "In Progress",
    priority: "High",
    created_by: "Jane Smith",
    updated_by: "Alex Johnson",
    created_at: "2024-05-05T08:00:00Z",
    updated_at: "2024-05-05T12:30:00Z",
  },
  {
    id: "PO-1012",
    description: "Purchase 500 ft of copper piping",
    vendor: "Plumbing Pros",
    requested_by: "Maria Lopez",
    status: "Closed",
    priority: "Medium",
    created_by: "John Doe",
    updated_by: "Maria Lopez",
    created_at: "2024-04-22T09:15:00Z",
    updated_at: "2024-04-22T10:45:00Z",
  },
  {
    id: "PO-1013",
    description: "Order 8 commercial doors",
    vendor: "Door & Frame Co.",
    requested_by: "Chris Evans",
    status: "Open",
    priority: "Low",
    created_by: "Emily Clark",
    updated_by: "Chris Evans",
    created_at: "2024-03-18T10:00:00Z",
    updated_at: "2024-03-18T11:00:00Z",
  },
  {
    id: "PO-1014",
    description: "Purchase 1000 sq ft of acoustic ceiling tiles",
    vendor: "Ceiling Solutions",
    requested_by: "Lisa Green",
    status: "In Progress",
    priority: "Medium",
    created_by: "Michael Brown",
    updated_by: "Lisa Green",
    created_at: "2024-02-28T13:30:00Z",
    updated_at: "2024-03-01T09:45:00Z",
  },
  {
    id: "PO-1015",
    description: "Order 30 gallons of primer",
    vendor: "Paint Depot",
    requested_by: "David Kim",
    status: "Closed",
    priority: "High",
    created_by: "Sarah Lee",
    updated_by: "David Kim",
    created_at: "2024-01-25T07:45:00Z",
    updated_at: "2024-01-25T12:00:00Z",
  },
  {
    id: "PO-1016",
    description: "Purchase 200 safety vests",
    vendor: "Safety First",
    requested_by: "Anna White",
    status: "Open",
    priority: "Low",
    created_by: "Chris Evans",
    updated_by: "Anna White",
    created_at: "2024-03-12T14:20:00Z",
    updated_at: "2024-03-12T15:10:00Z",
  },
  {
    id: "PO-1017",
    description: "Order 10 laser levels",
    vendor: "Surveyor's Choice",
    requested_by: "Brian Hall",
    status: "Closed",
    priority: "Medium",
    created_by: "Emily Clark",
    updated_by: "Brian Hall",
    created_at: "2024-02-10T11:00:00Z",
    updated_at: "2024-02-10T13:45:00Z",
  },
  {
    id: "PO-1018",
    description: "Purchase 1000 ft of electrical conduit",
    vendor: "Electrical Supply House",
    requested_by: "Sarah Lee",
    status: "In Progress",
    priority: "High",
    created_by: "Michael Brown",
    updated_by: "Sarah Lee",
    created_at: "2024-04-12T10:45:00Z",
    updated_at: "2024-04-12T11:15:00Z",
  },
  {
    id: "PO-1019",
    description: "Order 5 portable handwashing stations",
    vendor: "Site Services Inc.",
    requested_by: "David Kim",
    status: "Closed",
    priority: "Low",
    created_by: "Lisa Green",
    updated_by: "David Kim",
    created_at: "2024-03-28T13:00:00Z",
    updated_at: "2024-03-28T14:30:00Z",
  },
  {
    id: "PO-1020",
    description: "Purchase 4 heavy-duty wheelbarrows",
    vendor: "Tool Town",
    requested_by: "Anna White",
    status: "Open",
    priority: "Medium",
    created_by: "Brian Hall",
    updated_by: "Anna White",
    created_at: "2024-05-06T09:20:00Z",
    updated_at: "2024-05-06T10:40:00Z",
  },
];

const statusColumns = [
  { key: "Open", label: "Open", color: "success" },
  { key: "In Progress", label: "In Progress", color: "warning" },
  { key: "Closed", label: "Closed", color: "default" },
];

function groupByStatus(purchaseOrders: PurchaseOrder[]): {
  [K in PurchaseOrder["status"]]: PurchaseOrder[];
} {
  const grouped: { [K in PurchaseOrder["status"]]: PurchaseOrder[] } = {
    Open: [],
    "In Progress": [],
    Closed: [],
  };
  for (const po of purchaseOrders) {
    grouped[po.status].push(po);
  }
  return grouped;
}

export default function PurchaseOrdersKanbanPage() {
  const [purchaseOrders, setPurchaseOrders] =
    React.useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [statusFilter, setStatusFilter] = React.useState<PurchaseOrder["status"][]>([]);
  const [requestedByFilter, setRequestedByFilter] = React.useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = React.useState<PurchaseOrder["priority"][]>([]);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [view, setView] = React.useState<"kanban" | "list">("kanban");

  // Get unique requested_by values for filter dropdown
  const requestedByOptions = React.useMemo(() => {
    const set = new Set<string>();
    purchaseOrders.forEach((po) => set.add(po.requested_by));
    return Array.from(set).sort();
  }, [purchaseOrders]);

  // Filtering logic (shared for both views)
  const filteredRows = React.useMemo(() => {
    let filtered = purchaseOrders;
    if (statusFilter.length > 0) {
      filtered = filtered.filter((row) => statusFilter.includes(row.status));
    }
    if (requestedByFilter.length > 0) {
      filtered = filtered.filter((row) => requestedByFilter.includes(row.requested_by));
    }
    if (priorityFilter.length > 0) {
      filtered = filtered.filter((row) => priorityFilter.includes(row.priority));
    }
    if (!searchTerm) return filtered;
    const lower = searchTerm.toLowerCase();
    return filtered.filter((row) =>
      Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
    );
  }, [purchaseOrders, searchTerm, statusFilter, requestedByFilter, priorityFilter]);

  // Kanban grouping
  const grouped = groupByStatus(filteredRows);

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    // Find the purchase order
    const po = purchaseOrders.find((p) => p.id === draggableId);
    if (!po) return;

    // Remove from old status
    const newPurchaseOrders = purchaseOrders.filter((p) => p.id !== draggableId);

    // Insert into new status at destination.index
    const updatedPO = { ...po, status: destination.droppableId as PurchaseOrder["status"] };
    const destList = newPurchaseOrders.filter((p) => p.status === destination.droppableId);
    destList.splice(destination.index, 0, updatedPO);

    // Rebuild the full list, preserving order in other columns
    const rebuilt: PurchaseOrder[] = [];
    for (const col of statusColumns) {
      if (col.key === destination.droppableId) {
        rebuilt.push(...destList);
      } else {
        rebuilt.push(...newPurchaseOrders.filter((p) => p.status === col.key));
      }
    }
    setPurchaseOrders(rebuilt);
  }

  // Table columns
  const columns: GridColDef[] = [
    { field: "id", headerName: "PO #", width: 120 },
    { field: "description", headerName: "Description", flex: 2, minWidth: 180 },
    { field: "vendor", headerName: "Vendor", flex: 2, minWidth: 180 },
    { field: "requested_by", headerName: "Requested By", width: 140 },
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
        ) : params.value === "In Progress" ? (
          <Chip label="In Progress" color="warning" size="small" sx={{ fontWeight: 600 }} />
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
      <Container maxWidth="xl">
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
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, val) => val && setView(val)}
            size="small"
            sx={{ mr: 2 }}
          >
            <ToggleButton value="kanban" data-testid="toggle-kanban">
              <ViewKanbanIcon />
            </ToggleButton>
            <ToggleButton value="list" data-testid="toggle-list">
              <TableRowsIcon />
            </ToggleButton>
          </ToggleButtonGroup>
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
            multiple
            displayEmpty
            value={statusFilter}
            onChange={(e) => {
              const value = e.target.value;
              setStatusFilter(
                typeof value === "string"
                  ? value === ""
                    ? []
                    : [value as PurchaseOrder["status"]]
                  : (value as PurchaseOrder["status"][]),
              );
            }}
            renderValue={(selected) => {
              if (!selected || (Array.isArray(selected) && selected.length === 0)) {
                return "All Statuses";
              }
              return (selected as string[]).join(", ");
            }}
            sx={{ minWidth: 180 }}
            data-testid="purchase-order-status-filter"
            MenuProps={{
              MenuListProps: {
                dense: true,
              },
            }}
          >
            <MenuItem value="">
              <em>All Statuses</em>
            </MenuItem>
            <MenuItem value="Open">Open</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
          </Select>
          <Select
            size="small"
            multiple
            displayEmpty
            value={requestedByFilter}
            onChange={(e) => {
              const value = e.target.value;
              setRequestedByFilter(
                typeof value === "string" ? (value === "" ? [] : [value]) : (value as string[]),
              );
            }}
            renderValue={(selected) => {
              if (!selected || (Array.isArray(selected) && selected.length === 0)) {
                return "All Requesters";
              }
              return (selected as string[]).join(", ");
            }}
            sx={{ minWidth: 180 }}
            data-testid="purchase-order-requestedby-filter"
            MenuProps={{
              MenuListProps: {
                dense: true,
              },
            }}
          >
            <MenuItem value="">
              <em>All Requesters</em>
            </MenuItem>
            {requestedByOptions.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            multiple
            displayEmpty
            value={priorityFilter}
            onChange={(e) => {
              const value = e.target.value;
              setPriorityFilter(
                typeof value === "string"
                  ? value === ""
                    ? []
                    : [value as PurchaseOrder["priority"]]
                  : (value as PurchaseOrder["priority"][]),
              );
            }}
            renderValue={(selected) => {
              if (!selected || (Array.isArray(selected) && selected.length === 0)) {
                return "All Priorities";
              }
              return (selected as string[]).join(", ");
            }}
            sx={{ minWidth: 180 }}
            data-testid="purchase-order-priority-filter"
            MenuProps={{
              MenuListProps: {
                dense: true,
              },
            }}
          >
            <MenuItem value="">
              <em>All Priorities</em>
            </MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
          </Select>
        </Box>
        {view === "list" ? (
          <Box sx={{ height: 600 }}>
            <div data-testid="purchase-order-list" style={{ height: "100%" }}>
              <DataGridPremium
                columns={columns}
                rows={filteredRows}
                loading={false}
                disableRowSelectionOnClick
                hideFooter
                getRowId={(row: PurchaseOrder) => row.id}
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
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Grid container spacing={3}>
              {statusColumns.map((col) => (
                <Grid size={{ xs: 12, md: 4 }} key={col.key}>
                  <Paper elevation={3} sx={{ p: 2, minHeight: 600, bgcolor: "#f8f9fa" }}>
                    <Typography variant="h6" mb={2}>
                      {col.label}
                    </Typography>
                    <Droppable droppableId={col.key}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{
                            minHeight: 550,
                            transition: "background 0.2s",
                            background: snapshot.isDraggingOver ? "#e3f2fd" : undefined,
                          }}
                        >
                          {grouped[col.key as PurchaseOrder["status"]].map(
                            (po: PurchaseOrder, idx: number) => (
                              <Draggable draggableId={po.id} index={idx} key={po.id}>
                                {(provided, snapshot) => (
                                  <Card
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    sx={{
                                      mb: 2,
                                      borderLeft: `6px solid ${
                                        po.priority === "High"
                                          ? "#d32f2f"
                                          : po.priority === "Medium"
                                            ? "#ed6c02"
                                            : "#1976d2"
                                      }`,
                                      boxShadow: snapshot.isDragging ? 6 : 2,
                                      opacity: snapshot.isDragging ? 0.8 : 1,
                                    }}
                                  >
                                    <CardContent>
                                      <Box
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="space-between"
                                      >
                                        <Typography variant="subtitle1" fontWeight={600}>
                                          {po.description}
                                        </Typography>
                                        <Chip
                                          label={po.priority}
                                          color={
                                            po.priority === "High"
                                              ? "error"
                                              : po.priority === "Medium"
                                                ? "warning"
                                                : "primary"
                                          }
                                          size="small"
                                          sx={{ fontWeight: 600 }}
                                        />
                                      </Box>
                                      <Typography variant="body2" color="text.secondary" mt={1}>
                                        <strong>Vendor:</strong> {po.vendor}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Requested By:</strong> {po.requested_by}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {po.id}
                                      </Typography>
                                    </CardContent>
                                  </Card>
                                )}
                              </Draggable>
                            ),
                          )}
                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DragDropContext>
        )}
      </Container>
    </PageContainer>
  );
}
