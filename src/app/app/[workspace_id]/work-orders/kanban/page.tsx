"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { PageContainer } from "@toolpad/core/PageContainer";
import * as React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

type WorkOrder = {
  id: string;
  description: string;
  location: string;
  assigned_to: string;
  status: "Open" | "In Progress" | "Closed";
  priority: "High" | "Medium" | "Low";
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

const initialWorkOrders: WorkOrder[] = [
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
    status: "In Progress",
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
    status: "In Progress",
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
    status: "In Progress",
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
    status: "In Progress",
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
    status: "In Progress",
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
    status: "In Progress",
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

const statusColumns = [
  { key: "Open", label: "Open", color: "success" },
  { key: "In Progress", label: "In Progress", color: "warning" },
  { key: "Closed", label: "Closed", color: "default" },
];

function groupByStatus(
  workOrders: WorkOrder[]
): { [K in WorkOrder["status"]]: WorkOrder[] } {
  const grouped: { [K in WorkOrder["status"]]: WorkOrder[] } = {
    Open: [],
    "In Progress": [],
    Closed: [],
  };
  for (const wo of workOrders) {
    grouped[wo.status].push(wo);
  }
  return grouped;
}

export default function WorkOrdersKanbanPage() {
  const [workOrders, setWorkOrders] = React.useState<WorkOrder[]>(initialWorkOrders);
  const [statusFilter, setStatusFilter] = React.useState<string>("All Statuses");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [view, setView] = React.useState<"kanban" | "list">("kanban");

  // Filtering logic (shared for both views)
  const filteredRows = React.useMemo(() => {
    let filtered = workOrders;
    if (statusFilter !== "All Statuses") {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }
    if (!searchTerm) return filtered;
    const lower = searchTerm.toLowerCase();
    return filtered.filter((row) =>
      Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
    );
  }, [workOrders, searchTerm, statusFilter]);

  // Kanban grouping
  const grouped = groupByStatus(filteredRows);

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    // Find the work order
    const wo = workOrders.find((w) => w.id === draggableId);
    if (!wo) return;

    // Remove from old status
    const newWorkOrders = workOrders.filter((w) => w.id !== draggableId);

    // Insert into new status at destination.index
    const updatedWO = { ...wo, status: destination.droppableId as WorkOrder["status"] };
    const destList = newWorkOrders.filter((w) => w.status === destination.droppableId);
    destList.splice(destination.index, 0, updatedWO);

    // Rebuild the full list, preserving order in other columns
    const rebuilt: WorkOrder[] = [];
    for (const col of statusColumns) {
      if (col.key === destination.droppableId) {
        rebuilt.push(...destList);
      } else {
        rebuilt.push(...newWorkOrders.filter((w) => w.status === col.key));
      }
    }
    setWorkOrders(rebuilt);
  }

  // Table columns
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
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Closed">Closed</MenuItem>
          </Select>
        </Box>
        {view === "list" ? (
          <Box sx={{ height: 600 }}>
            <div data-testid="work-order-list" style={{ height: "100%" }}>
              <DataGridPremium
                columns={columns}
                rows={filteredRows}
                loading={false}
                disableRowSelectionOnClick
                hideFooter
                getRowId={(row: WorkOrder) => row.id}
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
                          {grouped[col.key as WorkOrder["status"]].map((wo: WorkOrder, idx: number) => (
                            <Draggable draggableId={wo.id} index={idx} key={wo.id}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  sx={{
                                    mb: 2,
                                    borderLeft: `6px solid ${
                                      wo.priority === "High"
                                        ? "#d32f2f"
                                        : wo.priority === "Medium"
                                        ? "#ed6c02"
                                        : "#1976d2"
                                    }`,
                                    boxShadow: snapshot.isDragging ? 6 : 2,
                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                  }}
                                >
                                  <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                      <Typography variant="subtitle1" fontWeight={600}>
                                        {wo.description}
                                      </Typography>
                                      <Chip
                                        label={wo.priority}
                                        color={
                                          wo.priority === "High"
                                            ? "error"
                                            : wo.priority === "Medium"
                                            ? "warning"
                                            : "primary"
                                        }
                                        size="small"
                                        sx={{ fontWeight: 600 }}
                                      />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" mt={1}>
                                      <strong>Location:</strong> {wo.location}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      <strong>Assigned To:</strong> {wo.assigned_to}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {wo.id}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
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
