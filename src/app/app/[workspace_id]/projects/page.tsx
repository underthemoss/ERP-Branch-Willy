"use client";

import { graphql } from "@/graphql";
import { useListProjectsQuery } from "@/graphql/hooks";
import { DataGridPro, GridColDef } from "@mui/x-data-grid-pro";
import { Container, Typography, Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import * as React from "react";

graphql(`
  query ListProjects {
    listProjects {
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

export default function ProjectsPage() {
  const { data, loading } = useListProjectsQuery();

  const rows = React.useMemo(() => {
    return (
      data?.listProjects?.map((project) => ({
        id: project?.id ?? "",
        name: project?.name ?? "",
        project_code: project?.project_code ?? "",
        description: project?.description ?? "",
        companyId: project?.companyId ?? "",
        created_at: project?.created_at ?? "",
        created_by: project?.created_by ?? "",
        updated_at: project?.updated_at ?? "",
        deleted: project?.deleted ?? false,
      })) ?? []
    );
  }, [data]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 120 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "project_code", headerName: "Project Code", flex: 1 },
    { field: "description", headerName: "Description", flex: 2 },
    { field: "companyId", headerName: "Company ID", flex: 1 },
    { field: "created_at", headerName: "Created At", width: 180 },
    { field: "created_by", headerName: "Created By", width: 180 },
    { field: "updated_at", headerName: "Updated At", width: 180 },
    { field: "deleted", headerName: "Deleted", width: 100, type: "boolean" },
  ];

  const router = useRouter();

  return (
    <Container maxWidth="lg">
      <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={2}>
        <Typography variant="h1">
          Projects
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none", fontWeight: 600 }}
            onClick={() => router.push("projects/create-project")}
          >
            + Create Project
          </Button>
        </Box>
      </Box>
      <Box sx={{ height: 600 }}>
        <DataGridPro
          columns={columns}
          rows={rows}
          loading={loading}
          disableRowSelectionOnClick
          hideFooter
        />
      </Box>
    </Container>
  );
}
