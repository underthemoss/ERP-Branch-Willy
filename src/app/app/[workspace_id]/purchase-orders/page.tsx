"use client";

// --- GQL Query Declaration ---
import { graphql } from "@/graphql";
// --- Generated Hook Import ---
import { useListPurchaseOrdersQuery } from "@/graphql/hooks";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DataGridPremium, GridColDef } from "@mui/x-data-grid-premium";
import { format, parseISO } from "date-fns";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import React from "react";

const ListPurchaseOrdersDocument = graphql(`
  query ListPurchaseOrders($limit: Int = 50, $offset: Int = 0) {
    listPurchaseOrders(limit: $limit, offset: $offset) {
      items {
        id
        po_number
        po_issue_date
        created_at
        updated_at
        buyer_contact {
          ... on BusinessContact {
            id
            name
          }
          ... on PersonContact {
            id
            name
          }
        }
        seller_contact {
          ... on BusinessContact {
            id
            name
          }
          ... on PersonContact {
            id
            name
          }
        }
        requester_contact {
          ... on BusinessContact {
            id
            name
          }
          ... on PersonContact {
            id
            name
          }
        }
      }
      total
      limit
      offset
    }
  }
`);

// --- Main Page Component ---
export default function PurchaseOrdersListPage() {
  // --- State for search and filters ---
  const [search, setSearch] = React.useState("");
  const [buyerFilter, setBuyerFilter] = React.useState<string[]>([]);
  const [sellerFilter, setSellerFilter] = React.useState<string[]>([]);
  const [requesterFilter, setRequesterFilter] = React.useState<string[]>([]);

  // --- Query ---
  const { data, loading } = useListPurchaseOrdersQuery({
    variables: { limit: 50, offset: 0 },
    fetchPolicy: "cache-and-network",
  });

  // --- Extract PO data ---
  const purchaseOrders = React.useMemo(() => data?.listPurchaseOrders?.items ?? [], [data]);

  // --- Build filter options from data ---
  const buyers = React.useMemo(() => {
    const set = new Set<string>();
    purchaseOrders.forEach((po) => {
      if (po.buyer_contact?.name) set.add(po.buyer_contact.name);
    });
    return Array.from(set).sort();
  }, [purchaseOrders]);
  const sellers = React.useMemo(() => {
    const set = new Set<string>();
    purchaseOrders.forEach((po) => {
      if (po.seller_contact?.name) set.add(po.seller_contact.name);
    });
    return Array.from(set).sort();
  }, [purchaseOrders]);
  const requesters = React.useMemo(() => {
    const set = new Set<string>();
    purchaseOrders.forEach((po) => {
      if (po.requester_contact?.name) set.add(po.requester_contact.name);
    });
    return Array.from(set).sort();
  }, [purchaseOrders]);

  // --- Filtering logic ---
  const filteredRows = React.useMemo(() => {
    let filtered = purchaseOrders;
    if (buyerFilter.length > 0) {
      filtered = filtered.filter(
        (row) => row.buyer_contact?.name && buyerFilter.includes(row.buyer_contact.name),
      );
    }
    if (sellerFilter.length > 0) {
      filtered = filtered.filter(
        (row) => row.seller_contact?.name && sellerFilter.includes(row.seller_contact.name),
      );
    }
    if (requesterFilter.length > 0) {
      filtered = filtered.filter(
        (row) =>
          row.requester_contact?.name && requesterFilter.includes(row.requester_contact.name),
      );
    }
    if (!search) return filtered;
    const lower = search.toLowerCase();
    return filtered.filter((row) =>
      [
        row.po_number,
        row.buyer_contact?.name,
        row.seller_contact?.name,
        row.requester_contact?.name,
      ]
        .map((v) => (v ?? "").toString().toLowerCase())
        .some((v) => v.includes(lower)),
    );
  }, [purchaseOrders, search, buyerFilter, sellerFilter, requesterFilter]);

  // --- DataGrid columns ---
  // Explicitly type rows as any[] to avoid DataGrid typing issues
  const columns: GridColDef[] = [
    { field: "po_number", headerName: "PO #", width: 120 },
    {
      field: "po_issue_date",
      headerName: "Issue Date",
      width: 140,
      valueFormatter: (value: (typeof purchaseOrders)[number]["po_issue_date"]) => {
        if (!value) return "";
        const date = parseISO(value);
        return format(date, "yyyy-MM-dd");
      },
    },
    {
      field: "buyer_contact",
      headerName: "Buyer",
      width: 180,
      valueGetter: (params: (typeof purchaseOrders)[number]["buyer_contact"]) => {
        return params?.name ?? "";
      },
    },
    {
      field: "seller_contact",
      headerName: "Seller (Vendor)",
      width: 180,
      valueGetter: (params: (typeof purchaseOrders)[number]["seller_contact"]) => {
        return params?.name ?? "";
      },
    },
    {
      field: "requester_contact",
      headerName: "Requester",
      width: 180,
      valueGetter: (params: (typeof purchaseOrders)[number]["requester_contact"]) => {
        return params?.name ?? "";
      },
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 160,
      valueFormatter: (value: (typeof purchaseOrders)[number]["created_at"]) => {
        if (!value) return "";
        const date = parseISO(value as string);
        return format(date, "yyyy-MM-dd HH:mm");
      },
    },
    {
      field: "updated_at",
      headerName: "Updated At",
      width: 160,
      valueFormatter: (value: (typeof purchaseOrders)[number]["updated_at"]) => {
        if (!value) return "";
        const date = parseISO(value as string);
        return format(date, "yyyy-MM-dd HH:mm");
      },
    },
  ];

  // --- Create PO Dialog ---
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const router = useRouter();
  const params = useParams<{ workspace_id: string }>();

  // Dynamically import the dialog to ensure client-side only
  const CreatePurchaseOrderDialog = dynamic(() => import("./CreatePurchaseOrderDialog"), {
    ssr: false,
  });

  const handleCreateSuccess = (purchaseOrderId: string) => {
    setCreateDialogOpen(false);
    if (params?.workspace_id && purchaseOrderId) {
      router.push(`/app/${params.workspace_id}/purchase-orders/${purchaseOrderId}`);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box display="flex" alignItems="center" justifyContent="space-between" mt={4} mb={1}>
        <Typography variant="h1">Purchase Orders</Typography>
        <Button
          variant="contained"
          color="primary"
          sx={{ textTransform: "none", fontWeight: 600 }}
          onClick={() => setCreateDialogOpen(true)}
        >
          + Create Purchase Order
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" mb={2}>
        View, manage, and organize your purchase orders.
      </Typography>
      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField
          placeholder="Search purchase orders"
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
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
        <Select
          size="small"
          multiple
          displayEmpty
          value={buyerFilter}
          onChange={(e) => {
            const value = e.target.value;
            setBuyerFilter(
              typeof value === "string" ? (value === "" ? [] : [value]) : (value as string[]),
            );
          }}
          renderValue={(selected) => {
            if (!selected || (Array.isArray(selected) && selected.length === 0)) {
              return "All Buyers";
            }
            return (selected as string[]).join(", ");
          }}
          sx={{ minWidth: 180 }}
          data-testid="purchase-order-buyer-filter"
          MenuProps={{
            MenuListProps: {
              dense: true,
            },
          }}
        >
          <MenuItem value="">
            <em>All Buyers</em>
          </MenuItem>
          {buyers.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          multiple
          displayEmpty
          value={sellerFilter}
          onChange={(e) => {
            const value = e.target.value;
            setSellerFilter(
              typeof value === "string" ? (value === "" ? [] : [value]) : (value as string[]),
            );
          }}
          renderValue={(selected) => {
            if (!selected || (Array.isArray(selected) && selected.length === 0)) {
              return "All Sellers";
            }
            return (selected as string[]).join(", ");
          }}
          sx={{ minWidth: 180 }}
          data-testid="purchase-order-seller-filter"
          MenuProps={{
            MenuListProps: {
              dense: true,
            },
          }}
        >
          <MenuItem value="">
            <em>All Sellers</em>
          </MenuItem>
          {sellers.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          multiple
          displayEmpty
          value={requesterFilter}
          onChange={(e) => {
            const value = e.target.value;
            setRequesterFilter(
              typeof value === "string" ? (value === "" ? [] : [value]) : (value as string[]),
            );
          }}
          renderValue={(selected) => {
            if (!selected || (Array.isArray(selected) && selected.length === 0)) {
              return "All Requesters";
            }
            return (selected as string[]).join(", ");
          }}
          sx={{ minWidth: 180 }}
          data-testid="purchase-order-requester-filter"
          MenuProps={{
            MenuListProps: {
              dense: true,
            },
          }}
        >
          <MenuItem value="">
            <em>All Requesters</em>
          </MenuItem>
          {requesters.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ height: 600 }}>
        <div style={{ height: "100%" }}>
          <DataGridPremium
            columns={columns}
            rows={filteredRows as any[]}
            loading={loading}
            disableRowSelectionOnClick
            hideFooter
            getRowId={(row) => row.id}
            onRowClick={(rowParams) => {
              router.push(`/app/${params.workspace_id}/purchase-orders/${rowParams.row.id}`);
            }}
            initialState={{
              pinnedColumns: { left: ["po_number"] },
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
      <CreatePurchaseOrderDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </Container>
  );
}
