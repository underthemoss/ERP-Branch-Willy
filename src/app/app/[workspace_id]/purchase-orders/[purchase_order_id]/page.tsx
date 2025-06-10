"use client";

import { graphql } from "@/graphql";
// --- Types for generated hook (will be generated after codegen) ---
import { usePurchaseOrderDisplayPage_GetPurchaseOrderByIdQuery } from "@/graphql/hooks";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import * as React from "react";
import LineItemsDataGrid from "./LineItemsDataGrid";

// --- GQL Query (unique to this component) ---
const PURCHASE_ORDER_DISPLAY_QUERY = graphql(`
  query PurchaseOrderDisplayPage_GetPurchaseOrderById($id: String!) {
    getPurchaseOrderById(id: $id) {
      id
      po_number
      po_issue_date
      company_id
      created_at
      created_by
      created_by_user {
        firstName
        lastName
        email
      }
      updated_at
      updated_by
      updated_by_user {
        firstName
        lastName
        email
      }
      buyer_project_id
      buyer_contact {
        ... on BusinessContact {
          id
          name
          address
          phone
          website
        }
        ... on PersonContact {
          id
          name
          email
          phone
        }
      }
      seller_contact {
        ... on BusinessContact {
          id
          name
          address
          phone
          website
        }
        ... on PersonContact {
          id
          name
          email
          phone
        }
      }
      requester_contact {
        ... on BusinessContact {
          id
          name
          address
          phone
          website
        }
        ... on PersonContact {
          id
          name
          email
          phone
        }
      }
      line_items {
        id
        po_pim_id
        po_quantity
      }
    }
  }
`);

