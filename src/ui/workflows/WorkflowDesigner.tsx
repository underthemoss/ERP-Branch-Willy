"use client";

import { graphql } from "@/graphql";
import {
  useGenerateExampleTicketLazyQuery,
  useGetWorkflowConfigurationByIdQuery,
  useUpdateWorkflowConfigurationMutation,
} from "@/graphql/hooks";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Popover,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import React from "react";
import Sqids from "sqids";
import AutomationsDialog, { Column as AutomationColumn } from "./AutomationsDialog";

const GetWorkflowConfigurationByIdDocument = graphql(`
  query GetWorkflowConfigurationById($id: ID!) {
    getWorkflowConfigurationById(id: $id) {
      id
      name
      columns {
        id
        name
        colour
      }
    }
  }
`);

const UpdateWorkflowConfigurationDocument = graphql(`
  mutation UpdateWorkflowConfiguration($id: ID!, $input: UpdateWorkflowConfigurationInput!) {
    updateWorkflowConfiguration(id: $id, input: $input) {
      id
      name
      columns {
        id
        name
        colour
      }
    }
  }
`);

const GenerateExampleTicketDocument = graphql(`
  query GenerateExampleTicket {
    llm {
      exampleTicket {
        title
        description
      }
    }
  }
`);

type WorkflowStatus = string;

type WorkflowTicket = {
  id: string;
  title: string;
  description: string;
  status: WorkflowStatus;
};

type Column = AutomationColumn;

const PRIMARY_HEX = "#1976d2";

// Sqids instance for unique ID generation
const sqids = new Sqids({ minLength: 8 });
function generateUniqueId() {
  // Use current timestamp and a random number to ensure uniqueness
  return sqids.encode([Date.now(), Math.floor(Math.random() * 1e6)]);
}

function groupByStatus(
  tickets: WorkflowTicket[],
  columns: Column[],
): Record<string, WorkflowTicket[]> {
  const grouped: Record<string, WorkflowTicket[]> = {};
  for (const col of columns) {
    grouped[col.id] = [];
  }
  for (const ticket of tickets) {
    if (grouped[ticket.status]) {
      grouped[ticket.status].push(ticket);
    }
  }
  return grouped;
}

type EditDialogState = {
  open: boolean;
  ticket: WorkflowTicket | null;
};

type EditColumnDialogState = {
  open: boolean;
  column: Column | null;
  isNew: boolean;
};

function GenerateTicketDialogContent({
  open,
  setNewTicket,
  setNewTicketDescription,
}: {
  open: boolean;
  setNewTicket: (v: string) => void;
  setNewTicketDescription: (v: string) => void;
}) {
  const [fetchTicket, { data, loading, error }] = useGenerateExampleTicketLazyQuery({
    fetchPolicy: "no-cache",
  });

  // Fetch when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchTicket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    if (open && !loading && data?.llm?.exampleTicket) {
      setNewTicket(data.llm.exampleTicket.title);
      setNewTicketDescription(data.llm.exampleTicket.description);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, data]);

  if (loading) return <Typography>Generating example ticket...</Typography>;
  if (error) return <Typography color="error">Failed to generate example ticket</Typography>;
  return null;
}

