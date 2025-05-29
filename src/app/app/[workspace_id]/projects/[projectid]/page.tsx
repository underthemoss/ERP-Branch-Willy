"use client";

import { graphql } from "@/graphql";
import { useGetProjectByIdQuery } from "@/graphql/hooks";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useParams } from "next/navigation";

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
    }
  }
`);

export default function ProjectDetailPage() {
  const { projectid } = useParams<{ projectid: string }>();
  const { data, loading, error } = useGetProjectByIdQuery({
    variables: { id: projectid ?? "" },
    skip: !projectid,
  });

  const project = data?.getProjectById;

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
                <Typography variant="h5" fontWeight={700} gutterBottom>
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
    </Box>
  );
}
