"use client";

import {
  useCreateReferenceNumberTemplateMutation,
  useDeleteReferenceNumberTemplateMutation,
  useGetProjectByIdForDisplayQuery,
  useListReferenceNumberTemplatesQuery,
  useUpdateReferenceNumberTemplateMutation,
} from "@/graphql/hooks";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
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
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import * as React from "react";
import ReferenceNumberPreview from "./ReferenceNumberPreview";

interface ReferenceNumbersSectionProps {
  projectId: string;
}

interface TemplateFormData {
  type: "PO" | "SO" | "INVOICE";
  template: string;
  seqPadding: number;
  startAt: number;
  resetFrequency: "never" | "daily" | "monthly" | "yearly";
  useGlobalSequence: boolean;
}

const defaultFormData: TemplateFormData = {
  type: "PO",
  template: "PO-{YYYY}-{MM}-{seq}",
  seqPadding: 4,
  startAt: 1,
  resetFrequency: "yearly",
  useGlobalSequence: false,
};

const typeLabels = {
  PO: "Purchase Order",
  SO: "Sales Order",
  INVOICE: "Invoice",
};

const resetFrequencyLabels = {
  never: "Never",
  daily: "Daily",
  monthly: "Monthly",
  yearly: "Yearly",
};

export default function ReferenceNumbersSection({ projectId }: ReferenceNumbersSectionProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<TemplateFormData>(defaultFormData);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const { data, loading, error, refetch } = useListReferenceNumberTemplatesQuery({
    variables: {
      filter: { projectId },
      page: { size: 100 },
    },
    fetchPolicy: "cache-and-network",
  });

  // Fetch project data to get project code and parent project code
  const { data: projectData } = useGetProjectByIdForDisplayQuery({
    variables: { id: projectId },
    fetchPolicy: "cache-and-network",
  });

  // Fetch parent project data if there is a parent project
  const parentProjectId = projectData?.getProjectById?.parent_project;
  const { data: parentProjectData } = useGetProjectByIdForDisplayQuery({
    variables: { id: parentProjectId || "" },
    skip: !parentProjectId,
    fetchPolicy: "cache-and-network",
  });

  const [createTemplate, { loading: creating }] = useCreateReferenceNumberTemplateMutation();
  const [updateTemplate, { loading: updating }] = useUpdateReferenceNumberTemplateMutation();
  const [deleteTemplate, { loading: deleting }] = useDeleteReferenceNumberTemplateMutation();

  // Templates are already filtered by projectId on the server side
  const projectTemplates = React.useMemo(() => {
    if (!data?.listReferenceNumberTemplates) return [];
    return data.listReferenceNumberTemplates.filter((template) => !template.deleted);
  }, [data]);

  const handleOpenDialog = (template?: any) => {
    if (template) {
      setEditingTemplate(template.id);
      setFormData({
        type: template.type,
        template: template.template,
        seqPadding: template.seqPadding || 4,
        startAt: template.startAt || 1,
        resetFrequency: template.resetFrequency || "yearly",
        useGlobalSequence: template.useGlobalSequence || false,
      });
    } else {
      setEditingTemplate(null);
      setFormData(defaultFormData);
    }
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData(defaultFormData);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    try {
      setErrorMsg(null);

      const input = {
        type: formData.type as any,
        template: formData.template,
        seqPadding: formData.seqPadding,
        startAt: formData.startAt,
        resetFrequency: formData.resetFrequency as any,
        useGlobalSequence: formData.useGlobalSequence,
        projectId,
      };

      if (editingTemplate) {
        await updateTemplate({
          variables: {
            input: {
              id: editingTemplate,
              ...input,
            },
          },
        });
      } else {
        await createTemplate({
          variables: { input },
        });
      }

      await refetch();
      handleCloseDialog();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save template");
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await deleteTemplate({
        variables: { id: templateId },
      });
      await refetch();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete template");
    }
  };

  const getTemplatesByType = (type: string) => {
    return projectTemplates.filter((template) => template.type === type);
  };

  // Check if all template types are configured
  const allTypesConfigured = React.useMemo(() => {
    const types = ["PO", "SO", "INVOICE"] as const;
    return types.every((type) => getTemplatesByType(type).length > 0);
  }, [projectTemplates]);

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading reference number templates...
      </Typography>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load reference number templates: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Reference Number Templates</Typography>
        {!allTypesConfigured && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="small"
          >
            Add Template
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={2}>
        {(["PO", "SO", "INVOICE"] as const).map((type) => {
          const templates = getTemplatesByType(type);
          return (
            <Grid size={{ xs: 12, md: 4 }} key={type}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {typeLabels[type]}
                    </Typography>
                    {templates.length === 0 && (
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          handleOpenDialog({
                            type,
                            template: `${type}-{YYYY}-{MM}-{seq}`,
                            seqPadding: 4,
                            startAt: 1,
                            resetFrequency: "yearly",
                            useGlobalSequence: false,
                          })
                        }
                      >
                        Add {type}
                      </Button>
                    )}
                  </Box>

                  {templates.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                      No {typeLabels[type].toLowerCase()} templates configured
                    </Typography>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={1}>
                      {templates.map((template) => (
                        <Box
                          key={template.id}
                          sx={{
                            p: 1.5,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                            bgcolor: "background.paper",
                          }}
                        >
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box flex={1}>
                              <Typography variant="body2" fontWeight={500}>
                                {template.template}
                              </Typography>
                              <Box display="flex" gap={1} mt={0.5}>
                                <Chip
                                  label={resetFrequencyLabels[template.resetFrequency]}
                                  size="small"
                                  color="info"
                                />
                                {template.useGlobalSequence && (
                                  <Chip label="Global" size="small" color="secondary" />
                                )}
                              </Box>
                            </Box>
                            <Box display="flex" gap={0.5}>
                              <Tooltip title="Edit Template">
                                <IconButton size="small" onClick={() => handleOpenDialog(template)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Template">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(template.id)}
                                  disabled={deleting}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Template Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? "Edit Reference Number Template" : "Create Reference Number Template"}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                disabled={!!editingTemplate}
              >
                <MenuItem value="PO">Purchase Order</MenuItem>
                <MenuItem value="SO">Sales Order</MenuItem>
                <MenuItem value="INVOICE">Invoice</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Template"
              value={formData.template}
              onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              helperText="Use {YYYY}, {YY}, {MM}, {DD}, {seq}, {projectCode}, {parentProjectCode} as placeholders. Example: PO-{projectCode}-{YYYY}-{MM}-{seq}"
              required
            />

            {formData.template && (
              <ReferenceNumberPreview
                template={formData.template}
                seqPadding={formData.seqPadding}
                startAt={formData.startAt}
                projectCode={projectData?.getProjectById?.project_code}
                parentProjectCode={parentProjectData?.getProjectById?.project_code}
              />
            )}

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Sequence Padding"
                  type="number"
                  value={formData.seqPadding}
                  onChange={(e) =>
                    setFormData({ ...formData, seqPadding: parseInt(e.target.value) || 0 })
                  }
                  helperText="Number of digits for sequence (e.g., 4 = 0001)"
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Start At"
                  type="number"
                  value={formData.startAt}
                  onChange={(e) =>
                    setFormData({ ...formData, startAt: parseInt(e.target.value) || 1 })
                  }
                  helperText="Starting sequence number"
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth>
              <InputLabel>Reset Frequency</InputLabel>
              <Select
                value={formData.resetFrequency}
                label="Reset Frequency"
                onChange={(e) =>
                  setFormData({ ...formData, resetFrequency: e.target.value as any })
                }
              >
                <MenuItem value="never">Never</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.useGlobalSequence}
                    onChange={(e) =>
                      setFormData({ ...formData, useGlobalSequence: e.target.checked })
                    }
                  />
                }
                label="Use Global Sequence"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: 4 }}>
                {formData.useGlobalSequence
                  ? "Sequence will increment across all templates of this type (PO, SO, INVOICE), regardless of template format."
                  : "Sequence will be unique to this specific template only."}
              </Typography>
            </Box>

            {errorMsg && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {errorMsg}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={creating || updating || !formData.template.trim()}
          >
            {creating || updating ? "Saving..." : editingTemplate ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
