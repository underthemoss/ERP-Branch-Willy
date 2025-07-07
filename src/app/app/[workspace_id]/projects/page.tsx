"use client";

import { graphql } from "@/graphql";
import { useListTopLevelProjectsQuery } from "@/graphql/hooks";
import { parseDate } from "@/lib/parseDate";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import { PageContainer } from "@toolpad/core/PageContainer";
import { format, formatDistanceToNow } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

graphql(`
  query listTopLevelProjects {
    listTopLevelProjects {
      id
      name
      project_code
      description
      company {
        name
      }
      created_at
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
    }
  }
`);

export default function ProjectsPage() {
  const { data, loading } = useListTopLevelProjectsQuery({
    fetchPolicy: "cache-and-network",
  });

  const [statusFilter, setStatusFilter] = React.useState("Active Projects");
  const [searchTerm, setSearchTerm] = React.useState("");

  const rows = React.useMemo(() => {
    return (
      data?.listTopLevelProjects?.map((project) => ({
        id: project?.id ?? "",
        name: project?.name ?? "",
        project_code: project?.project_code ?? "",
        description: project?.description ?? "",
        company: project?.company?.name ?? "",
        created_at: project?.created_at ?? "",
        created_by: project?.created_by_user
          ? `${project.created_by_user.firstName} ${project.created_by_user.lastName}`
          : "",
        updated_at: project?.updated_at ?? "",
        updated_by: project?.updated_by_user
          ? `${project.updated_by_user.firstName} ${project.updated_by_user.lastName}`
          : "",
        deleted: project?.deleted ?? false,
        scope_of_work: project?.scope_of_work ?? [],
        status: project?.status ?? "",
      })) ?? []
    );
  }, [data]);

  const filteredRows = React.useMemo(() => {
    let filtered = rows;
    if (statusFilter === "Active Projects") {
      filtered = filtered.filter((row) => !row.deleted);
    } else if (statusFilter === "Deleted") {
      filtered = filtered.filter((row) => row.deleted);
    }
    if (!searchTerm) return filtered;
    const lower = searchTerm.toLowerCase();
    return filtered.filter((row) =>
      Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
    );
  }, [rows, searchTerm, statusFilter]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 120 },
    {
      field: "name",
      headerName: "Name",
      flex: 2,
      minWidth: 250,
    },
    { field: "project_code", headerName: "Project Code", flex: 2, minWidth: 200 },
    { field: "description", headerName: "Description", flex: 2 },
    { field: "company", headerName: "Company", flex: 2, minWidth: 200 },
    {
      field: "scope_of_work",
      headerName: "Scope of Work",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => {
        const value: string[] = params.value ?? [];
        if (!value.length) return "";
        return (
          <Box>
            {value.map((scope) => (
              <Chip
                key={scope}
                label={scope.replace(/_/g, " ")}
                size="small"
                sx={{
                  verticalAlign: "middle",
                }}
              />
            ))}
          </Box>
        );
      },
    },
    {
      field: "status",
      headerName: "Project Status",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => {
        const value: string = params.value ?? "";
        if (!value) return "";
        // Optionally, you could map enum values to friendlier labels here
        return <Chip label={value.replace(/_/g, " ")} color="info" size="small" />;
      },
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 180,
      renderCell: (params) => {
        const date = parseDate(params.value);
        return date ? (
          <Tooltip title={format(date, "MMMM d, yyyy, h:mm a")} arrow>
            <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
          </Tooltip>
        ) : (
          ""
        );
      },
    },
    { field: "created_by", headerName: "Created By", width: 180 },
    {
      field: "updated_at",
      headerName: "Updated At",
      width: 180,
      renderCell: (params) => {
        const date = parseDate(params.value);
        return date ? (
          <Tooltip title={format(date, "MMMM d, yyyy, h:mm a")} arrow>
            <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
          </Tooltip>
        ) : (
          ""
        );
      },
    },
    { field: "updated_by", headerName: "Updated By", width: 180 },
    {
      field: "deleted",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Deleted" : "Active"}
          color={params.value ? "default" : "success"}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "actions",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Tooltip title="Edit Project">
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`projects/${params.row.id}/edit`);
            }}
            data-testid="project-edit-btn"
            aria-label="Edit Project"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const router = useRouter();
  const { workspace_id } = useParams<{ workspace_id: string }>();

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={1}>
          <Typography variant="h1">Project Management</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none", fontWeight: 600 }}
            onClick={() => router.push("projects/create-project")}
          >
            + Create Project
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary" mb={2}>
          View, manage, and organize your projects.
        </Typography>
        <Box mb={2} display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search project by name"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
          <Select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
            data-testid="project-status-filter"
            MenuProps={{
              MenuListProps: {
                dense: true,
              },
            }}
          >
            <MenuItem value="All Statuses">All Statuses</MenuItem>
            <MenuItem disabled divider />
            <MenuItem value="Active Projects">Active Projects</MenuItem>
            <MenuItem value="Deleted">Deleted</MenuItem>
          </Select>
        </Box>
        <Box sx={{ height: 600 }}>
          <div data-testid="project-list" style={{ height: "100%" }}>
            <DataGridPremium
              columns={columns}
              rows={filteredRows}
              loading={loading}
              disableRowSelectionOnClick
              hideFooter
              getRowId={(row) => row.id}
              initialState={{
                pinnedColumns: { left: ["name"], right: ["actions"] },
              }}
              onRowClick={(params) => {
                if (params.row.id) {
                  router.push(`projects/${params.row.id}`);
                }
              }}
              sx={{
                cursor: "pointer",
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
              getRowClassName={() => "project-list-item"}
            />
          </div>
        </Box>
      </Container>
    </PageContainer>
  );
}
