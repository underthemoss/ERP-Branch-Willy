"use client";

import { ContactType } from "@/graphql/graphql";
import { useListContactsQuery } from "@/ui/contacts/api";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function ContactsPage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const [contactTypeFilter, setContactTypeFilter] = React.useState("All");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);

  const { data, loading } = useListContactsQuery({
    variables: {
      workspaceId: workspace_id,
      page: {
        size: 10_000,
      },
      contactType:
        contactTypeFilter === "All"
          ? undefined
          : contactTypeFilter === "PERSON"
            ? ContactType.Person
            : contactTypeFilter === "BUSINESS"
              ? ContactType.Business
              : undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const rows = React.useMemo(() => {
    return (
      data?.listContacts?.items?.map((contact) => {
        const isPerson = contact?.__typename === "PersonContact";
        const isBusiness = contact?.__typename === "BusinessContact";
        return {
          id: contact?.id ?? "",
          name: contact?.name ?? "",
          type: contact?.contactType ?? "",
          phone: contact?.phone ?? "",
          email: isPerson ? (contact?.email ?? "") : "",
          role: isPerson ? (contact?.role ?? "") : "",
          businessId: isPerson ? (contact?.businessId ?? "") : "",
          address: isBusiness ? (contact?.address ?? "") : "",
          taxId: isBusiness ? (contact?.taxId ?? "") : "",
          website: isBusiness ? (contact?.website ?? "") : "",
          notes: contact?.notes ?? "",
          profilePicture: contact?.profilePicture ?? "",
          updatedAt: contact?.updatedAt ?? "",
        };
      }) ?? []
    );
  }, [data]);

  const filteredRows = React.useMemo(() => {
    let filtered = rows;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
      );
    }
    return filtered;
  }, [rows, searchTerm]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 120 },
    {
      field: "name",
      headerName: "Name",
      flex: 2,
      minWidth: 200,
    },
    {
      field: "type",
      headerName: "Type",
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === "BUSINESS" ? "Business" : "Person"}
          color={params.value === "BUSINESS" ? "primary" : "secondary"}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    { field: "phone", headerName: "Phone", width: 150 },
    { field: "email", headerName: "Email", width: 200 },
    { field: "role", headerName: "Role", width: 150 },
    { field: "address", headerName: "Address", width: 200 },
    { field: "taxId", headerName: "Tax ID", width: 120 },
    { field: "website", headerName: "Website", width: 180 },
    { field: "notes", headerName: "Notes", width: 200 },
    {
      field: "updatedAt",
      headerName: "Updated Date",
      width: 180,
      renderCell: (params) => {
        const date = params.value ? parseISO(params.value) : null;
        return date ? (
          <Tooltip title={format(date, "MMMM d, yyyy, h:mm a")} arrow>
            <span>{formatDistanceToNow(date, { addSuffix: true })}</span>
          </Tooltip>
        ) : (
          ""
        );
      },
      sortComparator: (v1, v2) => new Date(v1).getTime() - new Date(v2).getTime(),
    },
    {
      field: "actions",
      headerName: "",
      width: 100,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton
          aria-label="edit"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/app/${workspace_id}/contacts/${params.row.id}/edit`);
          }}
        >
          <EditIcon />
        </IconButton>
      ),
    },
  ];

  const router = useRouter();

  return (
    <PageContainer>
      <Container maxWidth="lg">
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={1}>
          <Typography variant="h1">Contact Management</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none", fontWeight: 600 }}
            onClick={() => setAddDialogOpen(true)}
          >
            + Add Contact
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary" mb={2}>
          View, manage, and organize your contacts.
        </Typography>
        <Box mb={2} display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search contacts"
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
            value={contactTypeFilter}
            onChange={(e) => setContactTypeFilter(e.target.value)}
            sx={{ minWidth: 180 }}
            data-testid="contact-type-filter"
            MenuProps={{
              MenuListProps: {
                dense: true,
              },
            }}
          >
            <MenuItem value="All">All Types</MenuItem>

            <MenuItem value="PERSON">People</MenuItem>
            <MenuItem value="BUSINESS">Businesses</MenuItem>
          </Select>
        </Box>
        <Box sx={{ height: 600 }}>
          <div data-testid="contact-list" style={{ height: "100%" }}>
            <DataGridPremium
              columns={columns}
              rows={filteredRows}
              loading={loading}
              disableRowSelectionOnClick
              hideFooter
              getRowId={(row) => row.id}
              initialState={{
                pinnedColumns: { left: ["name"], right: ["actions"] },
                sorting: {
                  sortModel: [{ field: "updatedAt", sort: "desc" }],
                },
              }}
              onRowClick={(params) => {
                if (params.row.id) {
                  router.push(`contacts/${params.row.id}`);
                }
              }}
              sx={{
                cursor: "pointer",
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
              getRowClassName={() => "contact-list-item"}
            />
          </div>
        </Box>
        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} minWidth={240}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setAddDialogOpen(false);
                  router.push(`/app/${workspace_id}/contacts/create-business`);
                }}
                fullWidth
              >
                Add Business
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  setAddDialogOpen(false);
                  router.push(`/app/${workspace_id}/contacts/create-employee`);
                }}
                fullWidth
              >
                Add Employee
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialogOpen(false)} color="inherit">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </PageContainer>
  );
}
