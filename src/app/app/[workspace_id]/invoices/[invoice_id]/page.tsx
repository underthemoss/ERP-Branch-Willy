"use client";

import { graphql } from "@/graphql";
import {
  useCreatePdfFromPageAndAttachToInvoiceMutation,
  useInvoiceByIdQuery,
} from "@/graphql/hooks";
import AttachedFilesSection from "@/ui/AttachedFilesSection";
import AddInvoiceLineItemDialog from "@/ui/invoices/AddInvoiceLineItemDialog";
import InvoiceRender from "@/ui/invoices/InvoiceRender";
import NotesSection from "@/ui/notes/NotesSection";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import {
  Alert,
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
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useParams } from "next/navigation";
import React from "react";

graphql(`
  mutation CreatePdfFromPageAndAttachToInvoice(
    $entity_id: String!
    $path: String!
    $file_name: String!
  ) {
    createPdfFromPageAndAttachToEntityId(
      entity_id: $entity_id
      path: $path
      file_name: $file_name
    ) {
      success
      error_message
    }
  }
`);

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
  const workspaceId = params.workspace_id as string;

  const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
  const [sentDate, setSentDate] = React.useState<Date | null>(new Date());

  const [addItemDialogOpen, setAddItemDialogOpen] = React.useState(false);
  const [addItemTab, setAddItemTab] = React.useState(0);

  const [cachekey, setCacheKey] = React.useState(0);

  const { data, loading, error } = useInvoiceByIdQuery({
    variables: { id: invoiceId },
    fetchPolicy: "cache-and-network",
  });

  const invoice = data?.invoiceById;

  // Print mutation
  const [createPdf, { loading: pdfLoading, data: pdfData, error: pdfError }] =
    useCreatePdfFromPageAndAttachToInvoiceMutation();

  // Snackbar for print success
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  React.useEffect(() => {
    if (pdfData?.createPdfFromPageAndAttachToEntityId?.success) {
      setSnackbarOpen(true);
      setCacheKey((k) => k + 1); // Refresh files
    }
  }, [pdfData]);

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

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
                <Grid size={{ xs: 6 }}>
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
                  size={{ xs: 6 }}
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
                  <Box
                    display="flex"
                    gap={2}
                    width="100%"
                    flexDirection={{ xs: "column", sm: "row" }}
                  >
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<PrintOutlinedIcon />}
                      disabled={pdfLoading}
                      sx={{
                        minWidth: 140,
                        whiteSpace: "nowrap",
                        flex: 1,
                        maxWidth: { xs: "100%", sm: "unset" },
                      }}
                      onClick={async () => {
                        if (!invoice?.id || !workspaceId || !invoiceId) return;
                        // Format file name as invoice-YYYY-MM-DD
                        const today = new Date();
                        const yyyy = today.getFullYear();
                        const mm = String(today.getMonth() + 1).padStart(2, "0");
                        const dd = String(today.getDate()).padStart(2, "0");
                        const fileName = `invoice-${yyyy}-${mm}-${dd}`;
                        await createPdf({
                          variables: {
                            entity_id: invoice.id,
                            path: `app/${workspaceId}/invoices/${invoiceId}/print`,
                            file_name: fileName,
                          },
                        });
                      }}
                    >
                      {pdfLoading ? "Generating PDF..." : "Print"}
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{
                        minWidth: 140,
                        whiteSpace: "nowrap",
                        flex: 1,
                        maxWidth: { xs: "100%", sm: "unset" },
                      }}
                      onClick={() => setSendDialogOpen(true)}
                    >
                      Mark as sent
                    </Button>
                  </Box>
                  {pdfData?.createPdfFromPageAndAttachToEntityId?.success && (
                    <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                      PDF attached!
                    </Typography>
                  )}
                  {pdfError && (
                    <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                      {pdfError.message}
                    </Typography>
                  )}
                  {pdfData?.createPdfFromPageAndAttachToEntityId?.error_message && (
                    <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                      {pdfData.createPdfFromPageAndAttachToEntityId.error_message}
                    </Typography>
                  )}
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
            {/* Printable Invoice */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Invoice Preview
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <Box
                sx={{
                  maxHeight: "450px",
                  overflow: "scroll",
                }}
              >
                <Box
                  sx={{
                    width: "816px",
                    height: "1056px",
                    // maxWidth: "100%",
                    maxHeight: "70vh",
                    // aspectRatio: "8.5 / 11",
                    p: 7,
                    bgcolor: "#f8f6f1",
                    border: "1px solid #ccc",
                    boxShadow: 3,
                    transform: "scale(0.85) translate(0, 0)",
                    transformOrigin: "top left",
                  }}
                >
                  <InvoiceRender invoiceId={invoiceId} scale={1} />
                </Box>
              </Box>
              <Box mt={2}>
                <Button variant="outlined" size="small" onClick={() => setAddItemDialogOpen(true)}>
                  Add Line Item
                </Button>
              </Box>
            </Paper>

            {/* File Upload Card */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Attached Files
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <AttachedFilesSection key={`files-${cachekey}`} entityId={invoice.id} />
            </Paper>

            {/* Notes Section */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <NotesSection entityId={invoice.id} />
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
          <Typography sx={{ mb: 2 }}>Please select the date this invoice was sent.</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Sent date"
              value={sentDate}
              onChange={(value) => {
                if (value === null || value instanceof Date) {
                  setSentDate(value);
                }
              }}
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
              maxDate={new Date()}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => setSendDialogOpen(false)}
            color="primary"
            variant="contained"
            disabled={!sentDate}
          >
            Mark as sent
          </Button>
        </DialogActions>
      </Dialog>
      {/* Add Invoice Line Item Dialog */}
      <AddInvoiceLineItemDialog
        open={addItemDialogOpen}
        onClose={() => setAddItemDialogOpen(false)}
      />
      {/* Snackbar for print success */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{ width: "100%" }}
          variant="filled"
        >
          PDF attached to invoice!
        </Alert>
      </Snackbar>
    </Container>
  );
}
