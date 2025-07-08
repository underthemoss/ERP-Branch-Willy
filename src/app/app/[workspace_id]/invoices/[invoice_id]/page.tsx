"use client";

import { graphql } from "@/graphql";
import { useInvoiceByIdQuery } from "@/graphql/hooks";
import InvoiceRender from "@/ui/invoices/InvoiceRender";
import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
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

  const [sendDialogOpen, setSendDialogOpen] = React.useState(false);

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
                    Invoice
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
                <Grid
                  size={{ xs: 12, md: 4 }}
                  sx={{
                    textAlign: { md: "right", xs: "left" },
                    display: "flex",
                    flexDirection: "column",
                    alignItems: { md: "flex-end", xs: "flex-start" },
                    gap: 1,
                  }}
                >
                  <Chip
                    label={invoice.status}
                    color={getStatusChipColor(invoice.status)}
                    sx={{ mb: 1, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1 }}
                  />
                  <Box display={"flex"} gap={1}>
                    <Button variant="outlined" color="secondary" disabled>
                      Print
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setSendDialogOpen(true)}
                    >
                      Mark as sent
                    </Button>
                  </Box>
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

            {/* Buyer & Seller Details Card */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Buyer & Seller Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Buyer
                </Typography>
                <Typography>{invoice.buyer?.name ?? "—"}</Typography>
                {invoice.buyer?.__typename === "BusinessContact" && (
                  <Typography color="text.secondary" variant="body2">
                    {invoice.buyer.website ? `Website: ${invoice.buyer.website}` : ""}
                  </Typography>
                )}
                {invoice.buyer?.__typename === "PersonContact" && (
                  <Typography color="text.secondary" variant="body2">
                    {invoice.buyer.email ? `Email: ${invoice.buyer.email}` : ""}
                  </Typography>
                )}
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Seller
                </Typography>
                <Typography>{invoice.seller?.name ?? "—"}</Typography>
                {invoice.seller?.__typename === "BusinessContact" && (
                  <Typography color="text.secondary" variant="body2">
                    {invoice.seller.website ? `Website: ${invoice.seller.website}` : ""}
                  </Typography>
                )}
                {invoice.seller?.__typename === "PersonContact" && (
                  <Typography color="text.secondary" variant="body2">
                    {invoice.seller.email ? `Email: ${invoice.seller.email}` : ""}
                  </Typography>
                )}
              </Box>
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
      {/* Mark as Sent Confirmation Dialog */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)}>
        <DialogTitle>Mark as sent</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to mark this invoice as sent?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={() => setSendDialogOpen(false)} color="primary" variant="contained">
            Mark as sent
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
