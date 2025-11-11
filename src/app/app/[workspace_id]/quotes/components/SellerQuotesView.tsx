"use client";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

type SalesQuoteRow = {
  id: string;
  quoteNumber: string;
  buyer: string;
  company: string;
  date: string;
  expires: string;
  amount: number;
  status: string;
  statusColor: "default" | "info" | "secondary";
};

// Fake data for Sales Quotes (As Seller view)
const fakeSalesQuotesData: SalesQuoteRow[] = [
  {
    id: "1",
    quoteNumber: "QUO-2025-994",
    buyer: "Lisa Rodriguez",
    company: "OES",
    date: "05/01/2025",
    expires: "19/01/2025",
    amount: 350,
    status: "Draft",
    statusColor: "default" as const,
  },
  {
    id: "2",
    quoteNumber: "QUO-2025-547 v3",
    buyer: "Michael Torres",
    company: "Flintco",
    date: "03/01/2025",
    expires: "18/01/2025",
    amount: 1875,
    status: "Sent",
    statusColor: "info" as const,
  },
  {
    id: "3",
    quoteNumber: "QUO-2024-101 v2",
    buyer: "Michael Torres",
    company: "Flintco",
    date: "26/10/2024",
    expires: "09/11/2024",
    amount: 21200,
    status: "Approved",
    statusColor: "secondary" as const,
  },
];

interface SellerQuotesViewProps {
  searchTerm: string;
}

export function SellerQuotesView({ searchTerm }: SellerQuotesViewProps) {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspace_id as string;

  const filteredRows = React.useMemo(() => {
    if (!searchTerm) return fakeSalesQuotesData;
    const lower = searchTerm.toLowerCase();
    return fakeSalesQuotesData.filter((row: SalesQuoteRow) =>
      Object.values(row).some((value) => (value ?? "").toString().toLowerCase().includes(lower)),
    );
  }, [searchTerm]);

  const handleRowClick = (quoteId: string) => {
    router.push(`/app/${workspaceId}/quotes/${quoteId}`);
  };

  const handleViewClick = (event: React.MouseEvent, quoteId: string) => {
    event.stopPropagation();
    router.push(`/app/${workspaceId}/quotes/${quoteId}`);
  };

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
      field: "buyer",
      headerName: "Buyer",
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
        const row = params.row as SalesQuoteRow;
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
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Generate PDF">
            <IconButton size="small" sx={{ color: "#6B7280" }}>
              <DescriptionOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              sx={{ color: "#6B7280" }}
              onClick={(e) => handleViewClick(e, params.row.id)}
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
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
      getRowId={(row: SalesQuoteRow) => row.id}
      onRowClick={(params) => handleRowClick(params.row.id)}
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
