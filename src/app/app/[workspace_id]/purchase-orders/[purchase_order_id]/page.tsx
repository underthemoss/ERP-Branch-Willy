"use client";

import { graphql } from "@/graphql";
import { PurchaseOrderStatus } from "@/graphql/graphql";
import {
  useCreatePdfFromPageAndAttachToEntityIdMutation,
  useGetPurchaseOrderByIdQuery,
  useSoftDeletePurchaseOrderMutation,
  useSubmitPurchaseOrderMutation,
} from "@/graphql/hooks";
import { parseDate } from "@/lib/parseDate";
import AttachedFilesSection from "@/ui/AttachedFilesSection";
import NotesSection from "@/ui/notes/NotesSection";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
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
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import EditPurchaseOrderDialog from "./EditPurchaseOrderDialog";
import OrderItemsSection from "./OrderItemsSection";
import PurchaseOrderCostForcastReport from "./PurchaseOrderCostForcastReport";

const CREATE_PDF_FROM_PAGE_AND_ATTACH_TO_ENTITY_ID = graphql(`
  mutation CreatePdfFromPageAndAttachToEntityId(
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

const PURCHASE_ORDER_DETAIL_QUERY = graphql(`
  query GetPurchaseOrderById($id: String) {
    getPurchaseOrderById(id: $id) {
      id
      purchase_order_number
      company_id
      created_at
      created_by
      updated_at
      updated_by
      seller_id
      project_id
      status
      fulfillmentProgress {
        fulfillmentPercentage
        isFullyFulfilled
        isPartiallyFulfilled
        onOrderItems
        receivedItems
        status
        totalItems
      }
      line_items {
        ... on RentalPurchaseOrderLineItem {
          id
        }
        ... on SalePurchaseOrderLineItem {
          id
        }
      }
      seller {
        ... on BusinessContact {
          id
          name
          address
          phone
          website
          taxId
          notes
          createdAt
          updatedAt
        }
        ... on PersonContact {
          id
          name
          email
          phone
          role
          notes
          createdAt
          updatedAt
        }
      }
      project {
        id
        name
        project_code
        description
        company {
          id
          name
        }
        created_at
        created_by
        updated_at
        updated_by
        deleted
        scope_of_work
        status
        project_contacts {
          contact_id
          relation_to_project
          contact {
            ... on BusinessContact {
              id
              name
              address
              phone
              website
              taxId
              notes
              createdAt
              updatedAt
            }
            ... on PersonContact {
              id
              name
              email
              phone
              role
              notes
              createdAt
              updatedAt
            }
          }
        }
      }
      created_by_user {
        id
        firstName
        lastName
        email
      }
      updated_by_user {
        id
        firstName
        lastName
        email
      }
    }
  }
`);

// Submit Purchase Order mutation
const SUBMIT_PURCHASE_ORDER_MUTATION = graphql(`
  mutation SubmitPurchaseOrder($id: ID!) {
    submitPurchaseOrder(id: $id) {
      id
      status
    }
  }
`);

// Soft Delete Purchase Order mutation
const SOFT_DELETE_PURCHASE_ORDER_MUTATION = graphql(`
  mutation SoftDeletePurchaseOrder($id: String) {
    softDeletePurchaseOrder(id: $id) {
      id
    }
  }
`);

export default function PurchaseOrderDetailPage() {
  const { purchase_order_id, workspace_id } = useParams<{
    purchase_order_id: string;
    workspace_id: string;
  }>();
  const router = useRouter();

  const [cachekey, setCacheKey] = React.useState(0);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const { data, loading, error } = useGetPurchaseOrderByIdQuery({
    variables: { id: purchase_order_id },
    fetchPolicy: "cache-and-network",
  });

  const [createPdf, { loading: pdfLoading, data: pdfData, error: pdfError }] =
    useCreatePdfFromPageAndAttachToEntityIdMutation();

  // Submit Purchase Order mutation
  const [submitPurchaseOrder, { loading: submitLoading, data: submitData, error: submitError }] =
    useSubmitPurchaseOrderMutation();

  // Soft Delete Purchase Order mutation
  const [softDeletePurchaseOrder, { loading: deleteLoading }] =
    useSoftDeletePurchaseOrderMutation();

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<"success" | "error">("success");

  React.useEffect(() => {
    if (submitData?.submitPurchaseOrder?.id) {
      setSnackbarMessage("Purchase order submitted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    }
  }, [submitData]);

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const purchaseOrder = data?.getPurchaseOrderById;
  const hasLineItems = (purchaseOrder?.line_items?.length ?? 0) > 0;

  const handleDelete = async () => {
    try {
      await softDeletePurchaseOrder({
        variables: { id: purchase_order_id },
      });
      setSnackbarMessage("Purchase order deleted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
      // Redirect to purchase orders list after successful deletion
      setTimeout(() => {
        router.push(`/app/${workspace_id}/purchase-orders`);
      }, 1500);
    } catch (error) {
      setSnackbarMessage("Failed to delete purchase order");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Helper to format dates (handles ISO strings, Unix timestamps, etc.)
  function formatDate(value?: string | number | null) {
    if (!value) return "";
    const date = parseDate(value);
    if (!date) return String(value); // Fallback to original value if parsing fails
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
          Loading purchase order details...
        </Typography>
      )}
      {error && (
        <Typography variant="body1" color="error">
          Error loading purchase order: {error.message}
        </Typography>
      )}
      {purchaseOrder && (
        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Top Card: Purchase Order Overview */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h4">Purchase Order</Typography>
                    <Box>
                      <Chip
                        label={purchaseOrder.status}
                        color={
                          purchaseOrder.status === "SUBMITTED"
                            ? "primary"
                            : purchaseOrder.status === "DRAFT"
                              ? "default"
                              : "default"
                        }
                      />
                    </Box>
                  </Box>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    # {purchaseOrder.purchase_order_number}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { md: "right", xs: "left" } }}>
                  <Box
                    display="flex"
                    flexDirection="column"
                    gap={1}
                    alignItems={{ md: "flex-end", xs: "flex-start" }}
                  >
                    {purchaseOrder.status === "SUBMITTED" ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          router.push(
                            `/app/${workspace_id}/inventory/receive/${purchase_order_id}`,
                          );
                        }}
                        sx={{ mb: 1 }}
                      >
                        Receive Inventory
                      </Button>
                    ) : (
                      <Tooltip
                        title={
                          !hasLineItems
                            ? "Cannot submit an empty purchase order. Please add at least one line item."
                            : ""
                        }
                        arrow
                      >
                        <span>
                          <Button
                            variant="contained"
                            color="primary"
                            disabled={submitLoading || !hasLineItems}
                            loading={submitLoading}
                            onClick={async () => {
                              if (!purchaseOrder?.id) return;
                              await submitPurchaseOrder({
                                variables: { id: purchaseOrder.id },
                                refetchQueries: ["GetPurchaseOrderById"],
                                awaitRefetchQueries: true,
                              });
                            }}
                            sx={{ mb: 1 }}
                          >
                            Submit
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                    <Box display="flex" alignItems="center" gap={1}>
                      <Button
                        color="secondary"
                        startIcon={<PrintOutlinedIcon />}
                        disabled={pdfLoading}
                        onClick={async () => {
                          if (!purchaseOrder?.id || !workspace_id || !purchase_order_id) return;
                          // Format file name as purchase-order-YYYY-MM-DD
                          const today = new Date();
                          const yyyy = today.getFullYear();
                          const mm = String(today.getMonth() + 1).padStart(2, "0");
                          const dd = String(today.getDate()).padStart(2, "0");
                          const fileName = `purchase-order-${yyyy}-${mm}-${dd}`;
                          await createPdf({
                            variables: {
                              entity_id: purchaseOrder.id,
                              path: `print/purchase-order/${workspace_id}/${purchase_order_id}`,
                              file_name: fileName,
                            },
                          });
                          setCacheKey((k) => k + 1);
                        }}
                      >
                        {pdfLoading ? "Generating PDF..." : "Print"}
                      </Button>
                      {purchaseOrder.status !== "SUBMITTED" && (
                        <>
                          <Button
                            color="secondary"
                            startIcon={<EditOutlinedIcon />}
                            onClick={() => setEditDialogOpen(true)}
                          >
                            Edit
                          </Button>
                          {purchaseOrder.status === "DRAFT" && (
                            <Button
                              color="error"
                              startIcon={<DeleteOutlineIcon />}
                              onClick={() => setDeleteDialogOpen(true)}
                              disabled={deleteLoading}
                            >
                              Delete
                            </Button>
                          )}
                        </>
                      )}
                    </Box>
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
              {/* Fulfillment Progress Bar - Only show when order is submitted */}
              {purchaseOrder.status === PurchaseOrderStatus.Submitted && (
                <Box sx={{ width: "100%", mb: 2 }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Inventory Fulfillment Status
                  </Typography>
                  {purchaseOrder.fulfillmentProgress ? (
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <Box sx={{ width: "100%", mr: 2 }}>
                          <Box sx={{ position: "relative" }}>
                            <LinearProgress
                              variant="determinate"
                              value={purchaseOrder.fulfillmentProgress.fulfillmentPercentage || 0}
                              color={
                                purchaseOrder.fulfillmentProgress.isFullyFulfilled
                                  ? "success"
                                  : purchaseOrder.fulfillmentProgress.fulfillmentPercentage > 0
                                    ? "primary"
                                    : "inherit"
                              }
                              sx={{
                                height: 28,
                                borderRadius: 1,
                                backgroundColor: (theme) =>
                                  theme.palette.mode === "light"
                                    ? theme.palette.grey[200]
                                    : theme.palette.grey[800],
                              }}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color:
                                    purchaseOrder.fulfillmentProgress.fulfillmentPercentage > 50
                                      ? "white"
                                      : "text.primary",
                                  fontWeight: 600,
                                }}
                              >
                                {purchaseOrder.fulfillmentProgress.fulfillmentPercentage.toFixed(1)}
                                %
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        {purchaseOrder.fulfillmentProgress.isFullyFulfilled && (
                          <CheckCircleOutlinedIcon color="success" />
                        )}
                      </Box>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" color="text.secondary">
                            Items Received
                          </Typography>
                          <Typography variant="h6">
                            {purchaseOrder.fulfillmentProgress.receivedItems || 0}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" color="text.secondary">
                            Total Items
                          </Typography>
                          <Typography variant="h6">
                            {purchaseOrder.fulfillmentProgress.totalItems || 0}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" color="text.secondary">
                            Status
                          </Typography>
                          <Typography variant="h6">
                            {purchaseOrder.fulfillmentProgress.isFullyFulfilled
                              ? "Fulfilled"
                              : purchaseOrder.fulfillmentProgress.isPartiallyFulfilled
                                ? "Partially Fulfilled"
                                : "On Order"}
                          </Typography>
                        </Grid>
                      </Grid>
                      {purchaseOrder.fulfillmentProgress.totalItems === 0 && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          No items have been added to this purchase order yet.
                        </Alert>
                      )}
                      {purchaseOrder.fulfillmentProgress.isPartiallyFulfilled &&
                        !purchaseOrder.fulfillmentProgress.isFullyFulfilled && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            This purchase order has been partially fulfilled.{" "}
                            {purchaseOrder.fulfillmentProgress.receivedItems} out of{" "}
                            {purchaseOrder.fulfillmentProgress.totalItems} items have been received.
                          </Alert>
                        )}
                      {purchaseOrder.fulfillmentProgress.isFullyFulfilled && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                          All items in this purchase order have been received successfully!
                        </Alert>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No fulfillment information available
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>

            {/* Order Items Section */}
            <OrderItemsSection
              purchaseOrderId={purchaseOrder.id}
              purchaseOrderStatus={purchaseOrder.status}
            />

            {/* Cost Forecast Section */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Cost Forecast
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <PurchaseOrderCostForcastReport purchaseOrderId={purchaseOrder.id} />
            </Paper>

            {/* File Upload Card */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Attached Files
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <AttachedFilesSection key={`files-${cachekey}`} entityId={purchaseOrder.id} />
            </Paper>

            {/* Notes Section */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <NotesSection entityId={purchaseOrder.id} />
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
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    ID
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ mr: 0.5 }}>
                    {purchaseOrder.id}
                  </Typography>
                  <Tooltip title="Copy Purchase Order ID" arrow>
                    <IconButton
                      size="small"
                      aria-label="Copy Purchase Order ID"
                      data-testid="purchase-order-details-copy-id"
                      onClick={() => navigator.clipboard.writeText(purchaseOrder.id)}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    #
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ mr: 0.5 }}>
                    {purchaseOrder.purchase_order_number}
                  </Typography>
                  <Tooltip title="Copy Purchase Order #" arrow>
                    <IconButton
                      size="small"
                      aria-label="Copy Purchase Order #"
                      data-testid="purchase-order-details-copy-id"
                      onClick={() =>
                        navigator.clipboard.writeText(purchaseOrder.purchase_order_number)
                      }
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatDate(purchaseOrder.created_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Updated At
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatDate(purchaseOrder.updated_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ wordBreak: "break-all" }}>
                    {purchaseOrder.created_by_user
                      ? `${purchaseOrder.created_by_user.firstName} ${purchaseOrder.created_by_user.lastName} (${purchaseOrder.created_by_user.email})`
                      : purchaseOrder.created_by}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Updated By
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ wordBreak: "break-all" }}>
                    {purchaseOrder.updated_by_user
                      ? `${purchaseOrder.updated_by_user.firstName} ${purchaseOrder.updated_by_user.lastName} (${purchaseOrder.updated_by_user.email})`
                      : purchaseOrder.updated_by}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Seller Information Card */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                width: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Seller Information
                </Typography>
                <Divider sx={{ mb: 1 }} />
                {purchaseOrder.seller ? (
                  <Box>
                    <Typography>
                      Name: <b>{purchaseOrder.seller.name}</b>
                    </Typography>
                    {"email" in purchaseOrder.seller && purchaseOrder.seller.email && (
                      <Typography>Email: {purchaseOrder.seller.email}</Typography>
                    )}
                    {"phone" in purchaseOrder.seller && purchaseOrder.seller.phone && (
                      <Typography>Phone: {purchaseOrder.seller.phone}</Typography>
                    )}
                    {"address" in purchaseOrder.seller && purchaseOrder.seller.address && (
                      <Typography>
                        Address:{" "}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            purchaseOrder.seller.address,
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "inherit",
                            textDecoration: "underline",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {purchaseOrder.seller.address}
                          <OpenInNewIcon sx={{ fontSize: 16 }} />
                        </a>
                      </Typography>
                    )}
                    {"website" in purchaseOrder.seller && purchaseOrder.seller.website && (
                      <Typography>
                        Website:{" "}
                        {(() => {
                          const website = purchaseOrder.seller.website;
                          // Validate URL format
                          let url = website;
                          if (!website.match(/^https?:\/\//i)) {
                            url = `https://${website}`;
                          }
                          try {
                            // Validate URL
                            new URL(url);
                            return (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "inherit",
                                  textDecoration: "underline",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {website}
                                <OpenInNewIcon sx={{ fontSize: 16 }} />
                              </a>
                            );
                          } catch {
                            // Invalid URL, just display as text
                            return website;
                          }
                        })()}
                      </Typography>
                    )}
                    {"taxId" in purchaseOrder.seller && purchaseOrder.seller.taxId && (
                      <Typography>Tax ID: {purchaseOrder.seller.taxId}</Typography>
                    )}
                    {purchaseOrder.seller.notes && (
                      <Typography>Notes: {purchaseOrder.seller.notes}</Typography>
                    )}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No seller information</Typography>
                )}
              </Box>
              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!purchaseOrder.seller_id}
                  onClick={() => {
                    if (purchaseOrder.seller_id) {
                      router.push(`/app/${workspace_id}/contacts/${purchaseOrder.seller_id}`);
                    }
                  }}
                >
                  View Seller
                </Button>
              </Box>
            </Paper>

            {/* Project Information Card */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mb: 3,
                width: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Project Information
                </Typography>
                <Divider sx={{ mb: 1 }} />
                {purchaseOrder.project ? (
                  <Box>
                    <Typography>
                      Name: <b>{purchaseOrder.project.name}</b>
                    </Typography>
                    <Typography>Code: {purchaseOrder.project.project_code}</Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>
                      Description: {purchaseOrder.project.description}
                    </Typography>
                    <Typography>Company: {purchaseOrder.project.company?.name}</Typography>
                    <Typography>Status: {purchaseOrder.project.status}</Typography>
                    <Typography>
                      Scope of Work: {purchaseOrder.project.scope_of_work?.join(", ")}
                    </Typography>
                    <Typography>Contacts:</Typography>
                    <Box sx={{ pl: 2 }}>
                      {(purchaseOrder.project.project_contacts ?? []).length ? (
                        (purchaseOrder.project.project_contacts ?? []).map((pc: any) => (
                          <Box key={pc.contact_id} sx={{ mb: 1 }}>
                            <Typography>
                              {pc.relation_to_project}: {pc.contact?.name}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography color="text.secondary">No contacts</Typography>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Typography color="text.secondary">No project information</Typography>
                )}
              </Box>
              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!purchaseOrder.project_id}
                  onClick={() => {
                    if (purchaseOrder.project_id) {
                      router.push(`/app/${workspace_id}/projects/${purchaseOrder.project_id}`);
                    }
                  }}
                >
                  View Project
                </Button>
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
                Need help with this order?
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
                View All Orders (stub)
              </Button>
              <Button variant="outlined" size="small" sx={{ width: "100%" }} disabled>
                Upgrade Plan (stub)
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Purchase Order</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this purchase order? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Purchase Order Dialog */}
      {purchaseOrder && (
        <EditPurchaseOrderDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          purchaseOrder={{
            id: purchaseOrder.id,
            seller_id: purchaseOrder.seller_id,
            purchase_order_number: purchaseOrder.purchase_order_number,
            project_id: purchaseOrder.project_id,
          }}
          onSuccess={() => {
            // Optionally refresh the data or show a success message
            setSnackbarOpen(true);
          }}
        />
      )}
    </Container>
  );
}