// --- Helper: Format date ---
function formatDate(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// --- Main Component ---
export default function PurchaseOrderDisplayPage() {
  const params = useParams<{ purchase_order_id: string }>();
  const purchaseOrderId = params?.purchase_order_id;

  const { data, loading, error } = usePurchaseOrderDisplayPage_GetPurchaseOrderByIdQuery({
    variables: { id: purchaseOrderId },
    fetchPolicy: "cache-and-network",
  });

  // --- Data mapping ---
  const po = data?.getPurchaseOrderById;

  // Overview fields
  const overviewFields = [
    { label: "PO Number", value: po?.po_number || "-" },
    { label: "Issue Date", value: formatDate(po?.po_issue_date) || "-" },
    { label: "Buyer", value: po?.buyer_contact?.name || "-" },
    { label: "Seller", value: po?.seller_contact?.name || "-" },
    { label: "Requester", value: po?.requester_contact?.name || "-" },
    { label: "Project ID", value: po?.buyer_project_id || "-" },
  ];

  // Info cards
  const infoCards = [
    {
      title: "Buyer Details",
      content: po?.buyer_contact ? (
        <Stack spacing={1}>
          <Typography variant="body2">Name: {po.buyer_contact.name}</Typography>
          {"address" in po.buyer_contact && po.buyer_contact.address && (
            <Typography variant="body2">Address: {po.buyer_contact.address}</Typography>
          )}
          {"phone" in po.buyer_contact && po.buyer_contact.phone && (
            <Typography variant="body2">Phone: {po.buyer_contact.phone}</Typography>
          )}
          {"website" in po.buyer_contact && po.buyer_contact.website && (
            <Typography variant="body2">Website: {po.buyer_contact.website}</Typography>
          )}
          {"email" in po.buyer_contact && po.buyer_contact.email && (
            <Typography variant="body2">Email: {po.buyer_contact.email}</Typography>
          )}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No buyer contact info.
        </Typography>
      ),
    },
    {
      title: "Seller Details",
      content: po?.seller_contact ? (
        <Stack spacing={1}>
          <Typography variant="body2">Name: {po.seller_contact.name}</Typography>
          {"address" in po.seller_contact && po.seller_contact.address && (
            <Typography variant="body2">Address: {po.seller_contact.address}</Typography>
          )}
          {"phone" in po.seller_contact && po.seller_contact.phone && (
            <Typography variant="body2">Phone: {po.seller_contact.phone}</Typography>
          )}
          {"website" in po.seller_contact && po.seller_contact.website && (
            <Typography variant="body2">Website: {po.seller_contact.website}</Typography>
          )}
          {"email" in po.seller_contact && po.seller_contact.email && (
            <Typography variant="body2">Email: {po.seller_contact.email}</Typography>
          )}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No seller contact info.
        </Typography>
      ),
    },
  ] as const;

  // Metadata
  const metadata = [
    { label: "Created At", value: formatDate(po?.created_at) || "-" },
    {
      label: "Created By",
      value: po?.created_by_user
        ? `${po.created_by_user.firstName} ${po.created_by_user.lastName}`.trim() ||
          po.created_by_user.email ||
          po.created_by ||
          "-"
        : po?.created_by || "-",
    },
    { label: "Updated At", value: formatDate(po?.updated_at) || "-" },
    {
      label: "Updated By",
      value: po?.updated_by_user
        ? `${po.updated_by_user.firstName} ${po.updated_by_user.lastName}`.trim() ||
          po.updated_by_user.email ||
          po.updated_by ||
          "-"
        : po?.updated_by || "-",
    },
    { label: "Company ID", value: po?.company_id || "-" },
    { label: "PO ID", value: po?.id || "-" },
  ];

  // --- Render ---
  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
        {loading && (
          <Box display="flex" alignItems="center" justifyContent="center" minHeight={300}>
            <CircularProgress size={32} sx={{ mr: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Loading purchase order details...
            </Typography>
          </Box>
        )}
        {error && (
          <Typography variant="body1" color="error">
            Error loading purchase order: {error.message}
          </Typography>
        )}
        {!loading && !error && po && (
          <Grid container spacing={3}>
            {/* Main Content */}
            <Grid size={{ xs: 12, md: 8 }}>
              {/* Top Card: PO Overview */}
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Grid container alignItems="center" justifyContent="space-between">
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Typography variant="h4" gutterBottom>
                      Purchase Order #{po.po_number || po.id}
                    </Typography>
                    {overviewFields.map((field) => (
                      <Typography
                        key={field.label}
                        variant="subtitle1"
                        color="text.secondary"
                        gutterBottom
                      >
                        {field.label}: {field.value}
                      </Typography>
                    ))}
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { md: "right", xs: "left" } }}>
                    <Button variant="contained" sx={{ mr: 1 }} disabled>
                      Edit
                    </Button>
                    <Button variant="outlined" color="secondary" disabled>
                      Print
                    </Button>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                {/* Stubbed Progress Bar */}
                <Box sx={{ width: "100%", mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Progress
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box sx={{ width: "80%", mr: 1 }}>
                      {/* Replace with real progress if available */}
                      <Box sx={{ bgcolor: "#e0e0e0", borderRadius: 1, height: 10 }}>
                        <Box
                          sx={{
                            width: "40%",
                            bgcolor: "primary.main",
                            height: 10,
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      2 of 5 steps
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Info Cards */}
              <Grid container spacing={3} alignItems="stretch" sx={{ mb: 3 }}>
                {infoCards.map((card, idx) => (
                  <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }} key={card.title}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        mb: 3,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }}
                    >
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {card.title}
                        </Typography>
                        <Divider sx={{ mb: 1 }} />
                        {card.content}
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Line Items Section */}
              <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <LineItemsDataGrid purchaseOrderId={purchaseOrderId} />
              </Paper>
            </Grid>

            {/* Sidebar */}
            <Grid size={{ xs: 12, md: 4 }}>
              {/* Metadata Card */}
              <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Metadata
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <Stack spacing={2}>
                  {metadata.map((meta) => (
                    <Box key={meta.label}>
                      <Typography variant="body2" color="text.secondary">
                        {meta.label}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {meta.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              {/* Stubbed Help/Support Card */}
              <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: "#fffbe6" }}>
                <Typography variant="body1" sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box
                    component="span"
                    sx={{
                      display: "inline-block",
                      width: 24,
                      height: 24,
                      bgcolor: "#ffe082",
                      borderRadius: "50%",
                      mr: 1,
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    ?
                  </Box>
                  Need help with this purchase order?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Our team would be happy to help you with any kind of problem you might have!
                </Typography>
                <Button variant="contained" color="warning" size="small" disabled>
                  Get Help (stub)
                </Button>
              </Paper>

              {/* Stubbed Quick Links */}
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Quick Links
                </Typography>
                <Button variant="outlined" size="small" sx={{ mb: 1, width: "100%" }} disabled>
                  Invite Team (stub)
                </Button>
                <Button variant="outlined" size="small" sx={{ mb: 1, width: "100%" }} disabled>
                  View All Purchase Orders (stub)
                </Button>
                <Button variant="outlined" size="small" sx={{ width: "100%" }} disabled>
                  Upgrade Plan (stub)
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
        {!loading && !error && !po && (
          <Typography variant="body1" color="text.secondary">
            No purchase order found for ID: {purchaseOrderId}
          </Typography>
        )}
      </Container>
    </>
  );
}
