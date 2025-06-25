"use client";

import { graphql } from "@/graphql";
import {
  useCreateWorkflowConfigurationMutation,
  useDeleteWorkflowConfigurationByIdMutation,
  useListWorkflowConfigurationsQuery,
} from "@/graphql/hooks";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { DataGridPremium, GridColDef, GridRowParams } from "@mui/x-data-grid-premium";
import { PageContainer } from "@toolpad/core";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";

// Utility for pretty printing dates
function formatDate(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

// Utility for pretty printing user names
function formatUser(
  user?: { firstName?: string | null; lastName?: string | null } | null,
  fallback?: string | null,
) {
  if (!user) return fallback || "";
  const first = user.firstName || "";
  const last = user.lastName || "";
  const full = `${first} ${last}`.trim();
  return full || fallback || "";
}

// GQL query declarations (for codegen)
graphql(`
  query ListWorkflowConfigurations {
    listWorkflowConfigurations {
      items {
        id
        name
        columns {
          id
          name
        }
        companyId
        createdAt
        createdBy
        createdByUser {
          firstName
          lastName
        }
        updatedAt
        updatedBy
        updatedByUser {
          firstName
          lastName
        }
        deletedAt
        deletedBy
      }
    }
  }
`);

graphql(`
  mutation DeleteWorkflowConfigurationById($id: ID!) {
    deleteWorkflowConfigurationById(id: $id)
  }
`);

graphql(`
  mutation CreateWorkflowConfiguration($input: CreateWorkflowConfigurationInput!) {
    createWorkflowConfiguration(input: $input) {
      id
      name
    }
  }
`);

export default function WorkflowConfigurationsPage() {
  const router = useRouter();
  const { data, loading, refetch } = useListWorkflowConfigurationsQuery({
    fetchPolicy: "cache-and-network",
  });
  const { workspace_id } = useParams();
  // Search state
  const [search, setSearch] = useState("");
  const filteredRows =
    data?.listWorkflowConfigurations?.items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [creating, setCreating] = useState(false);

  const [deleteWorkflowConfiguration, { loading: deleting }] =
    useDeleteWorkflowConfigurationByIdMutation();
  const [createWorkflowConfiguration] = useCreateWorkflowConfigurationMutation();

  // Delete logic
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const res = await deleteWorkflowConfiguration({ variables: { id: deleteId } });
      if (res.data?.deleteWorkflowConfigurationById) {
        setSnackbar({
          open: true,
          message: "Workflow configuration deleted.",
          severity: "success",
        });
        refetch();
      } else {
        setSnackbar({
          open: true,
          message: "Failed to delete workflow configuration.",
          severity: "error",
        });
      }
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Error deleting workflow configuration.",
        severity: "error",
      });
    }
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  // Create logic
  const handleCreateOpen = () => {
    setCreateDialogOpen(true);
    setNewWorkflowName("");
  };

  const handleCreateClose = () => {
    setCreateDialogOpen(false);
    setNewWorkflowName("");
  };

  const handleCreateConfirm = async () => {
    if (!newWorkflowName.trim()) return;
    setCreating(true);
    try {
      const res = await createWorkflowConfiguration({
        variables: { input: { name: newWorkflowName.trim(), columns: [] } },
      });
      const workflow = res.data?.createWorkflowConfiguration;
      if (workflow?.id) {
        setSnackbar({
          open: true,
          message: "Workflow configuration created.",
          severity: "success",
        });
        setCreateDialogOpen(false);
        setNewWorkflowName("");
        refetch();
        router.push(`/app/[${workspace_id}/settings/workflows/${workflow.id}`);
      } else {
        setSnackbar({
          open: true,
          message: "Failed to create workflow configuration.",
          severity: "error",
        });
      }
    } catch (e) {
      setSnackbar({
        open: true,
        message: "Error creating workflow configuration.",
        severity: "error",
      });
    }
    setCreating(false);
  };

  const rows =
    filteredRows.map((item) => ({
      id: item.id,
      name: item.name,
      columns: item.columns.map((col) => col.name).join(", "),
      companyId: item.companyId,
      createdAt: formatDate(item.createdAt),
      createdBy: formatUser(item.createdByUser, item.createdBy),
      updatedAt: formatDate(item.updatedAt),
      updatedBy: formatUser(item.updatedByUser, item.updatedBy),
      deletedAt: formatDate(item.deletedAt),
      deletedBy: item.deletedBy ?? "",
    })) ?? [];

  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 200 },
    { field: "columns", headerName: "Columns", flex: 1, minWidth: 200 },
    { field: "createdAt", headerName: "Created At", flex: 1, minWidth: 180 },
    { field: "createdBy", headerName: "Created By", flex: 1, minWidth: 150 },
    { field: "updatedAt", headerName: "Updated At", flex: 1, minWidth: 180 },
    { field: "updatedBy", headerName: "Updated By", flex: 1, minWidth: 150 },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          aria-label="delete"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteClick(params.row.id);
          }}
          disabled={deleting}
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  // Row click navigation
  const handleRowClick = (params: GridRowParams) => {
    router.push(`/app/${workspace_id}/settings/workflows/${params.row.id}`);
  };

  return (
    <PageContainer>
      <Container maxWidth="xl">
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={1}>
          <Box>
            <Typography variant="h1">Workflow Configurations</Typography>
            <Typography variant="body1" color="text.secondary" mt={1}>
              Manage workflow configuration for this workspace. Create, search, and delete workflow
              configurations.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ textTransform: "none", fontWeight: 600 }}
            onClick={handleCreateOpen}
          >
            Create Workflow Configuration
          </Button>
        </Box>
        <Box mb={2} display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search workflows"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
        </Box>
        <Box sx={{ height: 600 }}>
          <div style={{ height: "100%" }}>
            <DataGridPremium
              columns={columns}
              rows={rows}
              loading={loading}
              disableRowSelectionOnClick
              hideFooter
              getRowId={(row) => row.id}
              onRowClick={handleRowClick}
              initialState={{
                pinnedColumns: { left: ["id"] },
              }}
              sx={{
                cursor: "pointer",
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
            />
          </div>
        </Box>
        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>Delete Workflow Configuration</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this workflow configuration? This action cannot be
              undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" disabled={deleting} autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onClose={handleCreateClose}>
          <DialogTitle>Create Workflow Configuration</DialogTitle>
          <DialogContent>
            <DialogContentText>Enter a name for the new workflow configuration.</DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Workflow Name"
              type="text"
              fullWidth
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              disabled={creating}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateConfirm();
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCreateClose} disabled={creating}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateConfirm}
              color="primary"
              disabled={creating || !newWorkflowName.trim()}
              variant="contained"
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </PageContainer>
  );
}
