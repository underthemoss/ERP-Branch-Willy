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
import { DataGridPremium, GridActionsCellItem, GridColDef } from "@mui/x-data-grid-premium";
import { format } from "date-fns";
import * as React from "react";
import { generateReferenceNumberPreview } from "./generateReferenceNumberPreview";
import ReferenceNumberPreview from "./ReferenceNumberPreview";

interface ReferenceNumbersSectionProps {
  projectId?: string;
  businessContactId?: string;
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

export default function ReferenceNumbersSection({
  projectId,
  businessContactId,
}: ReferenceNumbersSectionProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<TemplateFormData>(defaultFormData);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const { data, loading, error, refetch } = useListReferenceNumberTemplatesQuery({
    variables: {
      filter: { projectId, businessContactId },
      page: { size: 100 },
    },
    fetchPolicy: "cache-and-network",
  });

  // Fetch project data to get project code and parent project code (only if projectId is provided)
  const { data: projectData } = useGetProjectByIdForDisplayQuery({
    variables: { id: projectId || "" },
    skip: !projectId,
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
        businessContactId,
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

  const handleDelete = React.useCallback(
    async (templateId: string) => {
      if (!confirm("Are you sure you want to delete this template?")) return;

      try {
        await deleteTemplate({
          variables: { id: templateId },
        });
        await refetch();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to delete template");
      }
    },
    [deleteTemplate, refetch, setErrorMsg],
  );

  // Check if all template types are configured
  const allTypesConfigured = React.useMemo(() => {
    const types = ["PO", "SO", "INVOICE"] as const;
    return types.every((type) => projectTemplates.some((template) => template.type === type));
  }, [projectTemplates]);

  // Prepare data for DataGrid
  const rows = React.useMemo(() => {
    return projectTemplates.map((template) => ({
      id: template.id,
      type: template.type,
      typeLabel: typeLabels[template.type as keyof typeof typeLabels],
      template: template.template,
      seqPadding: template.seqPadding || 4,
      startAt: template.startAt || 1,
      resetFrequency: template.resetFrequency || "yearly",
      resetFrequencyLabel: resetFrequencyLabels[template.resetFrequency || "yearly"],
      useGlobalSequence: template.useGlobalSequence || false,
    }));
  }, [projectTemplates]);

  // Define columns for DataGrid
  const columns: GridColDef[] = React.useMemo(
    () => [
      {
        field: "typeLabel",
        headerName: "Type",
        width: 150,
        sortable: true,
      },
      {
        field: "template",
        headerName: "Template",
        width: 300,
        sortable: true,
        renderCell: (params) => (
          <Typography variant="body2" fontFamily="monospace">
            {params.value}
          </Typography>
        ),
      },
      {
        field: "preview",
        headerName: "Preview",
        width: 250,
        sortable: false,
        renderCell: (params) => {
          const preview = generateReferenceNumberPreview({
            template: params.row.template,
            seqPadding: params.row.seqPadding,
            startAt: params.row.startAt,
            projectCode: projectData?.getProjectById?.project_code,
            parentProjectCode: parentProjectData?.getProjectById?.project_code,
          });
          return (
            <Chip
              label={preview}
              variant="outlined"
              size="small"
              sx={{
                fontFamily: "monospace",
                fontWeight: 600,
                fontSize: "0.75rem",
                bgcolor: "background.paper",
              }}
            />
          );
        },
      },
      {
        field: "resetFrequencyLabel",
        headerName: "Reset Frequency",
        width: 150,
        sortable: true,
        renderCell: (params) => <Chip label={params.value} size="small" color="info" />,
      },
      {
        field: "useGlobalSequence",
        headerName: "Global Sequence",
        width: 150,
        sortable: true,
        // renderCell: (params) =>
        //   params.value ? <Chip label="Global" size="small" color="secondary" /> : null,
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Actions",
        width: 120,
        getActions: (params) => [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            onClick={() => handleOpenDialog(projectTemplates.find((t) => t.id === params.id))}
          />,
          <GridActionsCellItem
            key="delete"
            icon={<DeleteIcon />}
            label="Delete"
            onClick={() => handleDelete(params.id as string)}
            disabled={deleting}
          />,
        ],
      },
    ],
    [projectData, parentProjectData, deleting, projectTemplates, handleDelete],
  );

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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="small"
        >
          Add Template
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {projectTemplates.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
          sx={{
            bgcolor: "background.paper",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Reference Number Templates
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create templates to automatically generate reference numbers for your documents.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Create First Template
          </Button>
        </Box>
      ) : (
        <Box sx={{ width: "100%" }}>
          <DataGridPremium
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            autoHeight
            initialState={{
              sorting: {
                sortModel: [{ field: "type", sort: "asc" }],
              },
            }}
            sx={{
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
              },
            }}
          />
        </Box>
      )}

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
