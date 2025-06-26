"use client";

import { graphql } from "@/graphql";
import {
  useListFulfilmentsFulfilmentDashboardPageQuery,
  useListWorkflowConfigurationsFulfilmentPageQuery,
} from "@/graphql/hooks";
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
import React, { useEffect } from "react";
import AutoSizer from "react-virtualized-auto-sizer";

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

type FulfilmentTicket = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  customer: string;
  workflowId: string | null; // null = backlog
  status: string; // column id if in workflow, "" if in backlog
};

graphql(`
  query ListFulfilmentsFulfilmentDashboardPage(
    $filter: ListFulfilmentsFilter
    $page: ListFulfilmentsPage
  ) {
    listFulfilments(filter: $filter, page: $page) {
      items {
        __typename
        ... on RentalFulfilment {
          id
          contact {
            __typename
            ... on BusinessContact {
              id
              name
            }
            ... on PersonContact {
              id
              name
            }
          }
          project {
            id
            name
            project_code
          }
          purchaseOrderNumber
          salesOrderId
          salesOrderType
          workflowId
          workflowColumnId
          createdAt
          updatedAt
          salesOrderLineItem {
            __typename
            ... on RentalSalesOrderLineItem {
              id
              price {
                __typename
                ... on RentalPrice {
                  id
                  name
                  pimCategory {
                    id
                    name
                  }
                  pimCategoryPath
                }
              }
            }
          }
          assignedTo {
            id
            firstName
            lastName
          }
        }
      }
    }
  }
`);

// Inline GQL query for codegen
graphql(`
  query ListWorkflowConfigurationsFulfilmentPage {
    listWorkflowConfigurations {
      items {
        id
        name
        columns {
          id
          name
        }
      }
    }
  }
`);

// --- Mock Data ---
// const workflows: Workflow[] = [ ... ] (REMOVED, now fetched from API)

const assignees = ["Alex Johnson", "Maria Lopez", "Chris Evans", "Lisa Green"];
const customers = ["Kansas Rentals", "Arrowhead Rentals", "Warehouse"];

const initialTickets: FulfilmentTicket[] = [
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
    workflowId: null,
    status: "",
  },
  {
    id: "t5",
    title: "SKID STEER",
    description: "Doing in Warehouse",
    assignee: "Chris Evans",
    customer: "Warehouse",
    workflowId: null,
    status: "",
  },
  {
    id: "t6",
    title: "SKID STEER",
    description: "Doing in Warehouse",
    assignee: "Chris Evans",
    customer: "Warehouse",
    workflowId: null,
    status: "",
  },
];

// --- Helper Functions ---
function getBacklogTickets(tickets: FulfilmentTicket[]) {
  return tickets.filter((t) => t.workflowId === null);
}
function getWorkflowTickets(tickets: FulfilmentTicket[], workflowId: string, columnId: string) {
  return tickets.filter((t) => t.workflowId === workflowId && t.status === columnId);
}

