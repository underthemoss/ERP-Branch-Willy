"use client";

import { graphql } from "@/graphql";
import {
  ContactType,
  ProjectContactRelationEnum,
  ProjectStatusEnum,
  ScopeOfWorkEnum,
} from "@/graphql/graphql";
import {
  useGetProjectByIdForEditQuery,
  useListContactsQuery,
  useProjectDropdownOptionsQuery,
  useUpdateProjectMutation,
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
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

graphql(`
  query getProjectByIdForEdit($id: String!) {
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
      parent_project
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

  query ProjectEditDropdownOptions {
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

type SelectedContact = {
  id: string;
  name: string;
  role?: string | null;
  profilePicture?: string | null;
  relationToProject: string; // code from listProjectContactRelationCodes
};

export default function EditProjectPage() {
  const { projectid, workspace_id } = useParams<{ projectid: string; workspace_id: string }>();
  const router = useRouter();

  const { data, loading, error } = useGetProjectByIdForEditQuery({
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
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [parentProjectId, setParentProjectId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [updateProject, { loading: updating }] = useUpdateProjectMutation();
  const { data: codeDescData, loading: dropdownLoading } = useProjectDropdownOptionsQuery();

  // Fetch person contacts for the current workspace, with search and pagination
  const { data: contactsData, loading: contactsLoading } = useListContactsQuery({
    variables: {
      workspaceId: workspace_id,
      page: { number: 1, size: 20 },
      contactType: ContactType.Person,
    },
    skip: !workspace_id,
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
  const relationTypes = (codeDescData?.listProjectContactRelationCodes ?? []).filter(Boolean);

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
          : [],
      );
      setParentProjectId(project.parent_project || "");
      if (Array.isArray(project.project_contacts)) {
        const hydrated = project.project_contacts
          .filter(
            (c: any) =>
              c &&
              c.contact &&
              c.contact.__typename === "PersonContact" &&
              c.contact.id &&
              c.contact.name,
          )
          .map((c: any) => ({
            id: c.contact.id,
            name: c.contact.name,
            role: c.contact.role,
            profilePicture: c.contact.profilePicture,
            relationToProject: c.relation_to_project || "",
          }));
        setSelectedContacts(hydrated);
      } else {
        setSelectedContacts([]);
      }
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
    if (selectedContacts.some((c) => !c.relationToProject)) {
      setErrorMsg("Each contact must have a relationship type.");
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
            parent_project: parentProjectId || undefined,
            status: status || undefined,
            scope_of_work: scopeOfWork.length > 0 ? scopeOfWork : undefined,
            project_contacts: selectedContacts.map((c) => ({
              contact_id: c.id,
              relation_to_project: c.relationToProject as ProjectContactRelationEnum,
            })),
            workspaceId: workspace_id,
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
                disabled={dropdownLoading || !relationTypes.length}
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
            {codeDescData?.listScopeOfWorkCodes?.filter(Boolean).map((option) => (
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
