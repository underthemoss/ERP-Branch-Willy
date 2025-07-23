"use client";

import { graphql } from "@/graphql";
import {
  useCreatePdfFromPageAndAttachToInvoiceMutation,
  useDeleteInvoiceMutation,
  useInvoiceByIdQuery,
  useMarkInvoiceAsPaidMutation,
  useMarkInvoiceAsSentMutation,
} from "@/graphql/hooks";
import AttachedFilesSection from "@/ui/AttachedFilesSection";
import AddInvoiceLineItemDialog from "@/ui/invoices/AddInvoiceLineItemDialog";
import EditInvoiceTaxesDialog from "@/ui/invoices/EditInvoiceTaxesDialog";
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
  Step,
  StepLabel,
  Stepper,
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

graphql(`
  mutation MarkInvoiceAsSent($input: MarkInvoiceAsSentInput!) {
    markInvoiceAsSent(input: $input) {
      id
      status
      invoiceSentDate
    }
  }
`);

graphql(`
  mutation MarkInvoiceAsPaid($input: MarkInvoiceAsPaidInput!) {
    markInvoiceAsPaid(input: $input) {
      id
      status
      invoicePaidDate
    }
  }
`);

graphql(`
  mutation DeleteInvoice($id: String!) {
    deleteInvoice(id: $id)
  }
`);

