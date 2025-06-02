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

export default function BusinessesContactsPage() {
  const { workspace_id } = useParams<{ workspace_id: string }>();
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data, loading } = useListContactsQuery({
    variables: {
      workspaceId: workspace_id,
      page: { size: 10000 },
      contactType: ContactType.Business,
    },
    fetchPolicy: "cache-and-network",
  });

  const rows = React.useMemo(() => {
    return (
      data?.listContacts?.items
        ?.filter((contact) => contact?.__typename === "BusinessContact")
        .map((contact) => ({
          id: contact?.id ?? "",
          name: contact?.name ?? "",
          phone: contact?.phone ?? "",
          address: contact?.address ?? "",
          taxId: contact?.taxId ?? "",
          website: contact?.website ?? "",
          notes: contact?.notes ?? "",
          profilePicture: contact?.profilePicture ?? "",
          updatedAt: contact?.updatedAt ?? "",
        })) ?? []
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
      headerName: "Business Name",
      flex: 2,
      minWidth: 200,
    },
    { field: "phone", headerName: "Phone", width: 150 },
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
          <Typography variant="h1">Businesses</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none", fontWeight: 600 }}
            // TODO: Implement create business contact page/route
            onClick={() => router.push("create-business")}
          >
            + Add Business
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary" mb={2}>
          View, manage, and organize your business contacts.
        </Typography>
        <Box mb={2} display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search businesses"
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
        </Box>
        <Box sx={{ height: 600 }}>
          <div data-testid="business-list" style={{ height: "100%" }}>
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
                  router.push(`${params.row.id}`);
                }
              }}
              sx={{
                cursor: "pointer",
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f5f5f5",
                },
              }}
              getRowClassName={() => "business-list-item"}
            />
          </div>
        </Box>
      </Container>
    </PageContainer>
  );
}
