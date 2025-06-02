"use client";

import { graphql } from "@/graphql";
import { useGetProjectByIdQuery, useUpdateProjectMutation } from "@/graphql/hooks";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

// Declare the updateProject mutation for codegen
graphql(`
  mutation updateProject($id: String!, $input: ProjectInput) {
    updateProject(id: $id, input: $input) {
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

export default function EditProjectPage() {
  const { projectid, workspace_id } = useParams<{ projectid: string; workspace_id: string }>();
  const router = useRouter();

  const { data, loading, error } = useGetProjectByIdQuery({
    variables: { id: projectid ?? "" },
    skip: !projectid,
    fetchPolicy: "cache-and-network",
  });

  const project = data?.getProjectById;

  const [name, setName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [updateProject, { loading: updating }] = useUpdateProjectMutation();

  // Prefill form when project data loads
  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setProjectCode(project.project_code || "");
      setDescription(project.description || "");
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccess(null);

    if (!name.trim()) {
      setErrorMsg("Project name is required.");
      return;
    }
    if (!projectCode.trim()) {
      setErrorMsg("Project code is required.");
      return;
    }

    try {
      const res = await updateProject({
        variables: {
          id: projectid!,
          input: {
            name,
            project_code: projectCode,
            deleted: project?.deleted ?? false,
            description: description.trim() ? description : undefined,
          },
        },
      });
      if (res.data?.updateProject?.id) {
        setSuccess("Project updated successfully!");
        setTimeout(() => {
          router.push(`/app/${workspace_id}/projects/${projectid}`);
        }, 1000);
      } else {
        setErrorMsg("Failed to update project.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <Typography>Loading project...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error.message}
      </Alert>
    );
  }

  if (!project) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        Project not found.
      </Alert>
    );
  }

  return (
    <Box maxWidth={400} mx="auto" mt={4}>
      <Typography variant="h5" mb={2}>
        Edit Project
      </Typography>
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Project Code"
          value={projectCode}
          onChange={(e) => setProjectCode(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          minRows={2}
        />
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}
        <Button type="submit" variant="contained" color="primary" fullWidth disabled={updating}>
          {updating ? "Updating..." : "Update Project"}
        </Button>
      </form>
      {success && (
        <Alert severity="success" sx={{ mt: 2 }} data-testid="project-edit-success">
          {success}
        </Alert>
      )}
    </Box>
  );
}