const InvoiceByIdQuery = graphql(`
  query InvoiceById($id: String!) {
    invoiceById(id: $id) {
      id
      subTotalInCents
      taxPercent
      totalTaxesInCents
      status
      createdAt
      updatedAt
      taxLineItems {
        id
        description
        type
        value
        order
        calculatedAmountInCents
      }
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
  // Print dialog state
  const [printDialogOpen, setPrintDialogOpen] = React.useState(false);
  const [printFileName, setPrintFileName] = React.useState("");
  const params = useParams();
  const invoiceId = params.invoice_id as string;
  const workspaceId = params.workspace_id as string;

  const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
  const [sentDate, setSentDate] = React.useState<Date | null>(new Date());

  const [addItemDialogOpen, setAddItemDialogOpen] = React.useState(false);
  const [addItemTab, setAddItemTab] = React.useState(0);

  // Edit Taxes dialog state
  const [editTaxesDialogOpen, setEditTaxesDialogOpen] = React.useState(false);

  const [cachekey, setCacheKey] = React.useState(0);

  // Mark as paid dialog state
  const [paidDialogOpen, setPaidDialogOpen] = React.useState(false);
  const [paidDate, setPaidDate] = React.useState<Date | null>(new Date());

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const { data, loading, error, refetch } = useInvoiceByIdQuery({
    variables: { id: invoiceId },
    fetchPolicy: "cache-and-network",
  });

  const invoice = data?.invoiceById;

  // Print mutation
  const [createPdf, { loading: pdfLoading, data: pdfData, error: pdfError }] =
    useCreatePdfFromPageAndAttachToInvoiceMutation();

  // Snackbar for print success
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);

  // Mark as sent mutation
  const [markAsSent, { loading: markAsSentLoading, data: markAsSentData, error: markAsSentError }] =
    useMarkInvoiceAsSentMutation();

  // Snackbar for mark as sent
  const [sentSnackbarOpen, setSentSnackbarOpen] = React.useState(false);

  // Mark as paid mutation
  const [markAsPaid, { loading: markAsPaidLoading, data: markAsPaidData, error: markAsPaidError }] =
    useMarkInvoiceAsPaidMutation();

  // Snackbar for mark as paid
  const [paidSnackbarOpen, setPaidSnackbarOpen] = React.useState(false);

  // Delete mutation
  const [deleteInvoice, { loading: deleteLoading, data: deleteData, error: deleteError }] =
    useDeleteInvoiceMutation();

  // Snackbar for delete
  const [deleteSnackbarOpen, setDeleteSnackbarOpen] = React.useState(false);

  React.useEffect(() => {
    if (pdfData?.createPdfFromPageAndAttachToEntityId?.success) {
      setSnackbarOpen(true);
      setCacheKey((k) => k + 1); // Refresh files
    }
  }, [pdfData]);

  React.useEffect(() => {
    if (markAsSentData?.markInvoiceAsSent?.status === "SENT") {
      setSentSnackbarOpen(true);
      setSendDialogOpen(false);
      // Optionally, refetch invoice data here if needed
    }
  }, [markAsSentData]);

  React.useEffect(() => {
    if (markAsPaidData?.markInvoiceAsPaid?.status === "PAID") {
      setPaidSnackbarOpen(true);
      setPaidDialogOpen(false);
      // Optionally, refetch invoice data here if needed
    }
  }, [markAsPaidData]);

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  React.useEffect(() => {
    if (deleteData?.deleteInvoice) {
      setDeleteSnackbarOpen(true);
      setDeleteDialogOpen(false);
      // Redirect to invoice list after short delay so user sees snackbar
      setTimeout(() => {
        window.location.href = `/app/${workspaceId}/invoices`;
      }, 1000);
    }
  }, [deleteData]);

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
                    Amount:{" "}
                    {invoice.subTotalInCents != null
                      ? `$${(invoice.subTotalInCents / 100).toFixed(2)}`
                      : ""}
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
                    {invoice.status === "DRAFT" && (
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
                    )}
                    {invoice.status === "SENT" && (
                      <Button
                        variant="contained"
                        color="success"
                        sx={{
                          minWidth: 140,
                          whiteSpace: "nowrap",
                          flex: 1,
                          maxWidth: { xs: "100%", sm: "unset" },
                        }}
                        onClick={() => setPaidDialogOpen(true)}
                      >
                        Mark as paid
                      </Button>
                    )}
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
              {/* Invoice Lifecycle Stepper */}
              <Box sx={{ width: "100%", mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Invoice Progress
                </Typography>
                {(() => {
                  // Define the steps and their order
                  const steps = [
                    { label: "Draft", status: "DRAFT" },
                    { label: "Sent", status: "SENT" },
                    { label: "Paid", status: "PAID" },
                  ];
                  // Optionally add more steps if needed (e.g., PARTIAL, OVERDUE)
                  // Find the active step index
                  const statusIndex = steps.findIndex((s) => s.status === invoice.status);
                  const activeStep = statusIndex === -1 ? 0 : statusIndex;
                  return (
                    <Box sx={{ width: "100%" }}>
                      <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((step) => (
                          <Step key={step.status}>
                            <StepLabel>{step.label}</StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </Box>
                  );
                })()}
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
                    minHeight: "70vh",
                    p: 7,
                    bgcolor: "#f8f6f1",
                    border: "1px solid #ccc",
                    boxShadow: 3,
                    transform: "scale(0.85) translate(0, 0)",
                    transformOrigin: "top left",
                  }}
                >
                  <InvoiceRender key={cachekey} invoiceId={invoiceId} scale={1} />
                </Box>
              </Box>
              <Box mt={2} display="flex" gap={2}>
                {invoice.status === "DRAFT" && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setAddItemDialogOpen(true)}
                    >
                      Add Line Item
                    </Button>
                    <Button variant="outlined" onClick={() => setEditTaxesDialogOpen(true)}>
                      Edit Taxes
                    </Button>
                  </>
                )}
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<PrintOutlinedIcon />}
                  disabled={pdfLoading}
                  onClick={() => {
                    if (!invoice) return;
                    // Set default file name based on status and date
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, "0");
                    const dd = String(today.getDate()).padStart(2, "0");
                    let defaultName = "invoice";
                    if (invoice.status === "PAID") {
                      defaultName = "receipt";
                    }
                    setPrintFileName(`${defaultName}-${yyyy}-${mm}-${dd}`);
                    setPrintDialogOpen(true);
                  }}
                >
                  {pdfLoading ? "Generating PDF..." : "Print"}
                </Button>
              </Box>
              <EditInvoiceTaxesDialog
                open={editTaxesDialogOpen}
                onClose={() => {
                  setEditTaxesDialogOpen(false);
                  refetch();
                  setCacheKey((k) => k + 1);
                }}
                invoiceId={invoiceId}
                taxLineItems={invoice.taxLineItems ?? []}
              />
              {/* Print Dialog */}
              <Dialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)}>
                <DialogTitle>Print Invoice</DialogTitle>
                <DialogContent>
                  <Typography sx={{ mb: 2 }}>
                    Choose a name for the document to be generated.
                  </Typography>
                  <input
                    type="text"
                    value={printFileName}
                    onChange={(e) => setPrintFileName(e.target.value)}
                    style={{
                      width: "100%",
                      fontSize: 16,
                      padding: 8,
                      borderRadius: 4,
                      border: "1px solid #ccc",
                      marginBottom: 8,
                    }}
                    disabled={pdfLoading}
                  />
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => setPrintDialogOpen(false)}
                    color="inherit"
                    disabled={pdfLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!invoice?.id || !workspaceId || !invoiceId || !printFileName) return;
                      await createPdf({
                        variables: {
                          entity_id: invoice.id,
                          path: `print/invoice/${workspaceId}/${invoiceId}`,
                          file_name: printFileName,
                        },
                      });
                      setPrintDialogOpen(false);
                    }}
                    color="primary"
                    variant="contained"
                    disabled={!printFileName || pdfLoading}
                  >
                    {pdfLoading ? "Generating..." : "Print"}
                  </Button>
                </DialogActions>
              </Dialog>
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
            {/* Delete Invoice Card - Only show for DRAFT status */}
            {invoice.status === "DRAFT" && (
              <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Delete Invoice
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Delete this draft invoice to unallocate its line items.
                </Typography>
                <Button
                  variant="outlined"
                  sx={{ width: "100%" }}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete Draft Invoice
                </Button>
              </Paper>
            )}
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
          {markAsSentError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {markAsSentError.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!invoiceId || !sentDate) return;
              await markAsSent({
                variables: {
                  input: {
                    invoiceId,
                    date: sentDate.toISOString(),
                  },
                },
                // Optionally, refetchQueries: [{ query: InvoiceByIdQuery, variables: { id: invoiceId } }]
              });
            }}
            color="primary"
            variant="contained"
            disabled={!sentDate || markAsSentLoading}
          >
            {markAsSentLoading ? "Marking..." : "Mark as sent"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Mark as Paid Confirmation Dialog */}
      <Dialog open={paidDialogOpen} onClose={() => setPaidDialogOpen(false)}>
        <DialogTitle>Mark as paid</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Please select the date this invoice was paid.</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Paid date"
              value={paidDate}
              onChange={(value) => {
                if (value === null || value instanceof Date) {
                  setPaidDate(value);
                }
              }}
              slotProps={{ textField: { fullWidth: true, size: "small" } }}
              maxDate={new Date()}
            />
          </LocalizationProvider>
          {markAsPaidError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {markAsPaidError.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaidDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!invoiceId || !paidDate) return;
              await markAsPaid({
                variables: {
                  input: {
                    invoiceId,
                    date: paidDate.toISOString(),
                  },
                },
                // Optionally, refetchQueries: [{ query: InvoiceByIdQuery, variables: { id: invoiceId } }]
              });
            }}
            color="success"
            variant="contained"
            disabled={!paidDate || markAsPaidLoading}
          >
            {markAsPaidLoading ? "Marking..." : "Mark as paid"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Deleting this invoice will unallocate all associated charges and line items. These items
            will be available to add to other invoices.
          </Typography>
          <Typography sx={{ mb: 2 }}>This action cannot be undone.</Typography>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!invoiceId) return;
              await deleteInvoice({ variables: { id: invoiceId } });
            }}
            color="primary"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Add Invoice Line Item Dialog */}
      <AddInvoiceLineItemDialog
        open={addItemDialogOpen}
        onClose={() => {
          setAddItemDialogOpen(false);
          refetch();
          setCacheKey((d) => d + 1);
        }}
        invoiceId={invoiceId}
        buyerId={invoice?.buyer?.id || ""}
        buyerName={invoice?.buyer?.name || ""}
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
      {/* Snackbar for mark as sent */}
      <Snackbar
        open={sentSnackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSentSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSentSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
          variant="filled"
        >
          Invoice marked as sent!
        </Alert>
      </Snackbar>
      {/* Snackbar for mark as paid */}
      <Snackbar
        open={paidSnackbarOpen}
        autoHideDuration={4000}
        onClose={() => setPaidSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setPaidSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
          variant="filled"
        >
          Invoice marked as paid!
        </Alert>
      </Snackbar>
      {/* Snackbar for delete */}
      <Snackbar
        open={deleteSnackbarOpen}
        autoHideDuration={4000}
        onClose={() => setDeleteSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setDeleteSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
          variant="filled"
        >
          Invoice deleted!
        </Alert>
      </Snackbar>
    </Container>
  );
}
