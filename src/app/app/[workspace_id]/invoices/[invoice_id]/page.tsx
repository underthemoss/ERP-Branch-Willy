"use client";

import { graphql } from "@/graphql";
import { useInvoiceByIdQuery } from "@/graphql/hooks";
import InvoiceRender from "@/ui/invoices/InvoiceRender";
import { Box, Button, Container, Divider, Grid, Paper, Stack, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import React from "react";

const InvoiceByIdQuery = graphql(`
  query InvoiceById($id: String!) {
    invoiceById(id: $id) {
      id
      amount
      status
      createdAt
      updatedAt
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
    }
  }
`);

export default function InvoiceDisplayPage() {
  const params = useParams();
  const invoiceId = params.invoice_id as string;

  const { data, loading, error } = useInvoiceByIdQuery({
    variables: { id: invoiceId },
    fetchPolicy: "cache-and-network",
  });

  const invoice = data?.invoiceById;

  // Helper to format ISO date strings
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

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      {loading && (
        <Typography variant="body1" color="text.secondary">
          Loading invoice details...
        </Typography>
      )}
      {error && (
        <Typography variant="body1" color="error">
          Error loading invoice: {error.message}
        </Typography>
      )}
      {!loading && !error && invoice && (
        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Top Card: Invoice Overview */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="h4" gutterBottom>
                    Invoice #{invoice.id}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Status: {invoice.status}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Amount: {invoice.amount != null ? `$${invoice.amount.toFixed(2)}` : ""}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Buyer: {invoice.buyer?.name ?? ""}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Seller: {invoice.seller?.name ?? ""}
                  </Typography>
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
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
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
                      Buyer Details
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Typography>{invoice.buyer?.name ?? "—"}</Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex" }}>
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
                      Seller Details
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Typography>{invoice.seller?.name ?? "—"}</Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Items Section */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Items
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                No items found for this invoice.
              </Typography>
              <Button variant="outlined" size="small" disabled>
                Add Item (stub)
              </Button>
            </Paper>

            {/* Printable Invoice */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Invoice Preview
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <InvoiceRender invoiceId={invoiceId} scale={0.85} />
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
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatDate(invoice.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Updated At
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatDate(invoice.updatedAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Invoice ID
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {invoice.id}
                  </Typography>
                </Box>
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
                Need help with this invoice?
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
                View All Invoices (stub)
              </Button>
              <Button variant="outlined" size="small" sx={{ width: "100%" }} disabled>
                Upgrade Plan (stub)
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
