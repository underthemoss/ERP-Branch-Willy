"use client";

import { graphql } from "@/graphql";
import { SalesOrderStatus } from "@/graphql/graphql";
import {
  ResourceTypes,
  useCreatePdfFromPageAndAttachToSalesOrderMutation,
  useGetSalesOrderByIdQuery,
  useSoftDeleteSalesOrderMutation,
  useSubmitSalesOrderSalesOrderPageMutation,
} from "@/graphql/hooks";
import { parseDate } from "@/lib/parseDate";
import AttachedFilesSection from "@/ui/AttachedFilesSection";
import NotesSection from "@/ui/notes/NotesSection";
import SalesOrderDeliveryMap from "@/ui/sales-orders/SalesOrderDeliveryMap";
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
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import EditPurchaseOrderNumberDialog from "./EditPurchaseOrderNumberDialog";
import EditSalesOrderDialog from "./EditSalesOrderDialog";
import OrderItemsSection from "./OrderItemsSection";
import SalesOrderCostForcastReport from "./SalesOrderCostForcastReport";

const CREATE_PDF_FROM_PAGE_AND_ATTACH_TO_ENTITY_ID = graphql(`
  mutation CreatePdfFromPageAndAttachToSalesOrder(
    $entity_id: String!
    $path: String!
    $file_name: String!
    $workspaceId: String!
  ) {
    createPdfFromPageAndAttachToEntityId(
      entity_id: $entity_id
      path: $path
      file_name: $file_name
      workspaceId: $workspaceId
    ) {
      success
      error_message
    }
  }
`);

