"use client";

import { graphql } from "@/graphql";
import { ContactType } from "@/graphql/graphql";
import {
  useContactSelectorListQuery,
  useCreateIntakeFormMutation,
  useDeleteIntakeFormMutation,
  useListIntakeFormsQuery,
  useListIntakeFormSubmissionsQuery,
  useUpdateIntakeFormMutation,
} from "@/graphql/hooks";
import SubmissionsTable from "@/ui/intake-forms/SubmissionsTable";
import { useListPriceBooksQuery } from "@/ui/prices/api";
import ProjectSelector from "@/ui/ProjectSelector";
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
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
  Autocomplete,
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
  Popover,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import { DataGridPremium, GridColDef, GridRenderCellParams } from "@mui/x-data-grid-premium";
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
        pricebook {
          id
          name
        }
        isActive
        createdAt
        updatedAt
        isPublic
        sharedWithUsers {
          id
          email
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

graphql(`
  mutation UpdateIntakeForm($id: String!, $input: UpdateIntakeFormInput!) {
    updateIntakeForm(id: $id, input: $input) {
      id
      workspaceId
      projectId
      isActive
      createdAt
      updatedAt
      isPublic
      sharedWithUsers {
        id
        email
      }
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
  pricebook?: { id: string; name: string } | null;
  isActive: boolean;
  isPublic?: boolean;
  sharedWithUsers?: { id: string; email: string }[];
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
  const [newFormPricebookId, setNewFormPricebookId] = useState("");
  const [newFormIsPublic, setNewFormIsPublic] = useState(false);
  const [sharedEmails, setSharedEmails] = useState<string[]>([]);
  const [shareSelected, setShareSelected] = useState<(string | { email: string; name: string })[]>(
    [],
  );
  const [shareInputValue, setShareInputValue] = useState("");
  const [shareError, setShareError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const [usersPopoverAnchor, setUsersPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverUsers, setPopoverUsers] = useState<{ id: string; email: string }[]>([]);

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

  // Fetch pricebooks for dropdown
  const { data: priceBooksData, loading: priceBooksLoading } = useListPriceBooksQuery({
    variables: { page: { number: 1, size: 200 }, filter: { workspaceId } },
    fetchPolicy: "cache-and-network",
  });

  // Contacts for share suggestions
  const { data: contactsData } = useContactSelectorListQuery({
    variables: { workspaceId, page: { number: 1, size: 1000 }, contactType: ContactType.Person },
    fetchPolicy: "cache-and-network",
  });

  const personOptions = React.useMemo(() => {
    const items = contactsData?.listContacts?.items || [];
    const persons: { email: string; name: string }[] = items
      .filter((c: any) => c?.__typename === "PersonContact" && c.email)
      .map((c: any) => ({ email: c.email, name: c.name }));
    const seen = new Set<string>();
    return persons.filter((p) => (seen.has(p.email) ? false : (seen.add(p.email), true)));
  }, [contactsData]);

  // Hide already-selected emails from suggestions to prevent toggling/removal behavior
  const filteredPersonOptions = React.useMemo(
    () => personOptions.filter((p) => !sharedEmails.includes(p.email)),
    [personOptions, sharedEmails],
  );

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const emailFilter = createFilterOptions<{ email: string; name: string }>({
    stringify: (o) => `${o.name} ${o.email}`,
  });

  const [createIntakeForm, { loading: createLoading }] = useCreateIntakeFormMutation({
    onCompleted: () => {
      setCreateDialogOpen(false);
      setNewFormName("");
      setNewFormProjectId("");
      setNewFormActive(true);
      setNewFormPricebookId("");
      setNewFormIsPublic(false);
      setSharedEmails([]);
      setShareSelected([]);
      setShareInputValue("");
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

  const [updateIntakeForm, { loading: updateLoading }] = useUpdateIntakeFormMutation({
    onCompleted: () => {
      setEditDialogOpen(false);
      setEditingFormId(null);
      setNewFormProjectId("");
      setNewFormActive(true);
      setNewFormPricebookId("");
      setNewFormIsPublic(false);
      setSharedEmails([]);
      setShareSelected([]);
      setShareInputValue("");
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
    await createIntakeForm({
      variables: {
        input: {
          workspaceId,
          projectId: newFormProjectId || null,
          isActive: newFormActive,
          isPublic: newFormIsPublic,
          pricebookId: newFormPricebookId || null,
          sharedWithEmails: newFormIsPublic ? [] : sharedEmails,
        },
      },
    });
  };

  const handleUpdateForm = async () => {
    if (!editingFormId) return;

    await updateIntakeForm({
      variables: {
        id: editingFormId,
        input: {
          projectId: newFormProjectId || null,
          isActive: newFormActive,
          isPublic: newFormIsPublic,
          pricebookId: newFormPricebookId || null,
          sharedWithEmails: newFormIsPublic ? [] : sharedEmails,
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

  const forms: IntakeForm[] = (data?.listIntakeForms?.items as IntakeForm[]) || [];
  const filteredForms = forms.filter((form) =>
    form.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const allSubmissions = (submissionsData?.listIntakeFormSubmissions?.items as any[]) || [];

  // Calculate submission counts per form
  const submissionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allSubmissions.forEach((submission) => {
      if (submission.formId) {
        counts[submission.formId] = (counts[submission.formId] || 0) + 1;
      }
    });
    return counts;
  }, [allSubmissions]);

  // Prepare rows for DataGrid
  const rows = React.useMemo(() => {
    return filteredForms.map((form) => ({
      ...form,
      submissions: submissionCounts[form.id] || 0,
      projectName: form.project?.name || form.project?.projectCode || form.projectId || "-",
      pricebookName: form.pricebook?.name || "-",
    }));
  }, [filteredForms, submissionCounts]);

  // Define columns for DataGrid
  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Form ID",
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" fontFamily="monospace" sx={{ mr: 1 }}>
            {params.value}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLink(params.value as string);
            }}
            title="Copy form link"
            sx={{ padding: "4px" }}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
    {
      field: "projectName",
      headerName: "Project",
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams) => {
        const form = params.row as IntakeForm;
        if (!form.project) {
          return <Typography variant="body2">-</Typography>;
        }
        return (
          <Typography
            variant="body2"
            component="a"
            href={`/app/${workspaceId}/projects/${form.project.id}`}
            onClick={(e) => {
              e.preventDefault();
              router.push(`/app/${workspaceId}/projects/${form.project!.id}`);
            }}
            sx={{
              color: "primary.main",
              textDecoration: "none",
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            {form.project.name || form.project.projectCode}
          </Typography>
        );
      },
    },
    {
      field: "pricebookName",
      headerName: "Pricebook",
      flex: 1,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => {
        const form = params.row as IntakeForm;
        if (!form.pricebook) {
          return <Typography variant="body2">-</Typography>;
        }
        return (
          <Typography
            variant="body2"
            component="a"
            href={`/app/${workspaceId}/prices/price-books/${form.pricebook.id}`}
            onClick={(e) => {
              e.preventDefault();
              router.push(`/app/${workspaceId}/prices/price-books/${form.pricebook!.id}`);
            }}
            sx={{
              color: "primary.main",
              textDecoration: "none",
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            {form.pricebook.name}
          </Typography>
        );
      },
    },
    {
      field: "isPublic",
      headerName: "Visibility",
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? "Public" : "Private"}
          color={params.value ? "info" : "warning"}
          size="small"
        />
      ),
    },
    {
      field: "sharedWithUsers",
      headerName: "Shared With",
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        const users = params.value as { id: string; email: string }[] | undefined;

        const content = (() => {
          if (!users || users.length === 0) {
            return (
              <Typography variant="body2" color="text.secondary">
                -
              </Typography>
            );
          }

          const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
            setUsersPopoverAnchor(event.currentTarget);
            setPopoverUsers(users);
          };

          const handlePopoverClose = () => {
            setUsersPopoverAnchor(null);
            setPopoverUsers([]);
          };

          if (users.length === 1) {
            return <Chip label={users[0].email} size="small" sx={{ maxWidth: "140px" }} />;
          }

          return (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Chip label={users[0].email} size="small" sx={{ maxWidth: "100px" }} />
              <Chip
                label={`+${users.length - 1}`}
                size="small"
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
                sx={{ cursor: "pointer" }}
              />
            </Stack>
          );
        })();

        return <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>{content}</Box>;
      },
    },
    {
      field: "isActive",
      headerName: "Status",
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? "Active" : "Inactive"}
          color={params.value ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "submissions",
      headerName: "Submissions",
      width: 120,
      type: "number",
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 150,
      valueFormatter: (value) => {
        const date = new Date(value);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      },
    },
    {
      field: "updatedAt",
      headerName: "Updated",
      width: 150,
      valueFormatter: (value) => {
        const date = new Date(value);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 80,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: "right",
      headerAlign: "right",
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleMenuOpen(e, params.row as IntakeForm);
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

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

      {/* Forms DataGrid */}
      <Paper sx={{ height: 300, width: "100%" }}>
        {!loading && rows.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              flexDirection: "column",
            }}
          >
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
        ) : (
          <DataGridPremium
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
              columns: {
                columnVisibilityModel: {
                  isActive: false,
                },
              },
            }}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-cell:focus": {
                outline: "none",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "action.hover",
              },
            }}
          />
        )}
      </Paper>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedForm) {
              // Populate form fields with selected form data
              setEditingFormId(selectedForm.id);
              setNewFormProjectId(selectedForm.projectId || "");
              setNewFormActive(selectedForm.isActive);
              setNewFormPricebookId(selectedForm.pricebook?.id || "");
              setNewFormIsPublic(selectedForm.isPublic || false);

              // Set shared emails
              const emails = selectedForm.sharedWithUsers?.map((u) => u.email) || [];
              setSharedEmails(emails);
              setShareSelected(emails);

              setEditDialogOpen(true);
            }
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Form
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedForm) {
              handleViewSubmissions(selectedForm.id);
            }
          }}
        >
          <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
          View Submissions
        </MenuItem>
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
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Pricebook (Optional)
              </Typography>
              <Autocomplete
                options={priceBooksData?.listPriceBooks?.items || []}
                getOptionLabel={(option) => option?.name ?? ""}
                loading={priceBooksLoading}
                value={
                  (priceBooksData?.listPriceBooks?.items || []).find(
                    (pb) => pb.id === newFormPricebookId,
                  ) || null
                }
                onChange={(_, newValue) => setNewFormPricebookId(newValue?.id || "")}
                renderInput={(params) => <TextField {...params} placeholder="Select a pricebook" />}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Choose a pricebook to drive pricing on this form
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Visibility
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={newFormIsPublic}
                    onChange={(e) => setNewFormIsPublic(e.target.checked)}
                  />
                }
                label={newFormIsPublic ? "Public (anyone with the link)" : "Private"}
              />
              {!newFormIsPublic && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Share with people
                  </Typography>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={filteredPersonOptions}
                    filterOptions={emailFilter}
                    value={shareSelected}
                    inputValue={shareInputValue}
                    onInputChange={(_, val) => {
                      setShareInputValue(val);
                      if (shareError) setShareError(null);
                    }}
                    onChange={(_, newValue) => {
                      const entries = newValue as (string | { email: string; name: string })[];
                      const invalids = entries.filter(
                        (v) => typeof v === "string" && !isValidEmail(v.trim()),
                      ) as string[];
                      const sanitized = entries.filter(
                        (v) => !(typeof v === "string" && !isValidEmail(v.trim())),
                      );
                      setShareSelected(sanitized as any);
                      const emails = sanitized
                        .map((v) => (typeof v === "string" ? v.trim() : v.email))
                        .filter((e) => e.length > 0);
                      setSharedEmails(Array.from(new Set(emails)));
                      if (invalids.length > 0) {
                        setShareError("Enter a valid email address");
                      } else {
                        setShareError(null);
                        setShareInputValue("");
                      }
                    }}
                    getOptionLabel={(option) =>
                      typeof option === "string" ? option : `${option.name} <${option.email}>`
                    }
                    renderTags={(value, getTagProps) =>
                      value.map((v, index) => {
                        const label = typeof v === "string" ? v : v.name ? `${v.name}` : v.email;
                        return (
                          <Chip
                            {...getTagProps({ index })}
                            key={typeof v === "string" ? v : v.email}
                            label={label}
                            size="small"
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="contact or email"
                        error={!!shareError}
                        helperText={shareError ?? undefined}
                        onKeyDown={(e) => {
                          if (!shareInputValue) return;
                          if (e.key === "Enter" || e.key === "," || e.key === " ") {
                            e.preventDefault();
                            const tokens = shareInputValue
                              .split(/[,\s]+/)
                              .map((t) => t.trim())
                              .filter(Boolean);
                            if (tokens.length > 0) {
                              const valid = tokens.filter((t) => isValidEmail(t));
                              const invalid = tokens.filter((t) => !isValidEmail(t));
                              const dedupedValid = valid.filter((t) => !sharedEmails.includes(t));
                              if (dedupedValid.length > 0) {
                                setShareSelected([
                                  ...shareSelected,
                                  ...dedupedValid,
                                ] as unknown as any);
                                setSharedEmails(
                                  Array.from(new Set([...sharedEmails, ...dedupedValid])),
                                );
                              }
                              if (invalid.length > 0) {
                                setShareError("Enter a valid email address");
                              } else {
                                setShareError(null);
                                setShareInputValue("");
                              }
                            }
                          }
                        }}
                      />
                    )}
                    isOptionEqualToValue={(opt, val) => {
                      const oEmail = typeof opt === "string" ? opt : opt.email;
                      const vEmail = typeof val === "string" ? val : val.email;
                      return oEmail === vEmail;
                    }}
                    ListboxProps={{ style: { maxHeight: 300 } }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    People selected from suggestions are added by email; custom entries are treated
                    as emails.
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={createLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreateForm} variant="contained" loading={createLoading}>
            {createLoading ? "Creating..." : "Create Form"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingFormId(null);
          setNewFormProjectId("");
          setNewFormActive(true);
          setNewFormPricebookId("");
          setNewFormIsPublic(false);
          setSharedEmails([]);
          setShareSelected([]);
          setShareInputValue("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Intake Form</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Update the settings for this intake form. The form URL will remain the same.
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
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Pricebook (Optional)
              </Typography>
              <Autocomplete
                options={priceBooksData?.listPriceBooks?.items || []}
                getOptionLabel={(option) => option?.name ?? ""}
                loading={priceBooksLoading}
                value={
                  (priceBooksData?.listPriceBooks?.items || []).find(
                    (pb) => pb.id === newFormPricebookId,
                  ) || null
                }
                onChange={(_, newValue) => setNewFormPricebookId(newValue?.id || "")}
                renderInput={(params) => <TextField {...params} placeholder="Select a pricebook" />}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                Choose a pricebook to drive pricing on this form
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Visibility
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={newFormIsPublic}
                    onChange={(e) => setNewFormIsPublic(e.target.checked)}
                  />
                }
                label={newFormIsPublic ? "Public (anyone with the link)" : "Private"}
              />
              {!newFormIsPublic && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Share with people
                  </Typography>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={filteredPersonOptions}
                    filterOptions={emailFilter}
                    value={shareSelected}
                    inputValue={shareInputValue}
                    onInputChange={(_, val) => {
                      setShareInputValue(val);
                      if (shareError) setShareError(null);
                    }}
                    onChange={(_, newValue) => {
                      const entries = newValue as (string | { email: string; name: string })[];
                      const invalids = entries.filter(
                        (v) => typeof v === "string" && !isValidEmail(v.trim()),
                      ) as string[];
                      const sanitized = entries.filter(
                        (v) => !(typeof v === "string" && !isValidEmail(v.trim())),
                      );
                      setShareSelected(sanitized as any);
                      const emails = sanitized
                        .map((v) => (typeof v === "string" ? v.trim() : v.email))
                        .filter((e) => e.length > 0);
                      setSharedEmails(Array.from(new Set(emails)));
                      if (invalids.length > 0) {
                        setShareError("Enter a valid email address");
                      } else {
                        setShareError(null);
                        setShareInputValue("");
                      }
                    }}
                    getOptionLabel={(option) =>
                      typeof option === "string" ? option : `${option.name} <${option.email}>`
                    }
                    renderTags={(value, getTagProps) =>
                      value.map((v, index) => {
                        const label = typeof v === "string" ? v : v.name ? `${v.name}` : v.email;
                        return (
                          <Chip
                            {...getTagProps({ index })}
                            key={typeof v === "string" ? v : v.email}
                            label={label}
                            size="small"
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="contact or email"
                        error={!!shareError}
                        helperText={shareError ?? undefined}
                        onKeyDown={(e) => {
                          if (!shareInputValue) return;
                          if (e.key === "Enter" || e.key === "," || e.key === " ") {
                            e.preventDefault();
                            const tokens = shareInputValue
                              .split(/[,\s]+/)
                              .map((t) => t.trim())
                              .filter(Boolean);
                            if (tokens.length > 0) {
                              const valid = tokens.filter((t) => isValidEmail(t));
                              const invalid = tokens.filter((t) => !isValidEmail(t));
                              const dedupedValid = valid.filter((t) => !sharedEmails.includes(t));
                              if (dedupedValid.length > 0) {
                                setShareSelected([
                                  ...shareSelected,
                                  ...dedupedValid,
                                ] as unknown as any);
                                setSharedEmails(
                                  Array.from(new Set([...sharedEmails, ...dedupedValid])),
                                );
                              }
                              if (invalid.length > 0) {
                                setShareError("Enter a valid email address");
                              } else {
                                setShareError(null);
                                setShareInputValue("");
                              }
                            }
                          }
                        }}
                      />
                    )}
                    isOptionEqualToValue={(opt, val) => {
                      const oEmail = typeof opt === "string" ? opt : opt.email;
                      const vEmail = typeof val === "string" ? val : val.email;
                      return oEmail === vEmail;
                    }}
                    ListboxProps={{ style: { maxHeight: 300 } }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    People selected from suggestions are added by email; custom entries are treated
                    as emails.
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditingFormId(null);
              setNewFormProjectId("");
              setNewFormActive(true);
              setNewFormPricebookId("");
              setNewFormIsPublic(false);
              setSharedEmails([]);
              setShareSelected([]);
              setShareInputValue("");
            }}
            disabled={updateLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpdateForm} variant="contained" loading={updateLoading}>
            {updateLoading ? "Updating..." : "Update Form"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Users Popover */}
      <Popover
        open={Boolean(usersPopoverAnchor)}
        anchorEl={usersPopoverAnchor}
        onClose={() => {
          setUsersPopoverAnchor(null);
          setPopoverUsers([]);
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        sx={{
          pointerEvents: "none",
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            Shared with {popoverUsers.length} users:
          </Typography>
          <Stack spacing={0.5}>
            {popoverUsers.map((user) => (
              <Chip
                key={user.id}
                label={user.email}
                size="small"
                sx={{ justifyContent: "flex-start" }}
              />
            ))}
          </Stack>
        </Box>
      </Popover>
    </Container>
  );
}
