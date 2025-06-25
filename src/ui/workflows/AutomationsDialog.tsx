"use client";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
  Alert,
} from "@mui/material";
import React from "react";

export type Column = {
  id: string;
  label: string;
  color: string;
};

type AutomationsDialogProps = {
  open: boolean;
  column: Column | null;
  onClose: () => void;
};

type AutomationTrigger = "onEnter" | "onExit" | "onUpdate" | "timeInColumn";

type AutomationAction =
  | "sendNotification"
  | "assignUser"
  | "setDueDate"
  | "moveToColumn"
  | "addComment"
  | "changePriority";

type AutomationActionConfig = {
  id: string;
  action: AutomationAction;
  params: Record<string, any>;
};

type AutomationRule = {
  id: string;
  trigger: AutomationTrigger;
  triggerParams: Record<string, any>;
  actions: AutomationActionConfig[];
};

const triggerOptions: { value: AutomationTrigger; label: string }[] = [
  { value: "onEnter", label: "When ticket enters column" },
  { value: "onExit", label: "When ticket leaves column" },
  { value: "onUpdate", label: "When ticket is updated in column" },
  { value: "timeInColumn", label: "If ticket has been in column for X days" },
];

const actionOptions: { value: AutomationAction; label: string }[] = [
  { value: "sendNotification", label: "Send notification" },
  { value: "assignUser", label: "Assign user" },
  { value: "setDueDate", label: "Set due date" },
  { value: "moveToColumn", label: "Move to another column" },
  { value: "addComment", label: "Add comment" },
  { value: "changePriority", label: "Change priority" },
];

// Helper for generating unique IDs
function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now();
}

