"use client";

import { graphql } from "@/graphql";
// --- Helper Functions ---
import {
  ListWorkflowConfigurationsFulfilmentPageQuery,
  useListFulfilmentsFulfilmentDashboardPageQuery,
  useListWorkflowConfigurationsFulfilmentPageQuery,
  useUpdateFulfilmentColumnMutation,
} from "@/graphql/hooks";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import BoltIcon from "@mui/icons-material/Bolt";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  Autocomplete,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Chip as MuiChip,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import AutoSizer from "react-virtualized-auto-sizer";

graphql(`
  fragment BaseFulfilmentFields on FulfilmentBase {
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

  mutation UpdateFulfilmentColumn($fulfilmentId: ID!, $workflowId: ID, $workflowColumnId: ID) {
    updateFulfilmentColumn(
      fulfilmentId: $fulfilmentId
      workflowId: $workflowId
      workflowColumnId: $workflowColumnId
    ) {
      id
      workflowId
      workflowColumnId
    }
  }

  query ListFulfilmentsFulfilmentDashboardPage(
    $filter: ListFulfilmentsFilter
    $page: ListFulfilmentsPage
  ) {
    listFulfilments(filter: $filter, page: $page) {
      items {
        __typename
        ...BaseFulfilmentFields
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
          colour
        }
      }
    }
  }
`);

type Ticket = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  customer: string;
  workflowId: string | null;
  status: string;
};

type WorkflowConfig = NonNullable<
  ListWorkflowConfigurationsFulfilmentPageQuery["listWorkflowConfigurations"]
>["items"][number];

type WorkflowColumn = NonNullable<WorkflowConfig["columns"]>[number];

function getBacklogTickets(tickets: Ticket[]) {
  return tickets.filter((t) => t.workflowId === null);
}
function getWorkflowTickets(tickets: Ticket[], workflowId: string, columnId: string) {
  return tickets.filter((t) => t.workflowId === workflowId && t.status === columnId);
}

