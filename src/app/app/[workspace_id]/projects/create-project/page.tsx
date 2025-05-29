"use client";

import { graphql } from "@/graphql";
import { useCreateProjectMutation } from "@/graphql/hooks";

graphql(`
  mutation createProject($input: ProjectInput) {
    createProject(input: $input) {
      id
    }
  }
`);

import React, { useState } from "react";
import { Box, Button, TextField, Typography, Alert } from "@mui/material";

export default function CreateProjectPage() {
  const [name, setName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createProject, { loading }] = useCreateProjectMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }
    if (!projectCode.trim()) {
      setError("Project code is required.");
      return;
    }

    try {
      const res = await createProject({
        variables: {
          input: {
            name,
            project_code: projectCode,
            deleted: false,
            description: description.trim() ? description : undefined,
          },
        },
      });
      if (res.data?.createProject?.id) {
        setSuccess("Project created successfully!");
        setName("");
        setProjectCode("");
        setDescription("");
      } else {
        setError("Failed to create project.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={4}>
      <Typography variant="h5" mb={2}>
        Create Project
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Project"}
        </Button>
      </form>
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
}
