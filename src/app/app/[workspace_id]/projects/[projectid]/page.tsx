"use client";

import { graphql } from "@/graphql";
import {
  useDeleteProjectMutation,
  useGetProjectBasicQuery,
  useGetProjectByIdForDisplayQuery,
  useProjectCodeDescriptionsQuery,
} from "@/graphql/hooks";
import AttachedFilesSection from "@/ui/AttachedFilesSection";
import NotesSection from "@/ui/notes/NotesSection";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from "@mui/material";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

// --- GraphQL queries and mutations for this component ---
graphql(`
  query getProjectByIdForDisplay($id: String!) {
    getProjectById(id: $id) {
      id
      name
      project_code
      description
      companyId
      company {
        name
      }
      created_at
      created_by
      created_by_user {
        firstName
        lastName
      }
      updated_at
      updated_by_user {
        firstName
        lastName
      }
      deleted
      scope_of_work
      status
      parent_project
      sub_projects {
        id
        name
        project_code
        status
        deleted
        company {
          name
        }
      }
      project_contacts {
        contact_id
        relation_to_project
        contact {
          ... on PersonContact {
            id
            name
            role
            profilePicture
          }
        }
      }
    }
  }

  # For fetching parent project details
  query getProjectBasic($id: String!) {
    getProjectById(id: $id) {
      id
      name
      project_code
      status
      deleted
      company {
        name
      }
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

function ProjectKanbanCard({
  project,
  onClick,
}: {
  project: {
    id: string;
    name: string;
    project_code: string;
    status?: string | null;
    deleted?: boolean | null;
    company?: { name?: string | null } | null;
  };
  onClick?: () => void;
}) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 2,
        bgcolor: "#f8f9fa",
        border: project.deleted ? "1px solid #ccc" : "1.5px solid #1976d2",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.2s",
        "&:hover": onClick ? { boxShadow: 8 } : undefined,
        minWidth: 220,
        maxWidth: 340,
      }}
      onClick={onClick}
      data-testid="project-kanban-card"
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="subtitle1" fontWeight={600} noWrap>
          {project.name}
        </Typography>
        <Chip
          label={project.deleted ? "Deleted" : project.status || "Active"}
          color={project.deleted ? "default" : "info"}
          size="small"
          sx={{
            fontWeight: 600,
            fontFamily: "monospace",
            letterSpacing: 0.5,
            ml: 1,
          }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary" noWrap>
        Code: <b>{project.project_code}</b>
      </Typography>
      <Typography variant="body2" color="text.secondary" noWrap>
        Company: {project.company?.name ?? "—"}
      </Typography>
    </Paper>
  );
}

export default function ProjectDetailAltPage() {
  const { projectid, workspace_id } = useParams<{ projectid: string; workspace_id: string }>();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteProject, { loading: deleting }] = useDeleteProjectMutation();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const { data, loading, error } = useGetProjectByIdForDisplayQuery({
    variables: { id: projectid ?? "" },
    skip: !projectid,
    fetchPolicy: "cache-and-network",
  });

  const { data: codeDescData } = useProjectCodeDescriptionsQuery({
    fetchPolicy: "cache-and-network",
  });

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

  // Fetch parent project if needed
  const parentProjectId = project?.parent_project;
  const { data: parentData } = useGetProjectBasicQuery({
    variables: { id: parentProjectId ?? "" },
    skip: !parentProjectId,
  });

  // Helper to format ISO date strings
  function formatDate(dateString?: string | null) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const handleDelete = async () => {
    if (!project?.id) return;
    try {
      await deleteProject({ variables: { id: project.id } });
      setDeleteDialogOpen(false);
      router.push(`/app/${project.companyId}/projects`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete project.");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      {/* Go to parent project link */}
      {project?.parent_project && parentData?.getProjectById && (
        <Box mb={3}>
          <Link
            href={`/app/${workspace_id}/projects/${project.parent_project}`}
            style={{ textDecoration: "none" }}
          >
            <Typography
              variant="body1"
              color="primary"
              sx={{
                fontWeight: 600,
                display: "inline-block",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              ↑ Go to parent project: {parentData.getProjectById.name}
            </Typography>
          </Link>
        </Box>
      )}
      {loading && (
        <Typography variant="body1" color="text.secondary">
          Loading project details...
        </Typography>
      )}
      {(error || !project) && !loading && (
        <Typography variant="body1" color="error">
          Project not found.
        </Typography>
      )}
      {project && (
        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Top Card: Project Overview */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h4" gutterBottom>
                      {project.name}
                    </Typography>
                    <Chip
                      label={project.deleted ? "Deleted" : "Active"}
                      color={project.deleted ? "default" : "success"}
                      sx={{ fontWeight: 600, fontSize: "1rem" }}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { md: "right", xs: "left" } }}>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mr: 1 }}
                    data-testid="edit-project"
                    startIcon={<EditIcon />}
                    onClick={() => router.push(`/app/${workspace_id}/projects/${project.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    data-testid="delete-project"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete
                  </Button>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" flexDirection="column" gap={1.5}>
                {/* Project Code */}
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: 100, flexShrink: 0 }}
                  >
                    Project Code:
                  </Typography>
                  <Typography variant="body2" fontWeight={500} sx={{ mr: 0.5 }}>
                    {project.project_code}
                  </Typography>
                  <Tooltip title="Copy Project Code" arrow>
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
                  </Tooltip>
                </Box>
                {/* Company */}
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: 100, flexShrink: 0 }}
                  >
                    Company:
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {project.company?.name ?? "—"}
                  </Typography>
                </Box>
                {/* Status */}
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ minWidth: 100, flexShrink: 0 }}
                  >
                    Status:
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
                    <Typography variant="body2" fontWeight={500}>
                      —
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>

            {/* Details Card */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Project Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" flexDirection="column" gap={2}>
                <Typography>
                  <strong>Description:</strong> {project.description || "—"}
                </Typography>
                <Typography>
                  <strong>Scope of Work:</strong>{" "}
                  {project.scope_of_work && project.scope_of_work.length > 0
                    ? project.scope_of_work.filter(Boolean).map((code) => (
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
                              mr: 0.5,
                            }}
                          />
                        </Tooltip>
                      ))
                    : "—"}
                </Typography>
                <Typography>
                  <strong>Project Contacts:</strong>
                </Typography>
                {project.project_contacts && project.project_contacts.length > 0 ? (
                  <Box>
                    {project.project_contacts
                      .filter(
                        (c: any) =>
                          c &&
                          c.contact &&
                          c.contact.__typename === "PersonContact" &&
                          c.contact.id &&
                          c.contact.name,
                      )
                      .map((c: any) => (
                        <Box
                          key={c.contact_id}
                          display="flex"
                          alignItems="center"
                          gap={2}
                          sx={{ mb: 1 }}
                        >
                          <Avatar
                            src={c.contact.profilePicture || undefined}
                            sx={{ width: 32, height: 32 }}
                          >
                            {c.contact.name[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {c.contact.name}
                            </Typography>
                            {c.contact.role && (
                              <Typography variant="body2" color="text.secondary">
                                {c.contact.role}
                              </Typography>
                            )}
                          </Box>
                          <Chip
                            label={c.relation_to_project.replace(/_/g, " ")}
                            size="small"
                            color="info"
                            sx={{
                              fontFamily: "monospace",
                              fontWeight: 600,
                              ml: 2,
                            }}
                          />
                        </Box>
                      ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No contacts assigned.
                  </Typography>
                )}
              </Box>
            </Paper>

            {/* Sub Projects Section (moved to bottom) */}
            <Paper elevation={2} sx={{ p: 2, mt: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Sub Projects
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box display="flex" flexWrap="wrap" gap={2}>
                {project.sub_projects &&
                  project.sub_projects.length > 0 &&
                  project.sub_projects
                    .filter(Boolean)
                    .map(
                      (child) =>
                        child && (
                          <ChildProjectCard
                            key={child.id}
                            project={child}
                            workspaceId={workspace_id}
                          />
                        ),
                    )}
                <AddSubProjectCard workspaceId={workspace_id} parentId={project.id} />
              </Box>
            </Paper>
            {/* Attached Files Section */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Attached Files
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <AttachedFilesSection entityId={project.id} />
            </Paper>
            {/* Notes Section */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <NotesSection entityId={project.id} />
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Metadata Card */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Metadata
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Project ID
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontWeight="bold">
                      {project.id}
                    </Typography>
                    <Tooltip title="Copy Project ID" arrow>
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
                    </Tooltip>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {project.created_by_user
                      ? `${project.created_by_user.firstName} ${project.created_by_user.lastName}`
                      : "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(project.created_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Updated By
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {project.updated_by_user
                      ? `${project.updated_by_user.firstName} ${project.updated_by_user.lastName}`
                      : "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(project.updated_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {project.deleted ? "Deleted" : "Active"}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Stubbed Help/Support Card */}
            <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: "#fffbe6" }}>
              <Typography variant="body1" sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    width: 24,
                    height: 24,
                    bgcolor: "#ffe082",
                    borderRadius: "50%",
                    mr: 1,
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  ?
                </Box>
                Need help with this project?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Our team would be happy to help you with any kind of problem you might have!
              </Typography>
              <Button variant="contained" color="warning" size="small" disabled>
                Get Help (stub)
              </Button>
            </Paper>

            {/* Stubbed Quick Links */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Quick Links
              </Typography>
              <Button variant="outlined" size="small" sx={{ mb: 1, width: "100%" }} disabled>
                Invite Team (stub)
              </Button>
              <Button variant="outlined" size="small" sx={{ mb: 1, width: "100%" }} disabled>
                View All Projects (stub)
              </Button>
              <Button variant="outlined" size="small" sx={{ width: "100%" }} disabled>
                Upgrade Plan (stub)
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        deleting={deleting}
        errorMsg={errorMsg}
      />
    </Container>
  );
}

/** Child Project Card styled to match the provided screenshot */
function ChildProjectCard({ project, workspaceId }: { project: any; workspaceId: string }) {
  return (
    <Link
      href={`/app/${workspaceId}/projects/${project.id}`}
      style={{ textDecoration: "none", display: "block" }}
      tabIndex={0}
    >
      <Paper
        elevation={4}
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: 260,
          maxWidth: 340,
          p: 2.5,
          borderRadius: 3,
          boxShadow: "0 4px 24px 0 rgba(30, 34, 40, 0.10)",
          border: "1.5px solid #e3e8ef",
          position: "relative",
          bgcolor: "#fff",
          overflow: "hidden",
          transition: "box-shadow 0.2s, border-color 0.2s, background 0.2s",
          cursor: "pointer",
          "&:hover, &:focus": {
            boxShadow: "0 8px 32px 0 rgba(30, 34, 40, 0.16)",
            borderColor: "#1976d2",
            background: "#f5faff",
          },
        }}
      >
        {/* Left accent bar */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            bgcolor: "#1976d2",
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
          }}
        />
        <Box sx={{ pl: 2, pr: 0.5, pt: 0.5, pb: 0.5, position: "relative" }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ fontSize: 17, lineHeight: 1.2, pr: 1 }}
              noWrap
            >
              {project.name}
            </Typography>
            {project.status && (
              <Chip
                label={project.status}
                size="small"
                color="info"
                sx={{
                  fontWeight: 600,
                  fontSize: 13,
                  px: 1,
                  height: 22,
                  bgcolor: "#1976d2",
                  color: "#fff",
                  ml: 1,
                }}
              />
            )}
          </Box>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            <b>Vendor:</b> {project.company?.name ?? "—"}
          </Typography>
          <Typography variant="body2">
            <b>Requested By:</b> {"—"}
          </Typography>
          <Typography variant="body2">{project.project_code}</Typography>
        </Box>
      </Paper>
    </Link>
  );
}

/** Add Sub Project Card (compact, with text) */
function AddSubProjectCard({ workspaceId, parentId }: { workspaceId: string; parentId: string }) {
  return (
    <Link
      href={`/app/${workspaceId}/projects/create-project?parent_project=${parentId}`}
      style={{ textDecoration: "none", display: "block" }}
      tabIndex={0}
    >
      <Paper
        elevation={2}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minWidth: 180,
          maxWidth: 220,
          p: 1.2,
          borderRadius: 3,
          border: "2px dashed #1976d2",
          bgcolor: "#f5faff",
          color: "#1976d2",
          cursor: "pointer",
          boxShadow: "0 2px 8px 0 rgba(30, 34, 40, 0.08)",
          transition: "box-shadow 0.2s, border-color 0.2s, background 0.2s",
          "&:hover, &:focus": {
            borderColor: "#1565c0",
            background: "#e3f2fd",
            boxShadow: "0 4px 16px 0 rgba(30, 34, 40, 0.12)",
          },
        }}
      >
        <Box
          sx={{
            fontSize: 28,
            fontWeight: 700,
            color: "#1976d2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "#e3f2fd",
            mb: 0.5,
          }}
        >
          +
        </Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.2, fontSize: 16 }}>
          Add Sub Project
        </Typography>
        <Typography
          variant="body2"
          color="inherit"
          sx={{ opacity: 0.8, fontSize: 13, textAlign: "center" }}
        >
          Create a new sub project under this project
        </Typography>
      </Paper>
    </Link>
  );
}

// Add the confirmation dialog at the end of the component
function DeleteConfirmationDialog({
  open,
  onClose,
  onConfirm,
  deleting,
  errorMsg,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting?: boolean;
  errorMsg?: string | null;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Project</DialogTitle>
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
        <Button onClick={onClose} color="inherit" disabled={deleting}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={deleting}>
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
