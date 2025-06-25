// "use client";
import { graphql } from "@/graphql";
import {
  useGetWorkflowConfigurationByIdQuery,
  useUpdateWorkflowConfigurationMutation,
} from "@/graphql/hooks";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
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
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";

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

type WorkflowStatus = string;

type WorkflowStep = {
  id: string;
  asset: string;
  description: string;
  status: WorkflowStatus;
  enterActions: string[];
  exitActions: string[];
  constraints: string[];
  allowedTransitions: WorkflowStatus[];
};

type Column = {
  key: string;
  label: string;
  color: string; // hex color, e.g. "#1976d2"
};

const PRIMARY_HEX = "#1976d2";

function groupByStatus(steps: WorkflowStep[], columns: Column[]): Record<string, WorkflowStep[]> {
  const grouped: Record<string, WorkflowStep[]> = {};
  for (const col of columns) {
    grouped[col.key] = [];
  }
  for (const step of steps) {
    if (grouped[step.status]) {
      grouped[step.status].push(step);
    }
  }
  return grouped;
}

type EditDialogState = {
  open: boolean;
  step: WorkflowStep | null;
};

type EditColumnDialogState = {
  open: boolean;
  column: Column | null;
  isNew: boolean;
};

export default function WorkflowDesigner({ workflowId }: { workflowId: string }) {
  // Fetch columns from API
  const { data, loading, error } = useGetWorkflowConfigurationByIdQuery({
    variables: { id: workflowId },
    fetchPolicy: "cache-and-network",
  });

  // Map API columns to local Column type
  const apiColumns: Column[] =
    data?.getWorkflowConfigurationById?.columns?.map((col) => ({
      key: col.id,
      label: col.name,
      color: col.colour && /^#[0-9A-Fa-f]{6}$/.test(col.colour) ? col.colour : PRIMARY_HEX,
    })) || [];

  const [columns, setColumns] = React.useState<Column[]>(apiColumns);
  const [steps, setSteps] = React.useState<WorkflowStep[]>([]);
  const [editDialog, setEditDialog] = React.useState<EditDialogState>({ open: false, step: null });
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
  const [newTicketAsset, setNewTicketAsset] = React.useState("");
  const [newTicketDescription, setNewTicketDescription] = React.useState("");

  // Save mutation
  const [updateWorkflow, { loading: saving, error: saveError }] =
    useUpdateWorkflowConfigurationMutation();

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  // Update columns when API data changes
  React.useEffect(() => {
    setColumns(apiColumns);
  }, [data]);

  const grouped = React.useMemo(() => groupByStatus(steps, columns), [steps, columns]);

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;
    const step = steps.find((s) => s.id === draggableId);
    if (!step) return;
    const newSteps = steps.filter((s) => s.id !== draggableId);
    const updatedStep = { ...step, status: destination.droppableId };
    const destList = newSteps.filter((s) => s.status === destination.droppableId);
    destList.splice(destination.index, 0, updatedStep);
    const rebuilt: WorkflowStep[] = [];
    for (const col of columns) {
      if (col.key === destination.droppableId) {
        rebuilt.push(...destList);
      } else {
        rebuilt.push(...newSteps.filter((s) => s.status === col.key));
      }
    }
    setSteps(rebuilt);
  }

  function handleCardClick(step: WorkflowStep) {
    setEditDialog({ open: true, step: { ...step } });
  }

  function handleDialogClose() {
    setEditDialog({ open: false, step: null });
  }

  function handleDialogSave() {
    if (!editDialog.step) return;
    setSteps((prev) => prev.map((s) => (s.id === editDialog.step!.id ? editDialog.step! : s)));
    setEditDialog({ open: false, step: null });
  }

  function handleFieldChange<K extends keyof WorkflowStep>(field: K, value: WorkflowStep[K]) {
    if (!editDialog.step) return;
    setEditDialog((prev) => ({
      ...prev,
      step: { ...prev.step!, [field]: value },
    }));
  }

  // COLUMN MANAGEMENT

  function handleAddColumnClick() {
    setEditColumnDialog({
      open: true,
      column: { key: "", label: "", color: PRIMARY_HEX },
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

  const [deleteColumnDialog, setDeleteColumnDialog] = React.useState<{ open: boolean; column: Column | null }>({ open: false, column: null });

  function handleDeleteColumn(col: Column) {
    setDeleteColumnDialog({ open: true, column: col });
  }

  function confirmDeleteColumn() {
    const col = deleteColumnDialog.column;
    if (!col) return;
    setColumns((prev) => prev.filter((c) => c.key !== col.key));
    setSteps((prev) =>
      prev.map((s) => (s.status === col.key ? { ...s, status: columns[0]?.key || "" } : s)),
    );
    setDeleteColumnDialog({ open: false, column: null });
  }

  function handleColumnDialogClose() {
    setEditColumnDialog({ open: false, column: null, isNew: false });
  }

  function handleColumnDialogSave() {
    if (!editColumnDialog.column) return;
    const key = editColumnDialog.isNew
      ? newColumnLabel.trim() || `Column${columns.length + 1}`
      : editColumnDialog.column.key;
    const label = newColumnLabel.trim() || key;
    const color = newColumnColor || PRIMARY_HEX;
    if (editColumnDialog.isNew) {
      setColumns((prev) => [...prev, { key, label, color }]);
    } else {
      setColumns((prev) =>
        prev.map((c) => (c.key === editColumnDialog.column!.key ? { ...c, key, label, color } : c)),
      );
      // Update steps' status if key changed
      if (editColumnDialog.column.key !== key) {
        setSteps((prev) =>
          prev.map((s) => (s.status === editColumnDialog.column!.key ? { ...s, status: key } : s)),
        );
      }
    }
    setEditColumnDialog({ open: false, column: null, isNew: false });
  }

  // For allowedTransitions, only allow transitions to other columns (not self)
  const transitionOptions = columns.map((s) => s.key);

  return (
    <Box sx={{ width: "100%", p: 2, bgcolor: "#f4f6f8" }}>
      <Typography variant="h4" mb={2} fontWeight={700}>
        {loading
          ? "Loading workflow..."
          : data?.getWorkflowConfigurationById?.name || "Workflow Designer"}
      </Typography>
      <Typography variant="subtitle1" mb={3}>
        Kanban-style workflow. Click a column to configure control flow, actions, and constraints.
      </Typography>
      {loading && <Typography>Loading workflow...</Typography>}
      {error && <Typography color="error">Failed to load workflow</Typography>}
      <Box mb={2} display="flex" alignItems="center" gap={2}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddColumnClick}>
          Add Column
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={async () => {
            try {
              await updateWorkflow({
                variables: {
                  id: workflowId,
                  input: {
                    columns: columns.map((col) => ({
                      id: col.key,
                      name: col.label,
                    })),
                  },
                },
              });
              setSnackbarOpen(true);
            } catch (e) {
              // error handled by saveError
            }
          }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        {saveError && (
          <Typography color="error" ml={2}>
            Failed to save: {saveError.message}
          </Typography>
        )}
      </Box>
      <DragDropContext
        onDragEnd={(result) => {
          if (result.type === "column") {
            const { source, destination } = result;
            if (!destination || source.index === destination.index) return;
            setColumns((prev) => {
              const newCols = Array.from(prev);
              const [removed] = newCols.splice(source.index, 1);
              newCols.splice(destination.index, 0, removed);
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
                pb: 1,
                width: "100%",
              }}
            >
              {columns.map((col, colIdx) => (
                <Draggable draggableId={col.key} index={colIdx} key={col.key}>
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
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <span
                              {...dragProvided.dragHandleProps}
                              style={{ cursor: "grab", display: "flex" }}
                            >
                              <DragIndicatorIcon fontSize="small" color="action" />
                            </span>
                            <Typography variant="h6">{col.label}</Typography>
                          </Box>
                          <Box>
                            <Tooltip title="Edit Column">
                              <IconButton size="small" onClick={() => handleEditColumnClick(col)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {columns.length > 1 && (
                              <Tooltip title="Delete Column">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteColumn(col)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                        <Droppable droppableId={col.key} type="step">
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
                              {grouped[col.key]?.map((step, idx) => (
                                <Draggable draggableId={step.id} index={idx} key={step.id}>
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
                                      onClick={() => handleCardClick(step)}
                                    >
                                      <CardContent>
                                        <Box
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="space-between"
                                        >
                                          <Typography variant="subtitle1" fontWeight={600}>
                                            {step.asset}
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
                                          {step.description}
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="caption" color="text.secondary">
                                          Enter: {step.enterActions.join(", ") || "None"}
                                        </Typography>
                                        <br />
                                        <Typography variant="caption" color="text.secondary">
                                          Exit: {step.exitActions.join(", ") || "None"}
                                        </Typography>
                                        <br />
                                        <Typography variant="caption" color="text.secondary">
                                          Constraints: {step.constraints.join(", ") || "None"}
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
                                    setAddTicketState({ open: true, columnKey: col.key })
                                  }
                                >
                                  Add Ticket
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

      {/* Edit Step Dialog */}
      <Dialog open={editDialog.open} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Workflow Step</DialogTitle>
        <DialogContent>
          {editDialog.step && (
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Asset"
                value={editDialog.step.asset}
                onChange={(e) => handleFieldChange("asset", e.target.value)}
                fullWidth
              />
              <TextField
                label="Description"
                value={editDialog.step.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                fullWidth
              />
              <TextField
                select
                label="Status"
                value={editDialog.step.status}
                onChange={(e) => handleFieldChange("status", e.target.value as WorkflowStatus)}
                fullWidth
              >
                {columns.map((s) => (
                  <MenuItem key={s.key} value={s.key}>
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
            <Box>
              <Typography variant="subtitle2" mb={1}>
                Column Colour:
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 32px)",
                  gap: 1,
                  mb: 1,
                  width: "fit-content",
                }}
              >
                {[
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
                ].map((color) => (
                  <Box
                    key={color}
                    onClick={() => setNewColumnColor(color)}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: color,
                      borderRadius: "50%",
                      border: newColumnColor === color ? "3px solid #000" : "2px solid #fff",
                      cursor: "pointer",
                      boxShadow: newColumnColor === color ? 3 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    {/* {newColumnColor === color && (
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border: "2px solid #fff",
                          background: "#000",
                          position: "absolute",
                          top: 7,
                          left: 7,
                        }}
                      />
                    )} */}
                  </Box>
                ))}
              </Box>
              <span style={{ fontFamily: "monospace" }}>{newColumnColor}</span>
            </Box>
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
            Are you sure you want to delete the column{" "}
            <b>{deleteColumnDialog.column?.label}</b>?
            <br />
            <br />
            All tickets in this column should be moved to a new column before deleting.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteColumnDialog({ open: false, column: null })}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteColumn}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Add Ticket Dialog */}
      <Dialog
        open={addTicketState.open}
        onClose={() => {
          setAddTicketState({ open: false, columnKey: null });
          setNewTicketAsset("");
          setNewTicketDescription("");
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Ticket</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Asset"
              value={newTicketAsset}
              onChange={(e) => setNewTicketAsset(e.target.value)}
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
              setNewTicketAsset("");
              setNewTicketDescription("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!newTicketAsset.trim() || !newTicketDescription.trim()}
            onClick={() => {
              if (!addTicketState.columnKey) return;
              setSteps((prev) => [
                ...prev,
                {
                  id: `step-${Date.now()}`,
                  asset: newTicketAsset.trim(),
                  description: newTicketDescription.trim(),
                  status: addTicketState.columnKey!,
                  enterActions: [],
                  exitActions: [],
                  constraints: [],
                  allowedTransitions: [],
                },
              ]);
              setAddTicketState({ open: false, columnKey: null });
              setNewTicketAsset("");
              setNewTicketDescription("");
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
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