// --- Main Component ---
export default function FulfillmentDashboard() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { workspace_id } = useParams<{ workspace_id: string }>();

  // Compute unique assignees and customers from tickets
  const assignees = React.useMemo(
    () => Array.from(new Set(tickets.map((t) => t.assignee).filter(Boolean))).sort(),
    [tickets],
  );
  const customers = React.useMemo(
    () => Array.from(new Set(tickets.map((t) => t.customer).filter(Boolean))).sort(),
    [tickets],
  );

  // Parse filters from query params
  const assigneeFilter = searchParams.getAll("assignee");
  const customerFilter = searchParams.getAll("customer");
  const workflowFilter = searchParams.getAll("workflow");
  const searchTerm = searchParams.get("search") || "";

  // Helper to update query params
  function setQueryParam(key: string, value: string[] | string) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (Array.isArray(value)) {
      params.delete(key);
      value.forEach((v) => params.append(key, v));
    } else if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

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
    const tickets: Ticket[] =
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
              status: i.workflowColumnId || "",
              title:
                (i.salesOrderLineItem?.__typename === "RentalSalesOrderLineItem" &&
                  i.salesOrderLineItem.price?.__typename === "RentalPrice" &&
                  `${i.salesOrderLineItem.price.name}`) ||
                "",
              workflowId: i.workflowId ?? null,
            } as Ticket;
        })
        .filter(Boolean)
        .map((i) => i as Ticket) || [];

    setTickets(tickets);
  }, [fulfillments]);

  // Map API data to expected workflow shape
  const workflows =
    data?.listWorkflowConfigurations?.items?.map((wf, wfIdx) => ({
      id: wf.id!,
      name: wf.name!,
      columns:
        wf.columns?.map((col, idx) => ({
          id: col.id!,
          label: col.name!,
          color: col.colour || ["#1976d2", "#fbc02d", "#388e3c", "#d32f2f", "#7b1fa2"][idx % 5],
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
  const [updateFulfilmentColumn] = useUpdateFulfilmentColumnMutation();

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

        // Call mutation to update backend (set workflowId and workflowColumnId to null)
        updateFulfilmentColumn({
          variables: {
            fulfilmentId: ticket.id,
          },
        });
      } else {
        // destination.droppableId = workflowId:columnId
        const [workflowId, columnId] = destination.droppableId.split(":");
        newTickets = [...newTickets, { ...ticket, workflowId, status: columnId }];

        // Call mutation to update backend
        updateFulfilmentColumn({
          variables: {
            fulfilmentId: ticket.id,
            workflowId,
            workflowColumnId: columnId,
          },
        });
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
          onChange={(e) => setQueryParam("search", e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setQueryParam("search", "")}>
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
          onChange={(e) => {
            const value =
              typeof e.target.value === "string" ? [e.target.value] : (e.target.value as string[]);
            setQueryParam("assignee", value);
          }}
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
          onChange={(e) => {
            const value =
              typeof e.target.value === "string" ? [e.target.value] : (e.target.value as string[]);
            setQueryParam("customer", value);
          }}
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
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={workflows}
          getOptionLabel={(option) => option.name}
          value={workflows.filter((w) => workflowFilter.includes(w.id))}
          onChange={(_, value) =>
            setQueryParam(
              "workflow",
              value.map((w) => w.id),
            )
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              size="small"
              label={
                workflowFilter.length === 0
                  ? "Workflow"
                  : `Workflow: ${workflows
                      .filter((w) => workflowFilter.includes(w.id))
                      .map((w) => w.name)
                      .join(", ")}`
              }
              placeholder="Type to search..."
            />
          )}
          sx={{ minWidth: 240, maxWidth: 320 }}
          renderTags={(selected, getTagProps) =>
            selected.map((option, index) => (
              <MuiChip
                label={option.name}
                {...getTagProps({ index })}
                key={option.id}
                size="small"
                sx={{ mr: 0.5 }}
              />
            ))
          }
        />
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
                                    {tickets
                                      .filter((t) => t.workflowId === null)
                                      .filter((t) => {
                                        // Apply assignee, customer, and search filters, but NOT workflowFilter
                                        if (
                                          assigneeFilter.length > 0 &&
                                          !assigneeFilter.includes(t.assignee)
                                        )
                                          return false;
                                        if (
                                          customerFilter.length > 0 &&
                                          !customerFilter.includes(t.customer)
                                        )
                                          return false;
                                        if (searchTerm) {
                                          const lower = searchTerm.toLowerCase();
                                          if (
                                            !t.title.toLowerCase().includes(lower) &&
                                            !t.description.toLowerCase().includes(lower)
                                          )
                                            return false;
                                        }
                                        return true;
                                      })
                                      .map((ticket, idx) => (
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
                                                cursor: "pointer",
                                                borderLeft: "6px solid #1976d2",
                                                transition: "box-shadow 0.2s",
                                                "&:hover": {
                                                  boxShadow: 8,
                                                  background: "#f0f7ff",
                                                },
                                              }}
                                            >
                                              <Link
                                                href={`/app/${workspace_id}/fulfillment/${ticket.id}`}
                                                scroll={false}
                                                style={{ textDecoration: "none", color: "inherit" }}
                                              >
                                                <CardContent sx={{ position: "relative" }}>
                                                  <Box
                                                    sx={{
                                                      position: "absolute",
                                                      top: 8,
                                                      right: 8,
                                                      zIndex: 1,
                                                    }}
                                                  >
                                                    <Tooltip title={ticket.assignee}>
                                                      <Avatar
                                                        sx={{
                                                          width: 28,
                                                          height: 28,
                                                          fontSize: 14,
                                                        }}
                                                      >
                                                        {ticket.assignee === "Unassigned"
                                                          ? null
                                                          : ticket.assignee
                                                              .split(" ")
                                                              .map((n) => n[0])
                                                              .join("")
                                                              .toUpperCase()}
                                                      </Avatar>
                                                    </Tooltip>
                                                  </Box>
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
                                                  <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                  >
                                                    <strong>Customer:</strong> {ticket.customer}
                                                  </Typography>
                                                </CardContent>
                                              </Link>
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
                          (workflowFilter.length === 0
                            ? workflows
                            : workflows.filter((w) => workflowFilter.includes(w.id))
                          ).map((workflow) => (
                            <Paper
                              key={workflow.id}
                              elevation={0}
                              sx={{
                                p: 2,
                                bgcolor: "transparent",
                                borderRadius: 3,
                                margin: 0,
                              }}
                            >
                              <Typography variant="subtitle1" fontWeight={700} mb={1}>
                                {workflow.name}
                              </Typography>
                              <Divider sx={{ mb: 2 }} />
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
                                        p: 1.5,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        bgcolor: "#fff",
                                        borderRadius: 2,
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                                      }}
                                    >
                                      <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                        sx={{ width: "100%" }}
                                      >
                                        <Box
                                          sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: "50%",
                                            bgcolor: col.color,
                                            mr: 1,
                                            flexShrink: 0,
                                            border: "2px solid #fff",
                                            boxShadow: "0 0 0 1.5px #e0e0e0",
                                          }}
                                        />
                                        <Box
                                          sx={{
                                            color: col.label.toLowerCase().includes("progress")
                                              ? "#1976d2"
                                              : "#757575",
                                            display: "flex",
                                            alignItems: "center",
                                          }}
                                        >
                                          {col.label.toLowerCase().includes("progress") ? (
                                            <BoltIcon fontSize="small" />
                                          ) : (
                                            <BoltOutlinedIcon fontSize="small" />
                                          )}
                                        </Box>
                                        <Typography
                                          variant="subtitle2"
                                          fontWeight={700}
                                          sx={{
                                            letterSpacing: 0.5,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            flex: 1,
                                          }}
                                        >
                                          {col.label}
                                        </Typography>
                                        <Chip
                                          label={
                                            getWorkflowTickets(filteredTickets, workflow.id, col.id)
                                              .length
                                          }
                                          size="small"
                                          sx={{
                                            fontWeight: 700,
                                            bgcolor: "#f4f4f4",
                                            color: "#222",
                                            px: 1,
                                            borderRadius: 1.5,
                                          }}
                                        />
                                      </Stack>
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
                                                    cursor: "pointer",
                                                    borderLeft: `6px solid ${col.color}`,
                                                    borderRadius: 2,
                                                    mb: 0,
                                                    px: 0.5,
                                                    py: 0.5,
                                                    background: "#fff",
                                                    minHeight: 110,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center",
                                                    transition: "box-shadow 0.2s",
                                                    "&:hover": {
                                                      boxShadow: 8,
                                                      background: "#f0f7ff",
                                                    },
                                                  }}
                                                >
                                                  <Link
                                                    href={`/app/${workspace_id}/fulfillment/${ticket.id}`}
                                                    scroll={false}
                                                    style={{
                                                      textDecoration: "none",
                                                      color: "inherit",
                                                    }}
                                                  >
                                                    <CardContent
                                                      sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}
                                                    >
                                                      <Stack spacing={1}>
                                                        <Stack
                                                          direction="row"
                                                          alignItems="center"
                                                          spacing={1}
                                                        >
                                                          <Typography
                                                            variant="subtitle1"
                                                            fontWeight={700}
                                                            sx={{
                                                              flex: 1,
                                                              overflow: "hidden",
                                                              textOverflow: "ellipsis",
                                                              whiteSpace: "nowrap",
                                                            }}
                                                          >
                                                            {ticket.title}
                                                          </Typography>
                                                          <Tooltip title={ticket.assignee}>
                                                            <Avatar
                                                              sx={{
                                                                width: 28,
                                                                height: 28,
                                                                fontSize: 14,
                                                                ml: 1,
                                                              }}
                                                            >
                                                              {ticket.assignee === "Unassigned"
                                                                ? null
                                                                : ticket.assignee
                                                                    .split(" ")
                                                                    .map((n) => n[0])
                                                                    .join("")
                                                                    .toUpperCase()}
                                                            </Avatar>
                                                          </Tooltip>
                                                        </Stack>
                                                        <Typography
                                                          variant="body2"
                                                          color="text.secondary"
                                                          sx={{ fontSize: 15, mb: 0.5 }}
                                                        >
                                                          {ticket.description}
                                                        </Typography>
                                                        <Typography
                                                          variant="body2"
                                                          color="text.secondary"
                                                          sx={{ fontSize: 14 }}
                                                        >
                                                          {ticket.customer}
                                                        </Typography>
                                                        {/* Optionally, add a note or extra info here if needed */}
                                                      </Stack>
                                                    </CardContent>
                                                  </Link>
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
