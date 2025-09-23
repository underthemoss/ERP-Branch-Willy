"use client";

import { graphql } from "@/graphql";
import {
  ContactType,
  ProjectContactRelationEnum,
  ProjectStatusEnum,
  ScopeOfWorkEnum,
} from "@/graphql/graphql";
import {
  useCreateProjectMutation,
  useListContactsQuery,
  useProjectDropdownOptionsQuery,
} from "@/graphql/hooks";
import { ProjectSelector } from "@/ui/ProjectSelector";
import ClearIcon from "@mui/icons-material/Clear";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
    listProjectContactRelationCodes {
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

type SelectedContact = {
  id: string;
  name: string;
  role?: string | null;
  profilePicture?: string | null;
  relationToProject: string; // code from listProjectContactRelationCodes
};

export default function CreateProjectPage() {
  const [name, setName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [parentProjectId, setParentProjectId] = useState<string>("");
  const [status, setStatus] = useState<ProjectStatusEnum | "">("");
  const [scopeOfWork, setScopeOfWork] = useState<ScopeOfWorkEnum[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([]);
  const [contactSearch, setContactSearch] = useState("");

  const searchParams = useSearchParams();
  // Set initial parent project from search param if present
  React.useEffect(() => {
    const param = searchParams?.get("parent_project");
    if (param && !parentProjectId) {
      setParentProjectId(param);
    }
    // Only run on mount or if searchParams changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const { data: dropdownData, loading: dropdownLoading } = useProjectDropdownOptionsQuery({
    fetchPolicy: "cache-and-network",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const [createProject, { loading }] = useCreateProjectMutation();
  const router = useRouter();
  const params = useParams<{ workspace_id: string }>();

  // Fetch person contacts for the current workspace, with search and pagination
  const { data: contactsData, loading: contactsLoading } = useListContactsQuery({
    variables: {
      workspaceId: params.workspace_id,
      page: { number: 1, size: 20 },
      contactType: ContactType.Person,
    },
    skip: !params.workspace_id,
    fetchPolicy: "cache-and-network",
  });

  const allContacts = React.useMemo(() => {
    if (!contactsData?.listContacts?.items) return [];
    return contactsData.listContacts.items
      .filter((c) => c.__typename === "PersonContact")
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        profilePicture: c.profilePicture,
      }));
  }, [contactsData]);

  // Use relationship types as returned by the API (no custom sorting)
  const relationTypes = (dropdownData?.listProjectContactRelationCodes ?? []).filter(Boolean);

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
    if (selectedContacts.some((c) => !c.relationToProject)) {
      setError("Each contact must have a relationship type.");
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
            parent_project: parentProjectId || undefined,
            status: status || undefined,
            scope_of_work: scopeOfWork.length > 0 ? scopeOfWork : undefined,
            project_contacts: selectedContacts.map((c) => ({
              contact_id: c.id,
              relation_to_project: c.relationToProject as ProjectContactRelationEnum,
            })),
            workspaceId: params.workspace_id,
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
        setSelectedContacts([]);
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
        {/* Parent Project Selector */}
        <Box mt={2} mb={1}>
          <Typography variant="subtitle1" mb={0.5}>
            Parent Project (optional)
          </Typography>
          <ProjectSelector projectId={parentProjectId} onChange={setParentProjectId} />
        </Box>
        {/* Contact selection */}
        <Autocomplete
          options={allContacts.filter((c) => !selectedContacts.some((sel) => sel.id === c.id))}
          getOptionLabel={(option) => option.name + (option.role ? ` (${option.role})` : "")}
          value={null}
          onChange={(_, value) => {
            if (
              value &&
              selectedContacts.length < 10 &&
              !selectedContacts.some((c) => c.id === value.id)
            ) {
              setSelectedContacts([...selectedContacts, { ...value, relationToProject: "" }]);
            }
          }}
          inputValue={contactSearch}
          onInputChange={(_, value) => setContactSearch(value)}
          loading={contactsLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Add Contact (max 10)"
              margin="normal"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {contactsLoading ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          disabled={selectedContacts.length >= 10}
        />
        <List dense sx={{ mb: 2 }}>
          {selectedContacts.map((contact, idx) => (
            <ListItem
              key={contact.id}
              alignItems="center"
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="remove"
                  onClick={() =>
                    setSelectedContacts((prev) => prev.filter((c) => c.id !== contact.id))
                  }
                  size="small"
                >
                  <ClearIcon />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <Avatar src={contact.profilePicture || undefined}>{contact.name[0]}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={contact.name}
                secondary={contact.role}
                sx={{ minWidth: 120, maxWidth: 180 }}
              />
              <FormControl
                size="small"
                sx={{ minWidth: 180, ml: 2 }}
                required
                error={!contact.relationToProject}
                disabled={dropdownLoading || !dropdownData?.listProjectContactRelationCodes?.length}
              >
                <InputLabel>Relationship</InputLabel>
                <Select
                  label="Relationship"
                  value={contact.relationToProject}
                  onChange={(e) => {
                    const code = e.target.value;
                    setSelectedContacts((prev) =>
                      prev.map((c, i) => (i === idx ? { ...c, relationToProject: code } : c)),
                    );
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {dropdownLoading && (
                    <MenuItem disabled>
                      <em>Loading...</em>
                    </MenuItem>
                  )}
                  {!dropdownLoading && relationTypes.length === 0 && (
                    <MenuItem disabled>
                      <em>No relationship types found</em>
                    </MenuItem>
                  )}
                  {relationTypes.map((option) => (
                    <MenuItem key={option!.code} value={option!.code}>
                      {option!.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </ListItem>
          ))}
        </List>
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: "pre-line" }}
                  >
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
                  : (value as ScopeOfWorkEnum[]),
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: "pre-line" }}
                  >
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
