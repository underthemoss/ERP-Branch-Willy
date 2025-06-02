"use client";

import { graphql } from "@/graphql";
import {
  useDeleteProjectMutation,
  useGetProjectByIdQuery,
  useProjectCodeDescriptionsQuery,
} from "@/graphql/hooks";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

graphql(`
  query getProjectById($id: String!) {
    getProjectById(id: $id) {
      id
      name
      project_code
      description
      companyId
      created_at
      created_by
      updated_at
      deleted
      scope_of_work
      status
    }
  }
`);

graphql(`
  query ProjectCodeDescriptions {
    listProjectStatusCodes {
      code
      description
    }
    listScopeOfWorkCodes {
      code
      description
    }
  }

  mutation deleteProject($id: String!) {
    deleteProject(id: $id) {
      id
    }
  }
`);

export default function ProjectDetailPage() {
  const { projectid } = useParams<{ projectid: string }>();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleteProject, { loading: deleting }] = useDeleteProjectMutation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, loading, error } = useGetProjectByIdQuery({
    variables: { id: projectid ?? "" },
    skip: !projectid,
    fetchPolicy: "cache-and-network",
  });

  const { data: codeDescData } = useProjectCodeDescriptionsQuery();

  const scopeOfWorkDescMap = codeDescData?.listScopeOfWorkCodes
    ? Object.fromEntries(
        codeDescData.listScopeOfWorkCodes
          .filter(Boolean)
          .map((item) => [item!.code, item!.description]),
      )
    : {};

  const statusDescMap = codeDescData?.listProjectStatusCodes
    ? Object.fromEntries(
        codeDescData.listProjectStatusCodes
          .filter(Boolean)
          .map((item) => [item!.code, item!.description]),
      )
    : {};

  const project = data?.getProjectById;

  const handleDelete = async () => {
    if (!project?.id) return;
    try {
      await deleteProject({ variables: { id: project.id } });
      setOpen(false);
      router.push(`/app/${project.companyId}/projects`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete project.");
    }
  };

  return (
    <Box mt={6} mx="auto" maxWidth={600}>
      <Typography variant="h4" mb={3} fontWeight={600}>
        Project Details
      </Typography>
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}
      {!loading && !error && !project && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Project not found.
        </Alert>
      )}
      {project && (
        <Card elevation={3} data-testid="project-details">
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="h5" component="h1" fontWeight={700} gutterBottom>
                  {project.name}
                </Typography>
                <Divider />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Project Code
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="body1" fontWeight={500}>
                    {project.project_code}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="Copy Project Code"
                    data-testid="project-details-copy-code"
                    onClick={() => {
                      navigator.clipboard.writeText(project.project_code);
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {project.description || "—"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Company ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {project.companyId}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={project.deleted ? "Deleted" : "Active"}
                  color={project.deleted ? "default" : "success"}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Tooltip
                  title={format(parseISO(project.created_at), "MMMM d, yyyy, h:mm a")}
                  arrow
                  placement="top"
                >
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ cursor: "pointer", display: "inline" }}
                    data-testid="project-details-created-at"
                  >
                    {formatDistanceToNow(parseISO(project.created_at), { addSuffix: true })}
                  </Typography>
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Updated At
                </Typography>
                <Tooltip
                  title={format(parseISO(project.updated_at), "MMMM d, yyyy, h:mm a")}
                  arrow
                  placement="top"
                >
                  <Typography
                    variant="body2"
                    component="span"
                    sx={{ cursor: "pointer", display: "inline" }}
                    data-testid="project-details-updated-at"
                  >
                    {formatDistanceToNow(parseISO(project.updated_at), { addSuffix: true })}
                  </Typography>
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created By
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {project.created_by}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}></Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Scope of Work
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                  {project.scope_of_work && project.scope_of_work.length > 0 ? (
                    project.scope_of_work.filter(Boolean).map((code) => (
                      <Tooltip
                        key={code as string}
                        title={scopeOfWorkDescMap[code as string] || ""}
                        arrow
                      >
                        <Chip
                          label={code as string}
                          size="small"
                          sx={{
                            fontFamily: "monospace",
                            fontWeight: 600,
                            bgcolor: "primary.light",
                            color: "primary.contrastText",
                            letterSpacing: 0.5,
                          }}
                        />
                      </Tooltip>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Project Status
                </Typography>
                {project.status ? (
                  <Tooltip title={statusDescMap[project.status] || ""} arrow>
                    <Chip
                      label={project.status}
                      size="small"
                      sx={{
                        fontFamily: "monospace",
                        fontWeight: 600,
                        bgcolor: "info.light",
                        color: "info.contrastText",
                        letterSpacing: 0.5,
                      }}
                    />
                  </Tooltip>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box display="flex" alignItems="center" gap={1} mt={1} justifyContent="flex-end">
                  <Typography variant="body2" color="text.secondary">
                    Project ID:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    {project.id}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label="Copy Project ID"
                    data-testid="project-details-copy-id"
                    onClick={() => {
                      navigator.clipboard.writeText(project.id);
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      {project && (
        <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1} mt={2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => router.push(`/app/${project.companyId}/projects/${project.id}/edit`)}
            data-testid="project-details-edit-btn"
            aria-label="Edit Project"
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setOpen(true)}
            disabled={deleting}
            data-testid="project-details-delete-btn"
          >
            Delete
          </Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="delete-project-dialog-title"
          >
            <DialogTitle id="delete-project-dialog-title">Delete Project</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete this project? This action cannot be undone.
              </DialogContentText>
              {errorMsg && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errorMsg}
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                color="error"
                variant="contained"
                disabled={deleting}
                data-testid="project-details-confirm-delete-btn"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Box>
  );
}