export default function WorkflowDesigner({ workflowId }: { workflowId: string }) {
  // Automations dialog state
  const [automationsDialog, setAutomationsDialog] = React.useState<{
    open: boolean;
    column: Column | null;
  }>({ open: false, column: null });

  // More menu state
  const [moreMenu, setMoreMenu] = React.useState<{
    anchorEl: null | HTMLElement;
    column: Column | null;
  }>({ anchorEl: null, column: null });

  // Color popover state
  const [colorPopoverAnchorEl, setColorPopoverAnchorEl] = React.useState<null | HTMLElement>(null);
  const [colorPopoverColumnId, setColorPopoverColumnId] = React.useState<string | null>(null);

  const colorOptions = [
    "#1976d2", // Blue
    "#388e3c", // Green
    "#fbc02d", // Yellow
    "#d32f2f", // Red
    "#7b1fa2", // Purple
    "#0288d1", // Light Blue
    "#c2185b", // Pink
    "#f57c00", // Orange
    "#455a64", // Blue Grey
    "#afb42b", // Lime
    "#5d4037", // Brown
    "#009688", // Teal
    "#8d6e63", // Taupe
    "#00acc1", // Cyan
    "#e64a19", // Deep Orange
    "#43a047", // Emerald
  ];

  function handleColorIconClick(event: React.MouseEvent<HTMLElement>, columnId: string) {
    setColorPopoverAnchorEl(event.currentTarget);
    setColorPopoverColumnId(columnId);
  }

  function handleColorPopoverClose() {
    setColorPopoverAnchorEl(null);
    setColorPopoverColumnId(null);
  }

  function handleColorSelect(color: string) {
    if (!colorPopoverColumnId) return;
    setColumns((prev) => {
      const next = prev.map((col) => (col.id === colorPopoverColumnId ? { ...col, color } : col));
      autoSaveColumns(next);
      return next;
    });
    handleColorPopoverClose();
  }

  const handleMoreMenuOpen = (event: React.MouseEvent<HTMLElement>, column: Column) => {
    setMoreMenu({ anchorEl: event.currentTarget, column });
  };
  const handleMoreMenuClose = () => {
    setMoreMenu({ anchorEl: null, column: null });
  };
  // Fetch columns from API
  const { data, loading, error } = useGetWorkflowConfigurationByIdQuery({
    variables: { id: workflowId },
    fetchPolicy: "cache-and-network",
  });

  // Map API columns to local Column type
  const apiColumns: Column[] =
    data?.getWorkflowConfigurationById?.columns?.map((col) => ({
      id: col.id,
      label: col.name,
      color: col.colour && /^#[0-9A-Fa-f]{6}$/.test(col.colour) ? col.colour : PRIMARY_HEX,
    })) || [];

  const [columns, setColumns] = React.useState<Column[]>(apiColumns);

  const [tickets, setTickets] = React.useState<WorkflowTicket[]>([]);
  const [editDialog, setEditDialog] = React.useState<EditDialogState>({
    open: false,
    ticket: null,
  });
  const [editColumnDialog, setEditColumnDialog] = React.useState<EditColumnDialogState>({
    open: false,
    column: null,
    isNew: false,
  });
  const [newColumnLabel, setNewColumnLabel] = React.useState("");
  const [newColumnColor, setNewColumnColor] = React.useState(PRIMARY_HEX);

  // Add Ticket dialog state
  const [addTicketState, setAddTicketState] = React.useState<{
    open: boolean;
    columnKey: string | null;
  }>({ open: false, columnKey: null });
  const [newTicket, setNewTicket] = React.useState("");
  const [newTicketDescription, setNewTicketDescription] = React.useState("");

  // Save mutation
  const [updateWorkflow, { loading: saving, error: saveError }] =
    useUpdateWorkflowConfigurationMutation();

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  // Edit Title dialog state
  const [editTitleDialogOpen, setEditTitleDialogOpen] = React.useState(false);
  const [editTitleValue, setEditTitleValue] = React.useState(
    data?.getWorkflowConfigurationById?.name || "",
  );

  // Keep editTitleValue in sync with data
  React.useEffect(() => {
    setEditTitleValue(data?.getWorkflowConfigurationById?.name || "");
  }, [data]);

  // Update columns when API data changes
  React.useEffect(() => {
    setColumns(apiColumns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const grouped = React.useMemo(() => groupByStatus(tickets, columns), [tickets, columns]);

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;
    const ticket = tickets.find((t) => t.id === draggableId);
    if (!ticket) return;
    const newTickets = tickets.filter((t) => t.id !== draggableId);
    const updatedTicket = { ...ticket, status: destination.droppableId };
    const destList = newTickets.filter((t) => t.status === destination.droppableId);
    destList.splice(destination.index, 0, updatedTicket);
    const rebuilt: WorkflowTicket[] = [];
    for (const col of columns) {
      if (col.id === destination.droppableId) {
        rebuilt.push(...destList);
      } else {
        rebuilt.push(...newTickets.filter((t) => t.status === col.id));
      }
    }
    setTickets(rebuilt);
  }

  function handleCardClick(ticket: WorkflowTicket) {
    setEditDialog({ open: true, ticket: { ...ticket } });
  }

  function handleDialogClose() {
    setEditDialog({ open: false, ticket: null });
  }

  function handleDialogSave() {
    if (!editDialog.ticket) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === editDialog.ticket!.id ? editDialog.ticket! : t)),
    );
    setEditDialog({ open: false, ticket: null });
  }

  function handleFieldChange<K extends keyof WorkflowTicket>(field: K, value: WorkflowTicket[K]) {
    if (!editDialog.ticket) return;
    setEditDialog((prev) => ({
      ...prev,
      ticket: { ...prev.ticket!, [field]: value },
    }));
  }

  // COLUMN MANAGEMENT

  async function autoSaveColumns(nextColumns: Column[]) {
    try {
      await updateWorkflow({
        variables: {
          id: workflowId,
          input: {
            columns: nextColumns.map((col) => ({
              id: col.id,
              name: col.label,
              colour: col.color, // persist color
            })),
            // name is not changed here
          },
        },
      });
      setSnackbarOpen(true);
    } catch (e) {
      // error handled by saveError
    }
  }

  function handleAddColumnClick() {
    setEditColumnDialog({
      open: true,
      column: { id: generateUniqueId(), label: "", color: PRIMARY_HEX },
      isNew: true,
    });
    setNewColumnLabel("");
    setNewColumnColor(PRIMARY_HEX);
  }

  function handleEditColumnClick(col: Column) {
    setEditColumnDialog({
      open: true,
      column: { ...col, color: col.color || PRIMARY_HEX },
      isNew: false,
    });
    setNewColumnLabel(col.label);
    setNewColumnColor(col.color || PRIMARY_HEX);
  }

  const [deleteColumnDialog, setDeleteColumnDialog] = React.useState<{
    open: boolean;
    column: Column | null;
  }>({ open: false, column: null });

  function handleDeleteColumn(col: Column) {
    setDeleteColumnDialog({ open: true, column: col });
  }

  function confirmDeleteColumn() {
    const col = deleteColumnDialog.column;
    if (!col) return;
    setColumns((prev) => {
      const next = prev.filter((c) => c.id !== col.id);
      autoSaveColumns(next);
      return next;
    });
    setTickets((prev) =>
      prev.map((t) => (t.status === col.id ? { ...t, status: columns[0]?.id || "" } : t)),
    );
    setDeleteColumnDialog({ open: false, column: null });
  }

  function handleColumnDialogClose() {
    setEditColumnDialog({ open: false, column: null, isNew: false });
  }

  function handleColumnDialogSave() {
    if (!editColumnDialog.column) return;
    const id = editColumnDialog.isNew
      ? editColumnDialog.column?.id || generateUniqueId()
      : editColumnDialog.column.id;
    const label = newColumnLabel.trim() || id;
    const color = newColumnColor || PRIMARY_HEX;
    if (editColumnDialog.isNew) {
      setColumns((prev) => {
        const next = [...prev, { id, label, color }];
        autoSaveColumns(next);
        return next;
      });
    } else if (editColumnDialog.column) {
      setColumns((prev) => {
        const next = prev.map((c) =>
          c.id === editColumnDialog.column!.id ? { ...c, id, label, color } : c,
        );
        // Update tickets' status if id changed
        if (editColumnDialog.column && editColumnDialog.column.id !== id) {
          setTickets((prevT) =>
            prevT.map((t) => (t.status === editColumnDialog.column!.id ? { ...t, status: id } : t)),
          );
        }
        autoSaveColumns(next);
        return next;
      });
    }
    setEditColumnDialog({ open: false, column: null, isNew: false });
  }

  // For allowedTransitions, only allow transitions to other columns (not self)
  const transitionOptions = columns.map((s) => s.id);

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Box display="flex" alignItems="center" mb={2} gap={1}>
        <Typography variant="h4" fontWeight={700}>
          {loading
            ? "Loading workflow..."
            : data?.getWorkflowConfigurationById?.name || "Workflow Designer"}
        </Typography>
        {!loading && !error && (
          <IconButton
            size="small"
            aria-label="Edit Title"
            onClick={() => setEditTitleDialogOpen(true)}
            sx={{ ml: 1 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Typography variant="subtitle1" mb={3}>
        Kanban-style workflow. Click a column to configure control flow, actions, and constraints.
      </Typography>
      {loading && <Typography>Loading workflow...</Typography>}
      {error && <Typography color="error">Failed to load workflow</Typography>}
      <Box mb={2} display="flex" alignItems="center" gap={2}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddColumnClick}>
          Add Column
        </Button>
        {saving && (
          <Typography color="text.secondary" ml={2}>
            Saving...
          </Typography>
        )}
        {saveError && (
          <Typography color="error" ml={2}>
            Failed to save: {saveError.message}
          </Typography>
        )}
      </Box>
      {/* Edit Title Dialog */}
      <Dialog
        open={editTitleDialogOpen}
        onClose={() => setEditTitleDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Workflow Title</DialogTitle>
        <DialogContent>
          <TextField
            label="Workflow Title"
            value={editTitleValue}
            onChange={(e) => setEditTitleValue(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTitleDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!editTitleValue.trim()}
            onClick={async () => {
              try {
                await updateWorkflow({
                  variables: {
                    id: workflowId,
                    input: {
                      name: editTitleValue.trim(),
                      columns: columns.map((col) => ({
                        id: col.id,
                        name: col.label,
                      })),
                    },
                  },
                });
                setEditTitleDialogOpen(false);
                setSnackbarOpen(true);
              } catch (e) {
                // error handled by saveError
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <DragDropContext
        onDragEnd={(result) => {
          if (result.type === "column") {
            const { source, destination } = result;
            if (!destination || source.index === destination.index) return;
            setColumns((prev) => {
              const newCols = Array.from(prev);
              const [removed] = newCols.splice(source.index, 1);
              newCols.splice(destination.index, 0, removed);
              autoSaveColumns(newCols);
              return newCols;
            });
          } else {
            onDragEnd(result);
          }
        }}
      >
        <Droppable droppableId="kanban-columns" direction="horizontal" type="column">
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: 3,
                overflowX: "auto",
                p: 1,
                pb: 3,
                width: "100%",
              }}
            >
              {columns.map((col, colIdx) => (
                <Draggable draggableId={col.id} index={colIdx} key={col.id}>
                  {(dragProvided, dragSnapshot) => (
                    <Box
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      sx={{
                        minWidth: 320,
                        maxWidth: 360,
                        flex: "0 0 320px",
                        display: "flex",
                        flexDirection: "column",
                        opacity: dragSnapshot.isDragging ? 0.9 : 1,
                      }}
                    >
                      <Paper
                        elevation={3}
                        sx={{
                          p: 2,
                          minHeight: 500,
                          bgcolor: "#f8f9fa",
                          position: "relative",
                          height: "100%",
                        }}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          mb={2}
                          sx={{ flexWrap: "nowrap" }}
                        >
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            sx={{ flex: "1 1 0", minWidth: 0 }}
                          >
                            <span
                              {...dragProvided.dragHandleProps}
                              style={{ cursor: "grab", display: "flex" }}
                            >
                              <DragIndicatorIcon fontSize="small" color="action" />
                            </span>
                            <Box
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                bgcolor: col.color,
                                border: "2px solid #fff",
                                boxShadow: 1,
                                mr: 0.5,
                                flexShrink: 0,
                                cursor: "pointer",
                              }}
                              aria-label={`Column color: ${col.color}`}
                              onClick={(e) => handleColorIconClick(e, col.id)}
                            />
                            <Tooltip title={col.label} arrow>
                              <Typography
                                variant="h6"
                                noWrap
                                sx={{
                                  maxWidth: 180,
                                  minWidth: 0,
                                  textOverflow: "ellipsis",
                                  overflow: "hidden",
                                  whiteSpace: "nowrap",
                                  display: "block",
                                }}
                              >
                                {col.label}
                              </Typography>
                            </Tooltip>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              flexShrink: 0,
                              minWidth: 0,
                            }}
                          >
                            <IconButton
                              size="small"
                              aria-label="More"
                              onClick={(e) => handleMoreMenuOpen(e, col)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Droppable droppableId={col.id} type="step">
                          {(provided, snapshot) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              sx={{
                                minHeight: 450,
                                transition: "background 0.2s",
                                background: snapshot.isDraggingOver ? "#e3f2fd" : undefined,
                              }}
                            >
                              {grouped[col.id]?.map((ticket, idx) => (
                                <Draggable draggableId={ticket.id} index={idx} key={ticket.id}>
                                  {(provided, snapshot) => (
                                    <Card
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      sx={{
                                        mb: 2,
                                        borderLeft: `6px solid ${col.color}`,
                                        boxShadow: snapshot.isDragging ? 6 : 2,
                                        opacity: snapshot.isDragging ? 0.8 : 1,
                                        cursor: "pointer",
                                      }}
                                      onClick={() => handleCardClick(ticket)}
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
                                            sx={{
                                              fontWeight: 600,
                                              backgroundColor: col.color,
                                              color: "#fff",
                                            }}
                                          />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" mt={1}>
                                          {ticket.description}
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="caption" color="text.secondary">
                                          Assigned to: -
                                        </Typography>
                                        <br />
                                        <Typography variant="caption" color="text.secondary">
                                          Details: -
                                        </Typography>
                                      </CardContent>
                                    </Card>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              {/* Column Footer: Add Ticket */}
                              <Box
                                mt={2}
                                p={1}
                                sx={{
                                  borderTop: "1px solid #e0e0e0",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  bgcolor: "#f5f5f5",
                                }}
                              >
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<AddIcon />}
                                  onClick={() =>
                                    setAddTicketState({ open: true, columnKey: col.id })
                                  }
                                >
                                  Generate Ticket
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </Droppable>
                      </Paper>
                    </Box>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>

      {/* Edit Ticket Dialog */}
      <Dialog open={editDialog.open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Ticket</DialogTitle>
        <DialogContent>
          {editDialog.ticket && (
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Title"
                value={editDialog.ticket.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                fullWidth
              />
              <TextField
                label="Description"
                value={editDialog.ticket.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                fullWidth
              />
              <TextField
                select
                label="Status"
                value={editDialog.ticket.status}
                onChange={(e) => handleFieldChange("status", e.target.value as WorkflowStatus)}
                fullWidth
              >
                {columns.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleDialogSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit/Add Column Dialog */}
      <Dialog
        open={editColumnDialog.open}
        onClose={handleColumnDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editColumnDialog.isNew ? "Add Column" : "Edit Column"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Column Label"
              value={newColumnLabel}
              onChange={(e) => setNewColumnLabel(e.target.value)}
              fullWidth
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleColumnDialogClose}>Cancel</Button>
          <Button
            onClick={handleColumnDialogSave}
            variant="contained"
            disabled={!newColumnLabel.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Column Confirmation Dialog */}
      <Dialog
        open={deleteColumnDialog.open}
        onClose={() => setDeleteColumnDialog({ open: false, column: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Column</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the column <b>{deleteColumnDialog.column?.label}</b>?
            <br />
            <br />
            All tickets in this column should be moved to a new column before deleting.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteColumnDialog({ open: false, column: null })}>
            Cancel
          </Button>
          <Button onClick={confirmDeleteColumn} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Add Ticket Dialog */}
      {/* Generate Ticket Dialog */}
      <Dialog
        open={addTicketState.open}
        onClose={() => {
          setAddTicketState({ open: false, columnKey: null });
          setNewTicket("");
          setNewTicketDescription("");
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Generate Ticket</DialogTitle>
        <DialogContent>
          <GenerateTicketDialogContent
            open={addTicketState.open}
            setNewTicket={setNewTicket}
            setNewTicketDescription={setNewTicketDescription}
          />
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Title"
              value={newTicket}
              onChange={(e) => setNewTicket(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Description"
              value={newTicketDescription}
              onChange={(e) => setNewTicketDescription(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddTicketState({ open: false, columnKey: null });
              setNewTicket("");
              setNewTicketDescription("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!newTicket.trim() || !newTicketDescription.trim()}
            onClick={() => {
              if (!addTicketState.columnKey) return;
              setTickets((prev) => [
                ...prev,
                {
                  id: generateUniqueId(),
                  title: newTicket.trim(),
                  description: newTicketDescription.trim(),
                  status: addTicketState.columnKey!,
                  enterActions: [],
                  exitActions: [],
                  constraints: [],
                  allowedTransitions: [],
                },
              ]);
              setAddTicketState({ open: false, columnKey: null });
              setNewTicket("");
              setNewTicketDescription("");
            }}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
      {/* More Menu */}
      <Menu
        anchorEl={moreMenu.anchorEl}
        open={Boolean(moreMenu.anchorEl)}
        onClose={handleMoreMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { minWidth: 180 } }}
      >
        <MenuItem
          onClick={() => {
            setAutomationsDialog({ open: true, column: moreMenu.column });
            handleMoreMenuClose();
          }}
        >
          <SettingsSuggestIcon fontSize="small" sx={{ mr: 1 }} />
          Automations
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (moreMenu.column) handleEditColumnClick(moreMenu.column);
            handleMoreMenuClose();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        {columns.length > 1 && (
          <MenuItem
            onClick={() => {
              if (moreMenu.column) handleDeleteColumn(moreMenu.column);
              handleMoreMenuClose();
            }}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
      {/* Automations Dialog */}
      <AutomationsDialog
        open={automationsDialog.open}
        column={automationsDialog.column}
        onClose={() => setAutomationsDialog({ open: false, column: null })}
      />
      {/* Color Picker Popover */}
      <Popover
        open={Boolean(colorPopoverAnchorEl)}
        anchorEl={colorPopoverAnchorEl}
        onClose={handleColorPopoverClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{ sx: { p: 2 } }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 32px)",
            gap: 1,
            width: "fit-content",
          }}
        >
          {colorOptions.map((color) => (
            <Box
              key={color}
              onClick={() => handleColorSelect(color)}
              sx={{
                width: 32,
                height: 32,
                bgcolor: color,
                borderRadius: "50%",
                border:
                  columns.find((col) => col.id === colorPopoverColumnId)?.color === color
                    ? "3px solid #000"
                    : "2px solid #fff",
                cursor: "pointer",
                boxShadow:
                  columns.find((col) => col.id === colorPopoverColumnId)?.color === color ? 3 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            />
          ))}
        </Box>
      </Popover>
      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setSnackbarOpen(false);
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
          elevation={6}
          variant="filled"
        >
          Workflow saved successfully
        </Alert>
      </Snackbar>
    </Box>
  );
}
