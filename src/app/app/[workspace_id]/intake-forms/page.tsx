"use client";

import { graphql } from "@/graphql";
import {
  useCreateIntakeFormMutation,
  useDeleteIntakeFormMutation,
  useListIntakeFormsQuery,
  useListIntakeFormSubmissionsQuery,
} from "@/graphql/hooks";
import SubmissionsTable from "@/ui/intake-forms/SubmissionsTable";
import ProjectSelector from "@/ui/ProjectSelector";
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Link as LinkIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";

// GraphQL queries and mutations
graphql(`
  query ListIntakeForms($workspaceId: String!) {
    listIntakeForms(workspaceId: $workspaceId) {
      items {
        id
        workspaceId
        projectId
        project {
          id
          name
          projectCode
        }
        workspace {
          id
          name
          logoUrl
          bannerImageUrl
        }
        isActive
        createdAt
        updatedAt
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`);

graphql(`
  mutation CreateIntakeForm($input: IntakeFormInput!) {
    createIntakeForm(input: $input) {
      id
      workspaceId
      projectId
      isActive
      createdAt
      updatedAt
    }
  }
`);

graphql(`
  query ListIntakeFormSubmissions($workspaceId: String!) {
    listIntakeFormSubmissions(workspaceId: $workspaceId) {
      items {
        id
        formId
        workspaceId
        name
        email
        createdAt
        phone
        companyName
        purchaseOrderNumber
        lineItems {
          description
          startDate
          type
          durationInDays
          quantity
        }
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`);

graphql(`
  mutation DeleteIntakeForm($id: String!) {
    deleteIntakeForm(id: $id) {
      id
    }
  }
`);

interface IntakeForm {
  id: string;
  projectId?: string | null;
  project?: { id: string; name: string; projectCode: string } | null;
  workspace?: {
    id: string;
    name: string;
    logoUrl?: string | null;
    bannerImageUrl?: string | null;
  } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  submissions?: number;
}

export default function IntakeFormsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspace_id as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedForm, setSelectedForm] = useState<IntakeForm | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormProjectId, setNewFormProjectId] = useState("");
  const [newFormActive, setNewFormActive] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch intake forms
  const { data, loading, refetch } = useListIntakeFormsQuery({
    variables: { workspaceId },
    fetchPolicy: "cache-and-network",
  });

  // Fetch submissions
  const { data: submissionsData, loading: submissionsLoading } = useListIntakeFormSubmissionsQuery({
    variables: { workspaceId },
    fetchPolicy: "cache-and-network",
  });

  const [createIntakeForm] = useCreateIntakeFormMutation({
    onCompleted: () => {
      setCreateDialogOpen(false);
      setNewFormName("");
      setNewFormProjectId("");
      setNewFormActive(true);
      refetch();
    },
  });

  const [deleteIntakeForm, { loading: deleteLoading }] = useDeleteIntakeFormMutation({
    onCompleted: () => {
      setDeleteDialogOpen(false);
      setSelectedForm(null);
      refetch();
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, form: IntakeForm) => {
    setAnchorEl(event.currentTarget);
    setSelectedForm(form);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedForm(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedForm) return;
    await deleteIntakeForm({ variables: { id: selectedForm.id } });
  };

  const handleCreateForm = async () => {
    const now = new Date().toISOString();
    await createIntakeForm({
      variables: {
        input: {
          workspaceId,
          projectId: newFormProjectId || null,
          isActive: newFormActive,
        },
      },
    });
  };

  const handleViewSubmissions = (formId: string) => {
    router.push(`/app/${workspaceId}/intake-forms/${formId}/submissions`);
  };

  const handleCopyLink = (formId: string) => {
    const link = `${window.location.origin}/intake-form/${formId}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
  };

  const forms = data?.listIntakeForms?.items || [];
  const filteredForms = forms.filter((form) =>
    form.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const allSubmissions = submissionsData?.listIntakeFormSubmissions?.items || [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Intake Forms
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Create and manage intake forms for collecting equipment requests
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Forms
              </Typography>
              <Typography variant="h4">{data?.listIntakeForms?.page?.totalItems || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Forms
              </Typography>
              <Typography variant="h4">{forms.filter((f) => f.isActive).length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Submissions
              </Typography>
              <Typography variant="h4">{allSubmissions.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                This Month
              </Typography>
              <Typography variant="h4">
                {
                  allSubmissions.filter((sub) => {
                    const subDate = new Date(sub.createdAt);
                    const now = new Date();
                    return (
                      subDate.getMonth() === now.getMonth() &&
                      subDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Intake Form
        </Button>
      </Box>

      {/* Forms Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Form ID</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submissions</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredForms.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      No intake forms yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Create your first intake form to start collecting requests
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setCreateDialogOpen(true)}
                      sx={{ mt: 2 }}
                    >
                      Create Intake Form
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {filteredForms.map((form) => (
              <TableRow key={form.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontFamily="monospace">
                      {form.id}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyLink(form.id)}
                      title="Copy form link"
                    >
                      <LinkIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
                <TableCell>
                  {form.project?.name || form.project?.projectCode || form.projectId || "-"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={form.isActive ? "Active" : "Inactive"}
                    color={form.isActive ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>0</TableCell>
                <TableCell>{new Date(form.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(form.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <IconButton
                      size="small"
                      onClick={() => handleViewSubmissions(form.id)}
                      title="View submissions"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, form as IntakeForm)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedForm) {
              window.open(`/intake-form/${selectedForm.id}`, "_blank");
            }
          }}
        >
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Preview Form
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedForm) {
              handleCopyLink(selectedForm.id);
            }
          }}
        >
          <CopyIcon fontSize="small" sx={{ mr: 1 }} />
          Copy Link
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setDeleteDialogOpen(true);
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Form
        </MenuItem>
      </Menu>

      {/* All Submissions Section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          All Form Submissions
        </Typography>
        <SubmissionsTable
          submissions={allSubmissions}
          loading={submissionsLoading}
          showFormId={true}
          emptyStateTitle="No submissions yet"
          emptyStateMessage="Submissions from all forms will appear here"
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Intake Form</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this intake form
            {selectedForm ? ` (${selectedForm.id})` : ""}? This will remove it from the list.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Form Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Intake Form</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Creating a new intake form will generate a unique URL that can be shared with external
            users to submit equipment requests.
          </Alert>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Project (Optional)
              </Typography>
              <ProjectSelector
                projectId={newFormProjectId}
                onChange={(projectId) => setNewFormProjectId(projectId)}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Associate this form with a specific project
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={newFormActive}
                  onChange={(e) => setNewFormActive(e.target.checked)}
                />
              }
              label="Active (Accept submissions)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateForm} variant="contained">
            Create Form
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
