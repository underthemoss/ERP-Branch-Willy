"use client";

import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";

// --- Mock Data Types ---
type Workflow = {
  id: string;
  name: string;
  columns: {
    id: string;
    label: string;
    color: string;
  }[];
};

type Ticket = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  customer: string;
  workflowId: string | null; // null = backlog
  status: string; // column id if in workflow, "" if in backlog
};

// --- Mock Data ---
const workflows: Workflow[] = [
  {
    id: "wf1",
    name: "Kansas Rentals",
    columns: [
      { id: "todo1", label: "TODO", color: "#1976d2" },
      { id: "doing1", label: "DOING", color: "#fbc02d" },
      { id: "done1", label: "DONE", color: "#388e3c" },
    ],
  },
  {
    id: "wf2",
    name: "Arrowhead Rentals",
    columns: [
      { id: "todo2", label: "TODO", color: "#1976d2" },
      { id: "doing2", label: "DOING", color: "#fbc02d" },
      { id: "done2", label: "DONE", color: "#388e3c" },
    ],
  },
  {
    id: "wf3",
    name: "Warehouse",
    columns: [
      { id: "todo3", label: "TODO", color: "#1976d2" },
      { id: "doing3", label: "DOING", color: "#fbc02d" },
      { id: "done3", label: "DONE", color: "#388e3c" },
    ],
  },
];

const assignees = ["Alex Johnson", "Maria Lopez", "Chris Evans", "Lisa Green"];
const customers = ["Kansas Rentals", "Arrowhead Rentals", "Warehouse"];

const initialTickets: Ticket[] = [
  {
    id: "t1",
    title: "SKID STEER",
    description: "Move to Kansas Rentals",
    assignee: "Alex Johnson",
    customer: "Kansas Rentals",
    workflowId: null,
    status: "",
  },
  {
    id: "t2",
    title: "GENIE LIFT",
    description: "Inspect for Arrowhead Rentals",
    assignee: "Maria Lopez",
    customer: "Arrowhead Rentals",
    workflowId: null,
    status: "",
  },
  {
    id: "t3",
    title: "FORKLIFT",
    description: "Warehouse transfer",
    assignee: "Chris Evans",
    customer: "Warehouse",
    workflowId: null,
    status: "",
  },
  {
    id: "t4",
    title: "SKID STEER",
    description: "Doing in Kansas Rentals",
    assignee: "Lisa Green",
    customer: "Kansas Rentals",
    workflowId: "wf1",
    status: "doing1",
  },
  {
    id: "t5",
    title: "SKID STEER",
    description: "Doing in Warehouse",
    assignee: "Chris Evans",
    customer: "Warehouse",
    workflowId: "wf3",
    status: "todo3",
  },
  {
    id: "t6",
    title: "SKID STEER",
    description: "Doing in Warehouse",
    assignee: "Chris Evans",
    customer: "Warehouse",
    workflowId: "wf3",
    status: "doing3",
  },
];

// --- Helper Functions ---
function getBacklogTickets(tickets: Ticket[]) {
  return tickets.filter((t) => t.workflowId === null);
}
function getWorkflowTickets(tickets: Ticket[], workflowId: string, columnId: string) {
  return tickets.filter((t) => t.workflowId === workflowId && t.status === columnId);
}

