"use client";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Box, Button, Chip, Typography } from "@mui/material";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import * as React from "react";

type QuoteRow = {
  id: string;
  rfqNumber: string;
  invitedSellers: Array<{ name: string; id: string }>;
  products: Array<{ name: string; id: string }>;
  created: string;
  expires: string;
  responseCount: number;
  totalResponses: number;
  status: string;
  statusColor: "warning" | "default" | "success";
  lowValue: number | null;
};

// Fake data for RFQs table
const fakeRFQData: QuoteRow[] = [
  {
    id: "1",
    rfqNumber: "RFQ-2024-001",
    invitedSellers: [
      { name: "United Rentals", id: "1" },
      { name: "Sunbelt Rentals", id: "2" },
    ],
    products: [
      { name: "Scissor Lift 26ft", id: "1" },
      { name: "Boom Lift", id: "2" },
    ],
    created: "28/10/2024",
    expires: "11/11/2024",
    responseCount: 2,
    totalResponses: 3,
    status: "2/3 Responses",
    statusColor: "warning" as const,
    lowValue: 26500,
  },
  {
    id: "2",
    rfqNumber: "RFQ-2024-002",
    invitedSellers: [
      { name: "JLG Industries", id: "3" },
      { name: "Terex", id: "4" },
    ],
    products: [{ name: "Excavator 320", id: "3" }],
    created: "30/10/2024",
    expires: "13/11/2024",
    responseCount: 0,
    totalResponses: 3,
    status: "Awaiting",
    statusColor: "default" as const,
    lowValue: null,
  },
];

interface BuyerRFQsViewProps {
  searchTerm: string;
}

export function BuyerRFQsView({ searchTerm }: BuyerRFQsViewProps) {
  const filteredRows = React.useMemo(() => {
    if (!searchTerm) return fakeRFQData;
    const lower = searchTerm.toLowerCase();
    return fakeRFQData.filter((row: QuoteRow) =>
      Object.values(row).some((value) => {
        if (Array.isArray(value)) {
          return value.some((item) =>
            typeof item === "object" ? item.name?.toLowerCase().includes(lower) : false,
          );
        }
        return (value ?? "").toString().toLowerCase().includes(lower);
      }),
    );
  }, [searchTerm]);

  const columns: GridColDef[] = [
    {
      field: "rfqNumber",
      headerName: "RFQ #",
      width: 140,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 500, fontSize: "14px" }}>{params.value}</Typography>
      ),
    },
    {
      field: "invitedSellers",
      headerName: "Invited Sellers",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => {
        const sellers = params.value as Array<{ name: string; id: string }>;
        const displaySellers = sellers.slice(0, 2);
        const remaining = sellers.length - displaySellers.length;

        return (
          <Box>
            <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
              {sellers.length} {sellers.length === 1 ? "seller" : "sellers"}
            </Typography>
            <Typography sx={{ fontSize: "12px", color: "#8B919E" }}>
              {displaySellers.map((s) => s.name).join(", ")}
              {remaining > 0 ? ` +${remaining}` : ""}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "products",
      headerName: "Products",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => {
        const products = params.value as Array<{ name: string; id: string }>;
        const displayProducts = products.slice(0, 1);
        const remaining = products.length - displayProducts.length;

        return (
          <Box>
            <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
              {products.length} {products.length === 1 ? "items" : "items"}
            </Typography>
            <Typography sx={{ fontSize: "12px", color: "#8B919E" }}>
              {displayProducts.map((p) => p.name).join(", ")}
              {remaining > 0 ? ` +${remaining}` : ""}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "created",
      headerName: "Created",
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
      field: "status",
      headerName: "Responses",
      width: 150,
      renderCell: (params) => {
        const row = params.row as QuoteRow;
        const statusColor =
          row.statusColor === "warning"
            ? "warning"
            : row.statusColor === "success"
              ? "success"
              : "default";

        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography sx={{ fontSize: "14px", fontWeight: 500 }}>
              {row.responseCount}/{row.totalResponses}
            </Typography>
            <Chip
              label={params.value}
              color={statusColor}
              size="small"
              sx={{
                height: "20px",
                fontSize: "11px",
                "& .MuiChip-label": {
                  px: 1,
                },
              }}
            />
          </Box>
        );
      },
    },
    {
      field: "lowValue",
      headerName: "Status",
      width: 140,
      renderCell: (params) => {
        const row = params.row as QuoteRow;
        if (row.status === "Awaiting") {
          return <Chip label="Awaiting" size="small" />;
        }
        return (
          <Chip
            label={`${row.status.split("/")[0]}/${row.status.split("/")[1].split(" ")[0]} Responses`}
            color="warning"
            size="small"
            sx={{
              backgroundColor: "#FFF4E5",
              color: "#D97706",
            }}
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      renderCell: () => (
        <Button
          startIcon={<VisibilityOutlinedIcon />}
          size="small"
          sx={{
            textTransform: "none",
            color: "#2F2B43",
            fontSize: "14px",
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <DataGridPremium
      columns={columns}
      rows={filteredRows}
      disableRowSelectionOnClick
      hideFooter
      getRowId={(row: QuoteRow) => row.id}
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
