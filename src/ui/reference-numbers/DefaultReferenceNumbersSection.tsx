"use client";

import {
  useCreateReferenceNumberTemplateMutation,
  useGetDefaultTemplatesQuery,
  useUpdateReferenceNumberTemplateMutation,
} from "@/graphql/hooks";
import { useSelectedWorkspaceId } from "@/providers/WorkspaceProvider";
import AddIcon from "@mui/icons-material/Add";
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
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { DataGridPremium, GridActionsCellItem, GridColDef } from "@mui/x-data-grid-premium";
import * as React from "react";
import { generateReferenceNumberPreview } from "./generateReferenceNumberPreview";
import ReferenceNumberPreview from "./ReferenceNumberPreview";

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

export default function DefaultReferenceNumbersSection() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<TemplateFormData>(defaultFormData);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const workspaceId = useSelectedWorkspaceId();

  const { data, loading, error, refetch } = useGetDefaultTemplatesQuery({
    variables: {
      workspaceId: workspaceId || "",
    },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const [createTemplate, { loading: creating }] = useCreateReferenceNumberTemplateMutation();
  const [updateTemplate, { loading: updating }] = useUpdateReferenceNumberTemplateMutation();

  // Filter out deleted templates
  const defaultTemplates = React.useMemo(() => {
    if (!data?.getDefaultTemplates) return [];
    return data.getDefaultTemplates.filter((template) => !template.deleted);
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

      if (!workspaceId) {
        setErrorMsg("Workspace ID is required");
        return;
      }

      const input = {
        type: formData.type as any,
        template: formData.template,
        seqPadding: formData.seqPadding,
        startAt: formData.startAt,
        resetFrequency: formData.resetFrequency as any,
        useGlobalSequence: formData.useGlobalSequence,
        // For default templates, both projectId and businessContactId should be null
        projectId: undefined,
        businessContactId: undefined,
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
          variables: {
            input: {
              ...input,
              workspaceId,
            },
          },
        });
      }

      await refetch();
      handleCloseDialog();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save template");
    }
  };

  // Check if all template types are configured
  const allTypesConfigured = React.useMemo(() => {
    const types = ["PO", "SO", "INVOICE"] as const;
    return types.every((type) => defaultTemplates.some((template) => template.type === type));
  }, [defaultTemplates]);

  // Prepare data for DataGrid
  const rows = React.useMemo(() => {
    return defaultTemplates.map((template) => ({
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
  }, [defaultTemplates]);

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
            // No project codes for default templates
            projectCode: undefined,
            parentProjectCode: undefined,
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
        renderCell: (params) =>
          params.value ? <Chip label="Global" size="small" color="secondary" /> : null,
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
            onClick={() => handleOpenDialog(defaultTemplates.find((t) => t.id === params.id))}
          />,
        ],
      },
    ],
    [defaultTemplates],
  );

  if (loading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading default reference number templates...
      </Typography>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load default reference number templates: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {!allTypesConfigured && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Not all reference number types have default templates configured. Consider adding
          templates for:{" "}
          {["PO", "SO", "INVOICE"]
            .filter((type) => !defaultTemplates.some((template) => template.type === type))
            .map((type) => typeLabels[type as keyof typeof typeLabels])
            .join(", ")}
        </Alert>
      )}

      {defaultTemplates.length === 0 ? (
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
            No Default Reference Number Templates
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create default templates that will be used for all new projects and contacts.
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
          {editingTemplate
            ? "Edit Default Reference Number Template"
            : "Create Default Reference Number Template"}
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
              helperText="Use {YYYY}, {YY}, {MM}, {DD}, {seq}, {projectCode}, {parentProjectCode} as placeholders. Example: PO-{YYYY}-{MM}-{seq}"
              required
            />

            {formData.template && (
              <ReferenceNumberPreview
                template={formData.template}
                seqPadding={formData.seqPadding}
                startAt={formData.startAt}
                // No project codes for default templates
                projectCode={undefined}
                parentProjectCode={undefined}
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
