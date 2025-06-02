"use client";

import { graphql } from "@/graphql";
import { useCreateProjectMutation, useProjectDropdownOptionsQuery } from "@/graphql/hooks";
import { ProjectStatusEnum, ScopeOfWorkEnum } from "@/graphql/graphql";
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

graphql(`
  query ProjectDropdownOptions {
    listProjectStatusCodes {
      code
      description
    }
    listScopeOfWorkCodes {
      code
      description
    }
  }

  mutation createProject($input: ProjectInput) {
    createProject(input: $input) {
      id
    }
  }
`);


export default function CreateProjectPage() {
  const [name, setName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatusEnum | "">("");
  const [scopeOfWork, setScopeOfWork] = useState<ScopeOfWorkEnum[]>([]);

  const { data: dropdownData, loading: dropdownLoading } = useProjectDropdownOptionsQuery();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const [createProject, { loading }] = useCreateProjectMutation();
  const router = useRouter();
  const params = useParams<{ workspace_id: string }>();

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
            status: status || undefined,
            scope_of_work: scopeOfWork.length > 0 ? scopeOfWork : undefined,
          },
        },
      });
      if (res.data?.createProject?.id) {
        setSuccess("Project created successfully!");
        setCreatedProjectId(res.data.createProject.id);
        setName("");
        setProjectCode("");
        setDescription("");
        setStatus("");
        setScopeOfWork([]);
      } else {
        setError("Failed to create project.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  useEffect(() => {
    if (success && createdProjectId && params?.workspace_id) {
      const timeout = setTimeout(() => {
        router.push(`/app/${params.workspace_id}/projects/${createdProjectId}`);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [success, createdProjectId, params?.workspace_id, router]);

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
        <FormControl fullWidth margin="normal" disabled={dropdownLoading}>
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
            {dropdownData?.listProjectStatusCodes?.filter(Boolean).map((option) => (
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
        <FormControl fullWidth margin="normal" disabled={dropdownLoading}>
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
            {dropdownData?.listScopeOfWorkCodes?.filter(Boolean).map((option) => (
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
          {loading ? "Creating..." : "Create Project"}
        </Button>
      </form>
      {success && (
        <Alert severity="success" sx={{ mt: 2 }} data-testid="project-create-success">
          {success}
        </Alert>
      )}
    </Box>
  );
}
