"use client";

import { graphql } from "@/graphql";
import { useGetProjectByIdQuery, useUpdateProjectMutation } from "@/graphql/hooks";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ProjectStatusEnum, ScopeOfWorkEnum } from "@/graphql/graphql";
import { useProjectCodeDescriptionsQuery } from "@/graphql/hooks";

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
      scope_of_work
      status
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
  const [status, setStatus] = useState<ProjectStatusEnum | "">("");
  const [scopeOfWork, setScopeOfWork] = useState<ScopeOfWorkEnum[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [updateProject, { loading: updating }] = useUpdateProjectMutation();
  const { data: codeDescData } = useProjectCodeDescriptionsQuery();

  // Prefill form when project data loads
  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setProjectCode(project.project_code || "");
      setDescription(project.description || "");
      setStatus((project.status as ProjectStatusEnum) || "");
      setScopeOfWork(
        Array.isArray(project.scope_of_work)
          ? (project.scope_of_work.filter(Boolean) as ScopeOfWorkEnum[])
          : []
      );
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
            status: status || undefined,
            scope_of_work: scopeOfWork.length > 0 ? scopeOfWork : undefined,
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
        <FormControl fullWidth margin="normal" disabled={updating}>
          <InputLabel id="status-label">Project Status</InputLabel>
          <Select
            labelId="status-label"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatusEnum)}
            input={
              <OutlinedInput
                label="Project Status"
                endAdornment={
                  status ? (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear status"
                        onClick={() => setStatus("")}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }
              />
            }
            required
          >
            {codeDescData?.listProjectStatusCodes?.filter(Boolean).map((option) => (
              <MenuItem key={option!.code} value={option!.code}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {option!.code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                    {option!.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal" disabled={updating}>
          <InputLabel id="scope-of-work-label">Scope of Work</InputLabel>
          <Select
            labelId="scope-of-work-label"
            multiple
            value={scopeOfWork}
            onChange={(e) => {
              const value = e.target.value;
              setScopeOfWork(
                typeof value === "string"
                  ? (value.split(",") as ScopeOfWorkEnum[])
                  : (value as ScopeOfWorkEnum[])
              );
            }}
            input={
              <OutlinedInput
                label="Scope of Work"
                endAdornment={
                  scopeOfWork.length > 0 ? (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear scope of work"
                        onClick={() => setScopeOfWork([])}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }
              />
            }
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {(selected as string[]).map((code) => (
                  <Typography
                    key={code}
                    component="span"
                    sx={{
                      display: "inline-block",
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                      bgcolor: "primary.light",
                      color: "primary.contrastText",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      fontSize: "0.85em",
                    }}
                  >
                    {code}
                  </Typography>
                ))}
              </Box>
            )}
          >
            {codeDescData?.listScopeOfWorkCodes?.filter(Boolean).map((option) => (
              <MenuItem key={option!.code} value={option!.code}>
                <Checkbox checked={scopeOfWork.indexOf(option!.code as ScopeOfWorkEnum) > -1} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {option!.code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                    {option!.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
