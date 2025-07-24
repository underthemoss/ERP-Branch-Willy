"use client";

import { graphql } from "@/graphql";
import { useListInvoicesInvoiceListPageQuery } from "@/graphql/hooks";
import { Box, Button, Chip, Container, Typography } from "@mui/material";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import { format } from "date-fns";
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
        sellerId
        buyerId
        createdAt
        updatedAt
        createdBy
        updatedBy
        subTotalInCents
        totalTaxesInCents
        finalSumInCents
        status
        invoiceSentDate
        invoicePaidDate
        seller {
          __typename
          ... on BusinessContact {
            id
            name
          }
          ... on PersonContact {
            id
            name
            business {
              id
              name
            }
          }
        }
        buyer {
          __typename
          ... on BusinessContact {
            id
            name
          }
          ... on PersonContact {
            id
            name
            business {
              id
              name
            }
          }
        }
        createdByUser {
          id
          firstName
          lastName
        }
        updatedByUser {
          id
          firstName
          lastName
        }
      }
    }
  }
`);

const columns: GridColDef[] = [
  {
    field: "number",
    headerName: "Invoice ID",
    width: 180,
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
  { field: "buyer", headerName: "Bill To", width: 120 },
  { field: "seller", headerName: "From", width: 120 },
  {
    field: "total",
    headerName: "Total",
    type: "number",
    width: 100,
    valueFormatter: (value?: number) => {
      const val = value ?? 0;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(val);
    },
  },
  {
    field: "status",
    headerName: "Status",
    width: 100,
    renderCell: (params) => {
      // Helper to map status to MUI Chip color
      function getStatusChipColor(status?: string) {
        switch (status) {
          case "PAID":
            return "success";
          case "DRAFT":
            return "default";
          case "SENT":
            return "info";
          case "OVERDUE":
            return "error";
          case "PARTIAL":
            return "warning";
          default:
            return "default";
        }
      }
      return (
        <Chip
          label={params.value}
          color={getStatusChipColor(params.value)}
          sx={{
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: 1,
            minWidth: 80,
          }}
          size="small"
        />
      );
    },
  },
  {
    field: "sentDate",
    headerName: "Sent At",
    type: "dateTime",
    width: 150,
    valueFormatter: (value: any) => {
      return value ? format(new Date(value), "MM/dd/yy, h:mm:ss a") : "";
    },
  },
  {
    field: "paidDate",
    headerName: "Paid At",
    type: "dateTime",
    width: 150,
    valueFormatter: (value: any) => {
      return value ? format(new Date(value), "MM/dd/yy, h:mm:ss a") : "";
    },
  },
  {
    field: "subtotal",
    headerName: "Subtotal",
    type: "number",
    width: 100,
    valueFormatter: (value?: number) => {
      const val = value ?? 0;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(val);
    },
  },
  {
    field: "taxes",
    headerName: "Taxes",
    type: "number",
    width: 100,
    valueFormatter: (value?: number) => {
      const val = value ?? 0;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(val);
    },
  },
  {
    field: "createdAt",
    headerName: "Created At",
    type: "dateTime",
    width: 150,
    valueFormatter: (value: any) => {
      return value ? format(new Date(value), "MM/dd/yy, h:mm:ss a") : "";
    },
  },
  { field: "createdBy", headerName: "Created By", width: 150 },
  { field: "updatedBy", headerName: "Updated By", width: 150 },
  {
    field: "updatedAt",
    headerName: "Updated At",
    type: "dateTime",
    width: 150,
    valueFormatter: (value: any) => {
      return value ? format(new Date(value), "MM/dd/yy, h:mm:ss a") : "";
    },
  },
];

export default function InvoicesPage() {
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
      createdAt: inv.createdAt ? new Date(inv.createdAt) : null,
      buyer:
        inv.buyer?.__typename === "PersonContact"
          ? inv.buyer.business?.name || inv.buyer.name || ""
          : inv.buyer?.name || "",
      seller:
        inv.seller?.__typename === "PersonContact"
          ? inv.seller.business?.name || inv.seller.name || "-"
          : inv.seller?.name || "-",
      subtotal: inv.subTotalInCents != null ? inv.subTotalInCents / 100 : null,
      taxes: inv.totalTaxesInCents != null ? inv.totalTaxesInCents / 100 : null,
      total: inv.finalSumInCents != null ? inv.finalSumInCents / 100 : null,
      status: inv.status,
      sentDate: inv.invoiceSentDate ? new Date(inv.invoiceSentDate) : null,
      paidDate: inv.invoicePaidDate ? new Date(inv.invoicePaidDate) : null,
      createdBy: inv.createdByUser
        ? `${inv.createdByUser.firstName} ${inv.createdByUser.lastName}`.trim()
        : "",
      updatedBy: inv.updatedByUser
        ? `${inv.updatedByUser.firstName} ${inv.updatedByUser.lastName}`.trim()
        : "",
      updatedAt: inv.updatedAt ? new Date(inv.updatedAt) : null,
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
        <Box sx={{ height: 600 }}>
          {error && (
            <Typography color="error" variant="body2" mb={2}>
              Error loading invoices: {error.message}
            </Typography>
          )}
          <div style={{ height: "100%" }}>
            <DataGridPremium
              loading={loading}
              columns={columns}
              rows={rows}
              disableRowSelectionOnClick
              showToolbar
              getRowId={(row) => row.id}
              initialState={{
                columns: {
                  columnVisibilityModel: {
                    subtotal: false,
                    taxes: false,
                    sentDate: false,
                    paidDate: false,
                  },
                },
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
