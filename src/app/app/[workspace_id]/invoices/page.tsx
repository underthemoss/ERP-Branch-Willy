"use client";

import { graphql } from "@/graphql";
import { useListInvoicesInvoiceListPageQuery } from "@/graphql/hooks";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import React, { useState } from "react";

const CreateInvoiceDialog = dynamic(() => import("@/ui/invoices/CreateInvoiceDialog"), {
  ssr: false,
});

const ListInvoicesQuery = graphql(`
  query ListInvoicesInvoiceListPage($query: ListInvoicesQuery!) {
    listInvoices(query: $query) {
      items {
        id
        amount
        buyerId
        buyer {
          __typename
          ... on PersonContact {
            id
            name
            email
            profilePicture
            business {
              id
              name
            }
          }
          ... on BusinessContact {
            id
            name
            website
            profilePicture
          }
        }
        companyId
        createdAt
        createdBy
        sellerId
        seller {
          __typename
          ... on PersonContact {
            id
            name
            email
            profilePicture
            business {
              id
              name
            }
          }
          ... on BusinessContact {
            id
            name
            website
            profilePicture
          }
        }
        status
        updatedAt
        updatedBy
      }
    }
  }
`);

const columns: GridColDef[] = [
  {
    field: "number",
    headerName: "Invoice #",
    width: 120,
    renderCell: (params) => {
      const { row } = params;
      // workspace_id is not available here, so use window.location or a prop
      // We'll use window.location as a fallback for now
      let workspaceId = "";
      if (typeof window !== "undefined") {
        const match = window.location.pathname.match(/app\/([^/]+)/);
        if (match) workspaceId = match[1];
      }
      return (
        <NextLink
          href={workspaceId ? `/app/${workspaceId}/invoices/${row.id}` : `/app/invoices/${row.id}`}
          style={{ textDecoration: "underline", color: "#1976d2" }}
        >
          {row.number}
        </NextLink>
      );
    },
  },
  { field: "date", headerName: "Date", width: 120 },
  { field: "buyer", headerName: "Buyer", width: 200 },
  { field: "seller", headerName: "Seller", width: 200 },
  {
    field: "amount",
    headerName: "Amount",
    width: 120,
    type: "number",
    valueFormatter: (params: any) => (params.value != null ? `$${params.value.toFixed(2)}` : ""),
  },
  { field: "status", headerName: "Status", width: 120 },
];

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data, loading, error, refetch } = useListInvoicesInvoiceListPageQuery({
    fetchPolicy: "cache-and-network",
    variables: {
      query: {
        filter: {},
        page: {},
      },
    },
  });

  const rows =
    (data?.listInvoices.items || [])?.map((inv) => ({
      id: inv.id,
      number: inv.id,
      date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "",
      buyer: inv.buyer?.name || "",
      seller: inv.seller?.name || "",
      amount: inv.amount,
      status: inv.status,
    })) ?? [];

  return (
    <>
      <Container maxWidth="xl">
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={1}>
          <Typography variant="h1">Invoices</Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ textTransform: "none", fontWeight: 600 }}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Invoice
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary" mb={2}>
          View and manage your invoices.
        </Typography>
        <Box mb={2} display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" disabled={!search} onClick={() => setSearch("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {/* Filters placeholder */}
        </Box>
        <Box sx={{ height: 600 }}>
          <div style={{ height: "100%" }}>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : error ? (
              <Typography color="error">Failed to load invoices.</Typography>
            ) : (
              <DataGridPremium
                columns={columns}
                rows={rows}
                disableRowSelectionOnClick
                hideFooter
                getRowId={(row) => row.id}
                initialState={{
                  pinnedColumns: { left: ["number"] },
                }}
                sx={{
                  cursor: "pointer",
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
              />
            )}
          </div>
        </Box>
      </Container>
      <CreateInvoiceDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={() => {
          setCreateDialogOpen(false);
          refetch();
        }}
        workspaceId={useParams().workspace_id as string}
      />
    </>
  );
}