export default function AutomationsDialog({ open, column, onClose }: AutomationsDialogProps) {
  // Local state for automations enabled and rules
  const [enabled, setEnabled] = React.useState<boolean>(true);
  const [rules, setRules] = React.useState<AutomationRule[]>([]);

  // Reset state when dialog opens/closes or column changes
  React.useEffect(() => {
    if (open) {
      setEnabled(true);
      setRules([]);
    }
  }, [open, column]);

  // Handler for adding a new rule
  const handleAddRule = () => {
    setRules((prev) => [
      ...prev,
      {
        id: generateId(),
        trigger: "onEnter",
        triggerParams: {},
        actions: [
          {
            id: generateId(),
            action: "sendNotification",
            params: {},
          },
        ],
      },
    ]);
  };

  // Handler for removing a rule
  const handleRemoveRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Handler for changing a rule's trigger
  const handleRuleTriggerChange = (ruleId: string, trigger: AutomationTrigger) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              trigger,
              triggerParams: {},
            }
          : r,
      ),
    );
  };

  // Handler for changing a rule's trigger params
  const handleRuleTriggerParamChange = (ruleId: string, param: string, value: any) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              triggerParams: {
                ...r.triggerParams,
                [param]: value,
              },
            }
          : r,
      ),
    );
  };

  // Handler for adding an action to a rule
  const handleAddAction = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              actions: [
                ...r.actions,
                {
                  id: generateId(),
                  action: "sendNotification",
                  params: {},
                },
              ],
            }
          : r,
      ),
    );
  };

  // Handler for removing an action from a rule
  const handleRemoveAction = (ruleId: string, actionId: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              actions: r.actions.filter((a) => a.id !== actionId),
            }
          : r,
      ),
    );
  };

  // Handler for changing an action type
  const handleActionTypeChange = (ruleId: string, actionId: string, action: AutomationAction) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              actions: r.actions.map((a) => (a.id === actionId ? { ...a, action, params: {} } : a)),
            }
          : r,
      ),
    );
  };

  // Handler for changing an action's params
  const handleActionParamChange = (ruleId: string, actionId: string, param: string, value: any) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              actions: r.actions.map((a) =>
                a.id === actionId
                  ? {
                      ...a,
                      params: {
                        ...a.params,
                        [param]: value,
                      },
                    }
                  : a,
              ),
            }
          : r,
      ),
    );
  };

  // Render action-specific config fields
  function renderActionFields(ruleId: string, actionConfig: AutomationActionConfig) {
    switch (actionConfig.action) {
      case "sendNotification":
        return (
          <TextField
            label="Notification Message"
            value={actionConfig.params.message || ""}
            onChange={(e) =>
              handleActionParamChange(ruleId, actionConfig.id, "message", e.target.value)
            }
            fullWidth
            size="small"
            margin="dense"
          />
        );
      case "assignUser":
        return (
          <TextField
            label="User Email"
            value={actionConfig.params.user || ""}
            onChange={(e) =>
              handleActionParamChange(ruleId, actionConfig.id, "user", e.target.value)
            }
            fullWidth
            size="small"
            margin="dense"
            placeholder="user@example.com"
          />
        );
      case "setDueDate":
        return (
          <TextField
            label="Due Date"
            type="date"
            value={actionConfig.params.dueDate || ""}
            onChange={(e) =>
              handleActionParamChange(ruleId, actionConfig.id, "dueDate", e.target.value)
            }
            fullWidth
            size="small"
            margin="dense"
            InputLabelProps={{ shrink: true }}
          />
        );
      case "moveToColumn":
        return (
          <TextField
            label="Target Column ID"
            value={actionConfig.params.targetColumn || ""}
            onChange={(e) =>
              handleActionParamChange(ruleId, actionConfig.id, "targetColumn", e.target.value)
            }
            fullWidth
            size="small"
            margin="dense"
            placeholder="Column ID"
          />
        );
      case "addComment":
        return (
          <TextField
            label="Comment"
            value={actionConfig.params.comment || ""}
            onChange={(e) =>
              handleActionParamChange(ruleId, actionConfig.id, "comment", e.target.value)
            }
            fullWidth
            size="small"
            margin="dense"
          />
        );
      case "changePriority":
        return (
          <FormControl fullWidth size="small" margin="dense">
            <InputLabel>Priority</InputLabel>
            <Select
              label="Priority"
              value={actionConfig.params.priority || ""}
              onChange={(e) =>
                handleActionParamChange(ruleId, actionConfig.id, "priority", e.target.value)
              }
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
        );
      default:
        return null;
    }
  }

  // Render trigger-specific config fields
  function renderTriggerFields(rule: AutomationRule) {
    if (rule.trigger === "timeInColumn") {
      return (
        <TextField
          label="Number of days"
          type="number"
          inputProps={{ min: 1 }}
          value={rule.triggerParams.days || ""}
          onChange={(e) => handleRuleTriggerParamChange(rule.id, "days", e.target.value)}
          fullWidth
          size="small"
          margin="dense"
          sx={{ maxWidth: 180, mt: 1 }}
        />
      );
    }
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{column ? `Automations for "${column.label}"` : "Automations"}</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Alert severity="info" sx={{ mb: 2 }}>
            This is a proof-of-concept (POC) feature. Changes made here are not persisted.
          </Alert>
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Enable automations for this column"
          />
        </Box>
        {!enabled ? (
          <Typography color="text.secondary" mb={2}>
            Automations are disabled for this column.
          </Typography>
        ) : (
          <>
            {rules.length === 0 && (
              <Typography color="text.secondary" mb={2}>
                No automation rules configured yet.
              </Typography>
            )}
            <Grid container spacing={2} direction="column">
              {rules.map((rule) => (
                <Grid size={{ xs: 12 }} key={rule.id}>
                  <Paper variant="outlined" sx={{ p: 2, position: "relative" }}>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Trigger</InputLabel>
                        <Select
                          label="Trigger"
                          value={rule.trigger}
                          onChange={(e) =>
                            handleRuleTriggerChange(rule.id, e.target.value as AutomationTrigger)
                          }
                        >
                          {triggerOptions.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Tooltip title="Remove rule">
                        <IconButton
                          aria-label="Remove rule"
                          onClick={() => handleRemoveRule(rule.id)}
                          size="small"
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box mb={2}>{renderTriggerFields(rule)}</Box>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Actions
                    </Typography>
                    {rule.actions.length === 0 && (
                      <Typography color="text.secondary" mb={1}>
                        No actions configured for this trigger.
                      </Typography>
                    )}
                    {rule.actions.map((actionConfig) => (
                      <Paper
                        key={actionConfig.id}
                        variant="outlined"
                        sx={{ p: 2, mb: 2, background: "#fafbfc" }}
                      >
                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Action</InputLabel>
                            <Select
                              label="Action"
                              value={actionConfig.action}
                              onChange={(e) =>
                                handleActionTypeChange(
                                  rule.id,
                                  actionConfig.id,
                                  e.target.value as AutomationAction,
                                )
                              }
                            >
                              {actionOptions.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <Tooltip title="Remove action">
                            <IconButton
                              aria-label="Remove action"
                              onClick={() => handleRemoveAction(rule.id, actionConfig.id)}
                              size="small"
                              sx={{ ml: 1 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Box>{renderActionFields(rule.id, actionConfig)}</Box>
                      </Paper>
                    ))}
                    <Box mt={1} display="flex" justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => handleAddAction(rule.id)}
                        size="small"
                      >
                        Add Action
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddRule}
                disabled={!enabled}
              >
                Add Automation Rule
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
