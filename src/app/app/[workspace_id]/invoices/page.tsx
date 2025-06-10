"use client";

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
import React from "react";

// Mocked invoice data
const mockInvoices = [
  {
    id: "INV-001",
    number: "INV-001",
    date: "2025-06-01",
    customer: "Acme Corp",
    amount: 1200.0,
    status: "Paid",
  },
  {
    id: "INV-002",
    number: "INV-002",
    date: "2025-06-03",
    customer: "Globex Inc",
    amount: 850.5,
    status: "Unpaid",
  },
  {
    id: "INV-003",
    number: "INV-003",
    date: "2025-06-05",
    customer: "Soylent Corp",
    amount: 430.75,
    status: "Overdue",
  },
];

// Columns for the DataGrid
const columns: GridColDef[] = [
  { field: "number", headerName: "Invoice #", width: 120 },
  { field: "date", headerName: "Date", width: 120 },
  { field: "customer", headerName: "Customer", width: 200 },
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
  return (
    <Container maxWidth="xl">
      <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={1}>
        <Typography variant="h1">Invoices</Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ textTransform: "none", fontWeight: 600 }}
          disabled
        >
          Create Invoice
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" mb={2}>
        View and manage your invoices. (Stub page)
      </Typography>
      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField
          placeholder="Search"
          variant="outlined"
          size="small"
          fullWidth
          value=""
          disabled
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" disabled>
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
          <DataGridPremium
            columns={columns}
            rows={mockInvoices}
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
        </div>
      </Box>
    </Container>
  );
}
