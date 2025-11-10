"use client";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import * as React from "react";

type IndividualQuoteRow = {
  id: string;
  quoteNumber: string;
  seller: string;
  company: string;
  date: string;
  expires: string;
  amount: number;
  status: string;
  statusColor: "info" | "warning" | "success";
};

// Fake data for Individual Quotes table
const fakeIndividualQuotesData: IndividualQuoteRow[] = [
  {
    id: "1",
    quoteNumber: "REQ-2024-001",
    seller: "John Anderson",
    company: "United Rentals",
    date: "25/10/2024",
    expires: "08/11/2024",
    amount: 15600,
    status: "New",
    statusColor: "info" as const,
  },
  {
    id: "2",
    quoteNumber: "REQ-2024-002 v2",
    seller: "Sarah Miller",
    company: "Terex",
    date: "28/10/2024",
    expires: "11/11/2024",
    amount: 6200,
    status: "Ready to Accept",
    statusColor: "warning" as const,
  },
  {
    id: "3",
    quoteNumber: "REQ-2024-003",
    seller: "Mike Johnson",
    company: "JLG",
    date: "20/10/2024",
    expires: "03/11/2024",
    amount: 12000,
    status: "Accepted",
    statusColor: "success" as const,
  },
];

interface BuyerIndividualQuotesViewProps {
  searchTerm: string;
}

export function BuyerIndividualQuotesView({ searchTerm }: BuyerIndividualQuotesViewProps) {
  const filteredRows = React.useMemo(() => {
    if (!searchTerm) return fakeIndividualQuotesData;
    const lower = searchTerm.toLowerCase();
    return fakeIndividualQuotesData.filter((row: IndividualQuoteRow) =>
      Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
    );
  }, [searchTerm]);

  const columns: GridColDef[] = [
    {
      field: "quoteNumber",
      headerName: "Quote #",
      width: 160,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 500, fontSize: "14px" }}>{params.value}</Typography>
      ),
    },
    {
      field: "seller",
      headerName: "Seller",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => <Typography sx={{ fontSize: "14px" }}>{params.value}</Typography>,
    },
    {
      field: "company",
      headerName: "Company",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => <Typography sx={{ fontSize: "14px" }}>{params.value}</Typography>,
    },
    {
      field: "date",
      headerName: "Date",
      width: 120,
      renderCell: (params) => <Typography sx={{ fontSize: "14px" }}>{params.value}</Typography>,
    },
    {
      field: "expires",
      headerName: "Expires",
      width: 120,
      renderCell: (params) => <Typography sx={{ fontSize: "14px" }}>{params.value}</Typography>,
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 120,
      renderCell: (params) => (
        <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
          ${params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 160,
      renderCell: (params) => {
        const row = params.row as IndividualQuoteRow;
        return (
          <Chip
            label={params.value}
            color={row.statusColor}
            size="small"
            sx={{
              fontWeight: 500,
            }}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: () => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton size="small" sx={{ color: "#6B7280" }}>
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: "#6B7280" }}>
            <DescriptionOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <DataGridPremium
      columns={columns}
      rows={filteredRows}
      disableRowSelectionOnClick
      hideFooter
      getRowId={(row: IndividualQuoteRow) => row.id}
      sx={{
        border: "none",
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: "#F9FAFB",
          borderRadius: "8px 8px 0 0",
        },
        "& .MuiDataGrid-cell": {
          borderBottom: "1px solid #F3F4F6",
        },
        "& .MuiDataGrid-row:hover": {
          backgroundColor: "#F9FAFB",
          cursor: "pointer",
        },
      }}
    />
  );
}