// --- Main Component ---
export default function FulfillmentDashboard() {
  const [tickets, setTickets] = React.useState<FulfilmentTicket[]>(initialTickets);
  const [assigneeFilter, setAssigneeFilter] = React.useState<string[]>([]);
  const [customerFilter, setCustomerFilter] = React.useState<string[]>([]);
  const [workflowFilter, setWorkflowFilter] = React.useState<string[]>([]);
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  // --- Fetch Workflows from API ---
  const {
    data,
    loading: workflowsLoading,
    error: workflowsError,
  } = useListWorkflowConfigurationsFulfilmentPageQuery({
    fetchPolicy: "cache-and-network",
  });
  const {
    data: fulfillments,
    loading: fulfillmentsLoading,
    error: fulfillmentsError,
  } = useListFulfilmentsFulfilmentDashboardPageQuery({
    fetchPolicy: "cache-and-network",
    variables: { page: { number: 1, size: 1000 }, filter: {} },
  });

  useEffect(() => {
    const tickets: FulfilmentTicket[] =
      fulfillments?.listFulfilments?.items
        .map((i) => {
          if (i.__typename === "RentalFulfilment")
            return {
              id: i.id,
              assignee: i.assignedTo?.firstName
                ? `${i.assignedTo?.firstName} ${i.assignedTo?.lastName}`
                : "Unassigned",
              customer: i.contact?.name || "",
              description:
                (i.salesOrderLineItem?.__typename === "RentalSalesOrderLineItem" &&
                  i.salesOrderLineItem.price?.__typename === "RentalPrice" &&
                  `${i.salesOrderLineItem.price.pimCategory?.name}`) ||
                "",
              status: "",
              title:
                (i.salesOrderLineItem?.__typename === "RentalSalesOrderLineItem" &&
                  i.salesOrderLineItem.price?.__typename === "RentalPrice" &&
                  `${i.salesOrderLineItem.price.name}`) ||
                "",
              workflowId: null,
            } satisfies FulfilmentTicket;
        })
        .filter(Boolean)
        .map((i) => i as FulfilmentTicket) || [];

    setTickets(tickets);
  }, [fulfillments]);

  // Map API data to expected workflow shape
  const workflows: Workflow[] =
    data?.listWorkflowConfigurations?.items?.map((wf) => ({
      id: wf.id,
      name: wf.name,
      columns:
        wf.columns?.map((col, idx) => ({
          id: col.id,
          label: col.name,
          // Assign a default color based on index if not present
          color: ["#1976d2", "#fbc02d", "#388e3c", "#d32f2f", "#7b1fa2"][idx % 5],
        })) ?? [],
    })) ?? [];

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
    <Box display={"flex"} flexDirection={"column"} flex={1}>
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
      <Box data-testid="kanban-dashboard" display={"flex"} flex={1}>
        <Box display={"flex"} flex={1} maxHeight={"100%"}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Box display={"flex"} flex={1} gap={1}>
              {/* Backlog */}

              <Box width={300} display={"flex"}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    display: "flex",
                    flex: 1,
                    flexDirection: "column",
                    alignItems: "center",
                    bgcolor: "#f7f7f8",
                    borderRadius: 3,
                  }}
                >
                  <Typography variant="h6" mb={2} sx={{ flexShrink: 0 }}>
                    Backlog
                  </Typography>
                  <Box display={"flex"} flex={1} flexDirection={"column"} sx={{ width: "100%" }}>
                    <AutoSizer>
                      {({ width, height }) => {
                        return (
                          <Box height={Math.max(height, 300)} width={width} overflow={"scroll"}>
                            <Droppable droppableId="backlog" direction="vertical">
                              {(provided, snapshot) => {
                                return (
                                  <Box
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{
                                      width: "100%",
                                      background: snapshot.isDraggingOver ? "#e3f2fd" : undefined,
                                      transition: "background 0.2s",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 1,
                                      overflowY: "auto",
                                      minHeight: height,
                                    }}
                                  >
                                    {getBacklogTickets(filteredTickets).map((ticket, idx) => (
                                      <Draggable
                                        draggableId={ticket.id}
                                        index={idx}
                                        key={ticket.id}
                                      >
                                        {(provided, snapshot) => (
                                          <Card
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            sx={{
                                              mb: 0,
                                              boxShadow: snapshot.isDragging ? 6 : 2,
                                              opacity: snapshot.isDragging ? 0.8 : 1,
                                              cursor: "grab",
                                              borderLeft: "6px solid #1976d2",
                                            }}
                                          >
                                            <CardContent>
                                              <Typography
                                                variant="subtitle1"
                                                fontWeight={600}
                                                gutterBottom
                                              >
                                                {ticket.title}
                                              </Typography>
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
                                            </CardContent>
                                          </Card>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </Box>
                                );
                              }}
                            </Droppable>
                          </Box>
                        );
                      }}
                    </AutoSizer>
                  </Box>
                </Paper>
              </Box>

              {/* Kanban Swimlanes */}
              <Box flex={1}>
                <AutoSizer>
                  {({ width, height }) => {
                    return (
                      <Box
                        display="flex"
                        flexDirection="column"
                        gap={1}
                        sx={{
                          flex: 1,
                          width,
                          height,
                          overflowY: "auto",
                        }}
                      >
                        {workflowsLoading ? (
                          <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                            Loading workflows...
                          </Typography>
                        ) : workflowsError ? (
                          <Typography variant="body1" color="error" sx={{ p: 2 }}>
                            Failed to load workflows.
                          </Typography>
                        ) : workflows.length === 0 ? (
                          <Typography variant="body1" color="text.secondary" sx={{ p: 2 }}>
                            No workflows found.
                          </Typography>
                        ) : (
                          workflows.map((workflow) => (
                            <Paper
                              key={workflow.id}
                              elevation={0}
                              sx={{
                                p: 2,
                                bgcolor: "#f7f7f8",
                                borderRadius: 3,
                                margin: 0,
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                                {workflow.name}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  gap: 1,
                                  overflowX: "auto",
                                  whiteSpace: "nowrap",
                                  pb: 1,
                                }}
                              >
                                {workflow.columns.map((col) => (
                                  <Box
                                    key={col.id}
                                    sx={{
                                      minHeight: 180,
                                      flex: "0 0 320px",
                                      maxWidth: 340,
                                      display: "inline-block",
                                    }}
                                  >
                                    {/* Column Header */}
                                    <Paper
                                      elevation={1}
                                      sx={{
                                        mb: 1,
                                        p: 1,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 16,
                                          height: 16,
                                          borderRadius: "50%",
                                          bgcolor: col.color,
                                          mr: 1,
                                          flexShrink: 0,
                                        }}
                                      />
                                      <Typography
                                        variant="subtitle2"
                                        fontWeight={600}
                                        sx={{
                                          letterSpacing: 1,
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {col.label}
                                      </Typography>
                                    </Paper>
                                    {/* Ticket Drop Area */}
                                    <Droppable
                                      droppableId={`${workflow.id}:${col.id}`}
                                      direction="vertical"
                                    >
                                      {(provided, snapshot) => (
                                        <Box
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                          sx={{
                                            minHeight: 120,
                                            background: snapshot.isDraggingOver
                                              ? "#e3f2fd"
                                              : undefined,
                                            transition: "background 0.2s",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 1,
                                          }}
                                        >
                                          {getWorkflowTickets(
                                            filteredTickets,
                                            workflow.id,
                                            col.id,
                                          ).map((ticket, idx) => (
                                            <Draggable
                                              draggableId={ticket.id}
                                              index={idx}
                                              key={ticket.id}
                                            >
                                              {(provided, snapshot) => (
                                                <Card
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  {...provided.dragHandleProps}
                                                  sx={{
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
                                                      <Typography
                                                        variant="subtitle1"
                                                        fontWeight={600}
                                                        noWrap
                                                        sx={{
                                                          maxWidth: 120,
                                                          overflow: "hidden",
                                                          textOverflow: "ellipsis",
                                                        }}
                                                      >
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
                                                    <Typography
                                                      variant="body2"
                                                      color="text.secondary"
                                                    >
                                                      <strong>Assignee:</strong> {ticket.assignee}
                                                    </Typography>
                                                    <Typography
                                                      variant="body2"
                                                      color="text.secondary"
                                                    >
                                                      <strong>Customer:</strong> {ticket.customer}
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
                                  </Box>
                                ))}
                              </Box>
                            </Paper>
                          ))
                        )}
                      </Box>
                    );
                  }}
                </AutoSizer>
              </Box>
            </Box>
          </DragDropContext>
        </Box>
      </Box>
    </Box>
  );
}