// --- Main Component ---
export default function FulfillmentPage() {
  const [tickets, setTickets] = React.useState<Ticket[]>(initialTickets);
  const [assigneeFilter, setAssigneeFilter] = React.useState<string[]>([]);
  const [customerFilter, setCustomerFilter] = React.useState<string[]>([]);
  const [workflowFilter, setWorkflowFilter] = React.useState<string[]>([]);
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  // --- Filtering Logic ---
  const filteredTickets = React.useMemo(() => {
    let filtered = tickets;
    if (assigneeFilter.length > 0) {
      filtered = filtered.filter((t) => assigneeFilter.includes(t.assignee));
    }
    if (customerFilter.length > 0) {
      filtered = filtered.filter((t) => customerFilter.includes(t.customer));
    }
    if (workflowFilter.length > 0) {
      filtered = filtered.filter(
        (t) =>
          (t.workflowId === null && workflowFilter.includes("backlog")) ||
          workflowFilter.includes(t.workflowId ?? ""),
      );
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) => t.title.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower),
      );
    }
    return filtered;
  }, [tickets, assigneeFilter, customerFilter, workflowFilter, searchTerm]);

  // --- DND Logic ---
  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;

    setTickets((prev) => {
      const ticket = prev.find((t) => t.id === draggableId);
      if (!ticket) return prev;

      // Remove from old location
      let newTickets = prev.filter((t) => t.id !== draggableId);

      // Determine new workflowId and status
      if (destination.droppableId === "backlog") {
        // Move to backlog
        newTickets = [...newTickets, { ...ticket, workflowId: null, status: "" }];
      } else {
        // destination.droppableId = workflowId:columnId
        const [workflowId, columnId] = destination.droppableId.split(":");
        newTickets = [...newTickets, { ...ticket, workflowId, status: columnId }];
      }
      return newTickets;
    });
  }

  // --- Render ---
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Title and Subtitle */}
      <Typography variant="h1" fontWeight={700} mb={1}>
        Fulfillment
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" mb={3}>
        Manage and fulfill tickets across workflows.
      </Typography>

      {/* Filter Bar */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
        <TextField
          placeholder="Search tickets"
          variant="outlined"
          size="small"
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
          sx={{ minWidth: 220 }}
        />
        <Select
          size="small"
          multiple
          displayEmpty
          value={assigneeFilter}
          onChange={(e) =>
            setAssigneeFilter(
              typeof e.target.value === "string" ? [e.target.value] : (e.target.value as string[]),
            )
          }
          renderValue={(selected) =>
            selected.length === 0 ? "Assignee" : (selected as string[]).join(", ")
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">
            <em>All Assignees</em>
          </MenuItem>
          {assignees.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          multiple
          displayEmpty
          value={customerFilter}
          onChange={(e) =>
            setCustomerFilter(
              typeof e.target.value === "string" ? [e.target.value] : (e.target.value as string[]),
            )
          }
          renderValue={(selected) =>
            selected.length === 0 ? "Customer" : (selected as string[]).join(", ")
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">
            <em>All Customers</em>
          </MenuItem>
          {customers.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          multiple
          displayEmpty
          value={workflowFilter}
          onChange={(e) =>
            setWorkflowFilter(
              typeof e.target.value === "string" ? [e.target.value] : (e.target.value as string[]),
            )
          }
          renderValue={(selected) => {
            if (selected.length === 0) return "Workflow";
            return (selected as string[])
              .map((wf) =>
                wf === "backlog" ? "Backlog" : (workflows.find((w) => w.id === wf)?.name ?? wf),
              )
              .join(", ");
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">
            <em>All Workflows</em>
          </MenuItem>
          <MenuItem value="backlog">Backlog</MenuItem>
          {workflows.map((w) => (
            <MenuItem key={w.id} value={w.id}>
              {w.name}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Main Layout: Backlog + Kanban Swimlanes */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Grid container spacing={3} alignItems="flex-start">
          {/* Backlog */}
          <Grid size={{ xs: 12, md: 2 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                minHeight: 600,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                bgcolor: "#f7f7f8",
                borderRadius: 3,
              }}
            >
              <Typography variant="h6" mb={2}>
                Backlog
              </Typography>
              <Droppable droppableId="backlog" direction="vertical">
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      width: "100%",
                      minHeight: 500,
                      background: snapshot.isDraggingOver ? "#e3f2fd" : undefined,
                      transition: "background 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    {getBacklogTickets(filteredTickets).map((ticket, idx) => (
                      <Draggable draggableId={ticket.id} index={idx} key={ticket.id}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              mb: 2,
                              boxShadow: snapshot.isDragging ? 6 : 2,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                              cursor: "grab",
                              borderLeft: "6px solid #1976d2",
                            }}
                          >
                            <CardContent>
                              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                {ticket.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {ticket.description}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Assignee:</strong> {ticket.assignee}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Customer:</strong> {ticket.customer}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {ticket.id}
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

          {/* Kanban Swimlanes */}
          <Grid size={{ xs: 12, md: 10 }}>
            <Box display="flex" flexDirection="column" gap={4}>
              {workflows.map((workflow) => (
                <Paper
                  key={workflow.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: "#f7f7f8",
                    borderRadius: 3,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>
                    {workflow.name}
                  </Typography>
                  <Grid container spacing={2}>
                    {workflow.columns.map((col) => (
                      <Grid size={{ xs: 12, md: 4 }} key={col.id}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 1,
                            minHeight: 180,
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            mb={1}
                            sx={{
                              textAlign: "center",
                              letterSpacing: 1,
                            }}
                          >
                            {col.label}
                          </Typography>
                          <Droppable droppableId={`${workflow.id}:${col.id}`} direction="vertical">
                            {(provided, snapshot) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                sx={{
                                  minHeight: 120,
                                  background: snapshot.isDraggingOver ? "#e3f2fd" : undefined,
                                  transition: "background 0.2s",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 2,
                                }}
                              >
                                {getWorkflowTickets(filteredTickets, workflow.id, col.id).map(
                                  (ticket, idx) => (
                                    <Draggable draggableId={ticket.id} index={idx} key={ticket.id}>
                                      {(provided, snapshot) => (
                                        <Card
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          sx={{
                                            mb: 2,
                                            boxShadow: snapshot.isDragging ? 6 : 2,
                                            opacity: snapshot.isDragging ? 0.8 : 1,
                                            cursor: "grab",
                                            borderLeft: `6px solid ${col.color}`,
                                          }}
                                        >
                                          <CardContent>
                                            <Box
                                              display="flex"
                                              alignItems="center"
                                              justifyContent="space-between"
                                            >
                                              <Typography variant="subtitle1" fontWeight={600}>
                                                {ticket.title}
                                              </Typography>
                                              <Chip
                                                label={col.label}
                                                size="small"
                                                sx={{ fontWeight: 600 }}
                                              />
                                            </Box>
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                              gutterBottom
                                            >
                                              {ticket.description}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                              <strong>Assignee:</strong> {ticket.assignee}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                              <strong>Customer:</strong> {ticket.customer}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                              {ticket.id}
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
                </Paper>
              ))}
            </Box>
          </Grid>
        </Grid>
      </DragDropContext>
    </Container>
  );
}
