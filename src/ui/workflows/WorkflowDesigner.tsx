// "use client";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";

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
  color: "default" | "primary" | "success" | "warning";
};

const defaultColumns: Column[] = [
  { key: "Sourcing", label: "Sourcing", color: "default" },
  { key: "Dispatching", label: "Dispatching", color: "primary" },
  { key: "Pickup", label: "Pickup", color: "warning" },
  { key: "Completed", label: "Completed", color: "success" },
];

const mockSteps: WorkflowStep[] = [
  {
    id: "step-1",
    asset: "Excavator #A12",
    description: "Ready for sourcing",
    status: "Sourcing",
    enterActions: ["Notify sourcing team"],
    exitActions: ["Mark as sourced"],
    constraints: ["Asset must be available"],
    allowedTransitions: ["Dispatching"],
  },
  {
    id: "step-2",
    asset: "Truck #B7",
    description: "Awaiting dispatch",
    status: "Dispatching",
    enterActions: ["Assign driver"],
    exitActions: ["Confirm dispatch"],
    constraints: ["Driver must be assigned"],
    allowedTransitions: ["Pickup"],
  },
  {
    id: "step-3",
    asset: "Forklift #C3",
    description: "Ready for pickup",
    status: "Pickup",
    enterActions: ["Notify pickup team"],
    exitActions: ["Confirm pickup"],
    constraints: ["Pickup time required"],
    allowedTransitions: ["Completed"],
  },
  {
    id: "step-4",
    asset: "Loader #D9",
    description: "Completed workflow",
    status: "Completed",
    enterActions: [],
    exitActions: [],
    constraints: [],
    allowedTransitions: [],
  },
];

const allActions = [
  "Notify sourcing team",
  "Mark as sourced",
  "Assign driver",
  "Confirm dispatch",
  "Notify pickup team",
  "Confirm pickup",
  "Send completion email",
];

const allConstraints = [
  "Asset must be available",
  "Driver must be assigned",
  "Pickup time required",
  "Asset must be inspected",
];

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

export default function WorkflowDesigner() {
  const [columns, setColumns] = React.useState<Column[]>(defaultColumns);
  const [steps, setSteps] = React.useState<WorkflowStep[]>(mockSteps);
  const [editDialog, setEditDialog] = React.useState<EditDialogState>({ open: false, step: null });
  const [editColumnDialog, setEditColumnDialog] = React.useState<EditColumnDialogState>({
    open: false,
    column: null,
    isNew: false,
  });
  const [newColumnLabel, setNewColumnLabel] = React.useState("");
  const [newColumnColor, setNewColumnColor] = React.useState<Column["color"]>("default");

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
      column: { key: "", label: "", color: "default" },
      isNew: true,
    });
    setNewColumnLabel("");
    setNewColumnColor("default");
  }

  function handleEditColumnClick(col: Column) {
    setEditColumnDialog({
      open: true,
      column: { ...col },
      isNew: false,
    });
    setNewColumnLabel(col.label);
    setNewColumnColor(col.color);
  }

  function handleDeleteColumn(col: Column) {
    // Remove column and move steps to first column (or delete if no columns left)
    setColumns((prev) => prev.filter((c) => c.key !== col.key));
    setSteps((prev) =>
      prev.map((s) => (s.status === col.key ? { ...s, status: columns[0]?.key || "" } : s)),
    );
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
    const color = newColumnColor;
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
        Workflow Designer (POC)
      </Typography>
      <Typography variant="subtitle1" mb={3}>
        Kanban-style workflow. Click a column to configure
        control flow, actions, and constraints.
      </Typography>
      <Box mb={2} display="flex" alignItems="center" gap={2}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddColumnClick}>
          Add Column
        </Button>
      </Box>
      <DragDropContext onDragEnd={onDragEnd}>
        <Grid container spacing={3}>
          {columns.map((col) => (
            <Grid size={{ xs: 12, md: Math.max(12 / columns.length, 3) }} key={col.key}>
              <Paper
                elevation={3}
                sx={{ p: 2, minHeight: 500, bgcolor: "#f8f9fa", position: "relative" }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">{col.label}</Typography>
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
                <Droppable droppableId={col.key}>
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
                                borderLeft: `6px solid ${
                                  col.color === "success"
                                    ? "#2e7d32"
                                    : col.color === "warning"
                                      ? "#ed6c02"
                                      : col.color === "primary"
                                        ? "#1976d2"
                                        : "#757575"
                                }`,
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
                                    color={col.color}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
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
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </Grid>
          ))}
        </Grid>
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
            <TextField
              select
              label="Color"
              value={newColumnColor}
              onChange={(e) => setNewColumnColor(e.target.value as Column["color"])}
              fullWidth
            >
              <MenuItem value="default">Default</MenuItem>
              <MenuItem value="primary">Primary</MenuItem>
              <MenuItem value="success">Success</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
            </TextField>
            {/* Column-level workflow settings */}
            <TextField
              select
              label="Allowed Transitions"
              value={
                editColumnDialog.column
                  ? columns
                      .filter((c) => c.key !== editColumnDialog.column!.key)
                      .map((c) => c.key)
                  : []
              }
              onChange={() => {}}
              SelectProps={{ multiple: true, readOnly: true }}
              fullWidth
              helperText="Transitions allowed from this column (edit logic as needed)"
            >
              {columns
                .filter((c) => c.key !== editColumnDialog.column?.key)
                .map((c) => (
                  <MenuItem key={c.key} value={c.key}>
                    {c.label}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              select
              label="Default Enter Actions"
              value={["Notify sourcing team", "Assign driver"]}
              onChange={() => {}}
              SelectProps={{ multiple: true, readOnly: true }}
              fullWidth
              helperText="Default enter actions for steps in this column (edit logic as needed)"
            >
              {allActions.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Default Exit Actions"
              value={["Mark as sourced", "Confirm dispatch"]}
              onChange={() => {}}
              SelectProps={{ multiple: true, readOnly: true }}
              fullWidth
              helperText="Default exit actions for steps in this column (edit logic as needed)"
            >
              {allActions.map((a) => (
                <MenuItem key={a} value={a}>
                  {a}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Default Constraints"
              value={["Asset must be available", "Driver must be assigned"]}
              onChange={() => {}}
              SelectProps={{ multiple: true, readOnly: true }}
              fullWidth
              helperText="Default constraints for steps in this column (edit logic as needed)"
            >
              {allConstraints.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
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
    </Box>
  );
}
