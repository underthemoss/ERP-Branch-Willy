import { graphql } from "@/graphql";
import type { Project } from "@/graphql/graphql";
import { useProjectSelectorListQuery } from "@/graphql/hooks";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";

// GQL query for listing projects
export const PROJECT_SELECTOR_LIST = graphql(`
  query ProjectSelectorList {
    listProjects {
      id
      name
      project_code
      description
      deleted
    }
  }
`);

export interface ProjectSelectorProps {
  projectId?: string;
  onChange: (projectId: string) => void;
  // Optionally filter out deleted projects
  showDeleted?: boolean;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projectId,
  onChange,
  showDeleted = false,
}) => {
  // Use the generated hook for the renamed query
  const { data, loading, error } = useProjectSelectorListQuery({
    fetchPolicy: "cache-and-network",
  });

  // Filter out deleted projects unless showDeleted is true
  const projects =
    data?.listProjects
      ?.filter((p) => {
        if (!p) {
          return null;
        }
        if (showDeleted) {
          return p;
        }
        return p.deleted === false;
      })
      .filter(Boolean)
      .map((p) => p!) || [];

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={80}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography color="error">Failed to load projects</Typography>
      </Paper>
    );
  }

  return (
    <Select
      value={projectId ?? ""}
      onChange={(e: SelectChangeEvent<string>) => onChange(e.target.value)}
      displayEmpty
      fullWidth
      IconComponent={ArrowDropDownIcon}
      renderValue={(selected) => {
        const project = projects.find((p) => p.id === selected);
        if (!project) {
          return (
            <Paper
              variant="outlined"
              sx={{
                display: "flex",
                alignItems: "center",
                p: 2,
                width: "100%",
                boxShadow: "none",
                borderRadius: 2,
              }}
            >
              <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: "grey.400" }}>
                {/* Placeholder circle */}
              </Avatar>
              <Box flex={1}>
                <Typography fontWeight={500} fontSize={16} color="text.secondary">
                  Select project…
                </Typography>
              </Box>
            </Paper>
          );
        }
        return (
          <Paper
            variant="outlined"
            sx={{
              display: "flex",
              alignItems: "center",
              p: 2,
              width: "100%",
              boxShadow: "none",
              borderRadius: 2,
              marginRight: 3,
              gap: 2,
            }}
          >
            <Avatar sx={{ width: 44, height: 44, mr: 2, bgcolor: "primary.light" }}>
              {project.name[0]}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography fontWeight={700} fontSize={17} noWrap>
                {project.name}
              </Typography>
              <Stack spacing={0.2}>
                <Box display="flex" gap={0.5} alignItems="center">
                  <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
                    Code:
                  </Typography>
                  <Typography fontSize={14} color="text.secondary" noWrap>
                    {project.project_code}
                  </Typography>
                </Box>
                {project.description && (
                  <Box display="flex" gap={0.5} alignItems="center">
                    <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
                      Description:
                    </Typography>
                    <Typography
                      fontSize={13}
                      color="text.secondary"
                      noWrap
                      sx={{
                        maxWidth: 520,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {project.description}
                    </Typography>
                  </Box>
                )}
                {project.deleted && (
                  <Chip
                    label="Deleted"
                    color="error"
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: 13,
                      minWidth: 70,
                      ml: 2,
                      bgcolor: "error.light",
                      color: "error.contrastText",
                    }}
                  />
                )}
              </Stack>
            </Box>
          </Paper>
        );
      }}
      sx={{
        background: "transparent",
        borderRadius: 2,
        "& .MuiSelect-select": { p: 0 },
      }}
      MenuProps={{
        PaperProps: {
          sx: { minWidth: 350, maxHeight: 400 },
        },
      }}
    >
      <MenuItem value="">
        <Typography color="text.secondary">Select project…</Typography>
      </MenuItem>
      {projects.map((project) => (
        <MenuItem key={project.id} value={project.id} sx={{ py: 1 }}>
          <Box display="flex" alignItems="center" width="100%" gap={2} minWidth={0}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.light" }}>
              {project.name[0]}
            </Avatar>
            <Box flex={1} minWidth={0}>
              <Typography fontWeight={700} fontSize={16} noWrap>
                {project.name}
              </Typography>
              <Stack spacing={0.2}>
                <Box display="flex" gap={0.5} alignItems="center">
                  <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
                    Code:
                  </Typography>
                  <Typography fontSize={14} color="text.secondary" noWrap>
                    {project.project_code}
                  </Typography>
                </Box>
                {project.description && (
                  <Box display="flex" gap={0.5} alignItems="center">
                    <Typography fontSize={12} color="text.secondary" fontWeight={600} noWrap>
                      Description:
                    </Typography>
                    <Typography
                      fontSize={13}
                      color="text.secondary"
                      noWrap
                      sx={{
                        maxWidth: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {project.description}
                    </Typography>
                  </Box>
                )}
                {project.deleted && (
                  <Chip
                    label="Deleted"
                    color="error"
                    size="small"
                    sx={{
                      fontWeight: 600,
                      fontSize: 13,
                      minWidth: 70,
                      ml: 2,
                      bgcolor: "error.light",
                      color: "error.contrastText",
                    }}
                  />
                )}
              </Stack>
            </Box>
          </Box>
        </MenuItem>
      ))}
    </Select>
  );
};

export default ProjectSelector;