const SALES_ORDER_DETAIL_QUERY = graphql(`
  query GetSalesOrderById($id: String) {
    getSalesOrderById(id: $id) {
      id
      sales_order_number
      purchase_order_number
      company_id
      created_at
      created_by
      updated_at
      updated_by
      buyer_id
      project_id
      status
      line_items {
        ... on RentalSalesOrderLineItem {
          id
          delivery_location
          delivery_method
          delivery_date
          so_pim_category {
            name
          }
        }
        ... on SaleSalesOrderLineItem {
          id
          delivery_location
          delivery_method
          delivery_date
          so_pim_category {
            name
          }
        }
      }
      buyer {
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
        workspaceId
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

// Submit Sales Order mutation
const SUBMIT_SALES_ORDER_MUTATION = graphql(`
  mutation SubmitSalesOrderSalesOrderPage($id: ID!) {
    submitSalesOrder(id: $id) {
      id
      status
    }
  }
`);

// Soft Delete Sales Order mutation
const SOFT_DELETE_SALES_ORDER_MUTATION = graphql(`
  mutation SoftDeleteSalesOrder($id: String) {
    softDeleteSalesOrder(id: $id) {
      id
    }
  }
`);

export default function SalesOrderDetailPage() {
  const { sales_order_id, workspace_id } = useParams<{
    sales_order_id: string;
    workspace_id: string;
  }>();
  const router = useRouter();

  const [cachekey, setCacheKey] = React.useState(0);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editPoNumberDialogOpen, setEditPoNumberDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const { data, loading, error } = useGetSalesOrderByIdQuery({
    variables: { id: sales_order_id },
    fetchPolicy: "cache-and-network",
  });

  const [createPdf, { loading: pdfLoading, data: pdfData, error: pdfError }] =
    useCreatePdfFromPageAndAttachToSalesOrderMutation();

  // Submit Sales Order mutation
  const [submitSalesOrder, { loading: submitLoading, data: submitData, error: submitError }] =
    useSubmitSalesOrderSalesOrderPageMutation();

  // Soft Delete Sales Order mutation
  const [softDeleteSalesOrder, { loading: deleteLoading }] = useSoftDeleteSalesOrderMutation();

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<"success" | "error">("success");

  React.useEffect(() => {
    if (submitData?.submitSalesOrder?.id) {
      setSnackbarMessage("Sales order submitted successfully!");
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

  const salesOrder = data?.getSalesOrderById;
  const hasLineItems = (salesOrder?.line_items?.length ?? 0) > 0;

  const handleDelete = async () => {
    try {
      await softDeleteSalesOrder({
        variables: { id: sales_order_id },
      });
      setSnackbarMessage("Sales order deleted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
      // Redirect to sales orders list after successful deletion
      setTimeout(() => {
        router.push(`/app/${workspace_id}/sales-orders`);
      }, 1500);
    } catch (error) {
      setSnackbarMessage("Failed to delete sales order");
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

  // (Order items section is now modularized)

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      {loading && (
        <Typography variant="body1" color="text.secondary">
          Loading sales order details...
        </Typography>
      )}
      {error && (
        <Typography variant="body1" color="error">
          Error loading sales order: {error.message}
        </Typography>
      )}
      {salesOrder && (
        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Top Card: Sales Order Overview */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h4">Sales Order</Typography>
                    <Chip
                      label={salesOrder.status}
                      color={
                        salesOrder.status === "SUBMITTED"
                          ? "primary"
                          : salesOrder.status === "DRAFT"
                            ? "default"
                            : "default"
                      }
                    />
                  </Box>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    # {salesOrder.sales_order_number}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { md: "right", xs: "left" } }}>
                  <Box
                    display="flex"
                    flexDirection="column"
                    gap={1}
                    alignItems={{ md: "flex-end", xs: "flex-start" }}
                  >
                    {salesOrder.status !== "SUBMITTED" && (
                      <Tooltip
                        title={
                          !hasLineItems
                            ? "Cannot submit an empty sales order. Please add at least one line item."
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
                              if (!salesOrder?.id) return;
                              await submitSalesOrder({
                                variables: { id: salesOrder.id },
                                refetchQueries: ["GetSalesOrderById"],
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
                          if (!salesOrder?.id || !workspace_id || !sales_order_id) return;
                          // Format file name as sales-order-YYYY-MM-DD
                          const today = new Date();
                          const yyyy = today.getFullYear();
                          const mm = String(today.getMonth() + 1).padStart(2, "0");
                          const dd = String(today.getDate()).padStart(2, "0");
                          const fileName = `sales-order-${yyyy}-${mm}-${dd}`;
                          await createPdf({
                            variables: {
                              entity_id: salesOrder.id,
                              path: `print/sales-order/${workspace_id}/${sales_order_id}`,
                              file_name: fileName,
                              workspaceId: workspace_id,
                            },
                          });
                          setCacheKey((k) => k + 1);
                        }}
                      >
                        {pdfLoading ? "Generating PDF..." : "Print"}
                      </Button>
                      {salesOrder.status !== "SUBMITTED" && (
                        <>
                          <Button
                            color="secondary"
                            startIcon={<EditOutlinedIcon />}
                            onClick={() => setEditDialogOpen(true)}
                          >
                            Edit
                          </Button>
                          {salesOrder.status === "DRAFT" && (
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
              {/* Stubbed Progress Bar */}
              <Box sx={{ width: "100%", mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Order Progress
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: "80%", mr: 1 }}>
                    {/* Replace with real progress if available */}
                    <Box sx={{ bgcolor: "#e0e0e0", borderRadius: 1, height: 10 }}>
                      <Box
                        sx={{ width: "40%", bgcolor: "primary.main", height: 10, borderRadius: 1 }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    2 of 5 steps
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Buyer & Project Info moved to sidebar */}

            {/* Order Items Section */}
            <OrderItemsSection salesOrderId={salesOrder.id} salesOrderStatus={salesOrder.status} />
            {/* File Upload Card */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Attached Files
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <AttachedFilesSection
                key={`files-${cachekey}`}
                entityId={salesOrder.id}
                entityType={ResourceTypes.ErpSalesOrder}
              />
            </Paper>
            {/* Price Forecast Section */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Price Forecast
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <SalesOrderCostForcastReport salesOrderId={salesOrder.id} />
            </Paper>
            {/* Notes Section */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <NotesSection entityId={salesOrder.id} workspaceId={workspace_id} />
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
              <Stack spacing={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    ID:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ mr: 0.5 }}>
                    {salesOrder.id}
                  </Typography>
                  <Tooltip title="Copy Sales Order ID" arrow>
                    <IconButton
                      size="small"
                      aria-label="Copy Sales Order ID"
                      data-testid="sales-order-details-copy-id"
                      onClick={() => navigator.clipboard.writeText(salesOrder.id)}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    Sales Order #:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ mr: 0.5 }}>
                    {salesOrder.sales_order_number}
                  </Typography>
                  <Tooltip title="Copy Sales Order ID" arrow>
                    <IconButton
                      size="small"
                      aria-label="Copy Sales Order Number"
                      data-testid="sales-order-details-copy-number"
                      onClick={() => navigator.clipboard.writeText(salesOrder.sales_order_number)}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    Purchase Order #:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ mr: 0.5 }}>
                    {salesOrder.purchase_order_number || "(not set)"}
                  </Typography>
                  <Tooltip title="Edit Purchase Order Number" arrow>
                    <IconButton
                      size="small"
                      aria-label="Edit Purchase Order Number"
                      onClick={() => setEditPoNumberDialogOpen(true)}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {salesOrder.purchase_order_number && (
                    <Tooltip title="Copy Purchase Order Number" arrow>
                      <IconButton
                        size="small"
                        aria-label="Copy Purchase Order Number"
                        data-testid="sales-order-details-copy-po-number"
                        onClick={() =>
                          navigator.clipboard.writeText(salesOrder.purchase_order_number || "")
                        }
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatDate(salesOrder.created_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Updated At
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatDate(salesOrder.updated_at)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ wordBreak: "break-all" }}>
                    {salesOrder.created_by_user
                      ? `${salesOrder.created_by_user.firstName} ${salesOrder.created_by_user.lastName} (${salesOrder.created_by_user.email})`
                      : salesOrder.created_by}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Updated By
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{ wordBreak: "break-all" }}>
                    {salesOrder.updated_by_user
                      ? `${salesOrder.updated_by_user.firstName} ${salesOrder.updated_by_user.lastName} (${salesOrder.updated_by_user.email})`
                      : salesOrder.updated_by}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
            {/* Buyer Information Card */}
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
                  Buyer Information
                </Typography>
                <Divider sx={{ mb: 1 }} />
                {salesOrder.buyer ? (
                  <Box>
                    <Typography>
                      Name: <b>{salesOrder.buyer.name}</b>
                    </Typography>
                    {"email" in salesOrder.buyer && salesOrder.buyer.email && (
                      <Typography>Email: {salesOrder.buyer.email}</Typography>
                    )}
                    {"phone" in salesOrder.buyer && salesOrder.buyer.phone && (
                      <Typography>Phone: {salesOrder.buyer.phone}</Typography>
                    )}
                    {"address" in salesOrder.buyer && salesOrder.buyer.address && (
                      <Typography>
                        Address:{" "}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            salesOrder.buyer.address,
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
                          {salesOrder.buyer.address}
                          <OpenInNewIcon sx={{ fontSize: 16 }} />
                        </a>
                      </Typography>
                    )}
                    {"website" in salesOrder.buyer && salesOrder.buyer.website && (
                      <Typography>
                        Website:{" "}
                        {(() => {
                          const website = salesOrder.buyer.website;
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
                    {"taxId" in salesOrder.buyer && salesOrder.buyer.taxId && (
                      <Typography>Tax ID: {salesOrder.buyer.taxId}</Typography>
                    )}
                    {salesOrder.buyer.notes && (
                      <Typography>Notes: {salesOrder.buyer.notes}</Typography>
                    )}
                  </Box>
                ) : (
                  <Typography color="text.secondary">No buyer information</Typography>
                )}
              </Box>
              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!salesOrder.buyer_id}
                  onClick={() => {
                    if (salesOrder.buyer_id) {
                      router.push(`/app/${workspace_id}/contacts/${salesOrder.buyer_id}`);
                    }
                  }}
                >
                  View Buyer
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
                {salesOrder.project ? (
                  <Box sx={{ maxHeight: 220, overflowY: "auto", pr: 1 }}>
                    <Typography>
                      Name: <b>{salesOrder.project.name}</b>
                    </Typography>
                    <Typography>Code: {salesOrder.project.project_code}</Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>
                      Description: {salesOrder.project.description}
                    </Typography>
                    <Typography>Status: {salesOrder.project.status}</Typography>
                    <Typography>
                      Scope of Work: {salesOrder.project.scope_of_work?.join(", ")}
                    </Typography>
                    <Typography>Contacts:</Typography>
                    <Box sx={{ pl: 2 }}>
                      {(salesOrder.project.project_contacts ?? []).length ? (
                        (salesOrder.project.project_contacts ?? []).map((pc: any) => (
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
                  disabled={!salesOrder.project_id}
                  onClick={() => {
                    if (salesOrder.project_id) {
                      router.push(`/app/${workspace_id}/projects/${salesOrder.project_id}`);
                    }
                  }}
                >
                  View Project
                </Button>
              </Box>
            </Paper>

            {/* Delivery Locations Map */}
            {salesOrder.line_items &&
              salesOrder.line_items.length > 0 &&
              (() => {
                const deliveryLocations = salesOrder.line_items
                  .filter((item: any) => item.delivery_location)
                  .map((item: any, index: number) => ({
                    id: item.id || `item-${index}`,
                    address: item.delivery_location,
                    itemDescription: item.so_pim_category?.name || "Item",
                    deliveryMethod: item.delivery_method,
                    deliveryDate: item.delivery_date,
                  }));

                return deliveryLocations.length > 0 ? (
                  <Box sx={{ mb: 3 }}>
                    <SalesOrderDeliveryMap deliveryLocations={deliveryLocations} />
                  </Box>
                ) : null;
              })()}

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
          {snackbarMessage || "Sales order updated"}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Sales Order</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this sales order? This action cannot be undone.
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

      {/* Edit Purchase Order Number Dialog */}
      {salesOrder && (
        <EditPurchaseOrderNumberDialog
          open={editPoNumberDialogOpen}
          onClose={() => setEditPoNumberDialogOpen(false)}
          salesOrderId={salesOrder.id}
          currentPurchaseOrderNumber={salesOrder.purchase_order_number || ""}
          onSuccess={() => {
            setSnackbarMessage("Purchase order number updated successfully!");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
          }}
        />
      )}

      {/* Edit Sales Order Dialog */}
      {salesOrder && (
        <EditSalesOrderDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          salesOrder={{
            id: salesOrder.id,
            buyer_id: salesOrder.buyer_id,
            purchase_order_number: salesOrder.purchase_order_number || "",
            sales_order_number: salesOrder.sales_order_number,
            project_id: salesOrder.project_id,
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
