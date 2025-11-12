"use client";

import { graphql } from "@/graphql";
import { QuoteStatus } from "@/graphql/graphql";
import {
  useGetQuoteByIdQuery,
  useGetRfqByIdQuery,
  useUpdateQuoteStatusMutation,
} from "@/graphql/hooks";
import { useSelectedWorkspace } from "@/providers/WorkspaceProvider";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HistoryIcon from "@mui/icons-material/History";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
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
import { AcceptQuoteDialog } from "./components/AcceptQuoteDialog";
import { CancelQuoteDialog } from "./components/CancelQuoteDialog";
import { EditLineItemsDialog } from "./components/EditLineItemsDialog";
import { EditQuoteDialog } from "./components/EditQuoteDialog";
import { LineItemsSection } from "./components/LineItemsSection";
import { PrintQuoteDialog } from "./components/PrintQuoteDialog";
import { RejectQuoteDialog } from "./components/RejectQuoteDialog";
import { RevisionHistoryDialog } from "./components/RevisionHistoryDialog";
import { SendQuoteDialog } from "./components/SendQuoteDialog";

// GraphQL Queries and Mutations
const GET_QUOTE_BY_ID = graphql(`
  query GetQuoteById($id: String!) {
    quoteById(id: $id) {
      id
      status
      sellerWorkspaceId
      sellersBuyerContactId
      sellersBuyerContact {
        ... on PersonContact {
          id
          contactType
          name
          email
          phone
        }
        ... on BusinessContact {
          id
          contactType
          name
          phone
        }
      }
      sellersProjectId
      sellersProject {
        id
        name
        project_code
        description
      }
      buyerWorkspaceId
      buyersSellerContactId
      buyersSellerContact {
        ... on PersonContact {
          id
          contactType
          name
          email
          phone
        }
        ... on BusinessContact {
          id
          contactType
          name
          phone
        }
      }
      buyersProjectId
      buyersProject {
        id
        name
        project_code
        description
      }
      currentRevisionId
      currentRevision {
        id
        revisionNumber
        validUntil
        createdAt
        createdBy
        createdByUser {
          id
          firstName
          lastName
          email
        }
        updatedAt
        updatedBy
        updatedByUser {
          id
          firstName
          lastName
          email
        }
        lineItems {
          ... on QuoteRevisionRentalLineItem {
            id
            type
            description
            quantity
            pimCategoryId
            pimCategory {
              name
            }
            sellersPriceId
            price {
              ... on RentalPrice {
                id
                name
                priceType
                pricePerDayInCents
                pricePerWeekInCents
                pricePerMonthInCents
              }
            }
            rentalStartDate
            rentalEndDate
            subtotalInCents
          }
          ... on QuoteRevisionSaleLineItem {
            id
            type
            description
            quantity
            pimCategoryId
            pimCategory {
              name
            }
            sellersPriceId
            price {
              ... on SalePrice {
                id
                name
                priceType
                unitCostInCents
              }
            }
            subtotalInCents
          }
          ... on QuoteRevisionServiceLineItem {
            id
            type
            description
            quantity
            sellersPriceId
            price {
              ... on RentalPrice {
                id
                name
                priceType
              }
              ... on SalePrice {
                id
                name
                priceType
              }
            }
            subtotalInCents
          }
        }
      }
      rfqId
      validUntil
      createdAt
      createdBy
      createdByUser {
        id
        firstName
        lastName
        email
      }
      updatedAt
      updatedBy
      updatedByUser {
        id
        firstName
        lastName
        email
      }
    }
  }
`);

const GET_RFQ_BY_ID = graphql(`
  query GetRfqById($id: String!) {
    rfqById(id: $id) {
      id
      status
      buyersWorkspaceId
      invitedSellerContactIds
      invitedSellerContacts {
        ... on PersonContact {
          id
          contactType
          name
          email
        }
        ... on BusinessContact {
          id
          contactType
          name
        }
      }
      responseDeadline
      createdAt
      createdBy
      lineItems {
        ... on RFQRentalLineItem {
          id
          type
          description
          quantity
          pimCategoryId
          rentalStartDate
          rentalEndDate
        }
        ... on RFQSaleLineItem {
          id
          type
          description
          quantity
          pimCategoryId
        }
        ... on RFQServiceLineItem {
          id
          type
          description
          quantity
        }
      }
    }
  }
`);

const UPDATE_QUOTE_STATUS = graphql(`
  mutation UpdateQuoteStatus($input: UpdateQuoteStatusInput!) {
    updateQuoteStatus(input: $input) {
      id
      status
      updatedAt
    }
  }
`);

const CREATE_QUOTE_REVISION = graphql(`
  mutation CreateQuoteRevisionForDetail($input: CreateQuoteRevisionInput!) {
    createQuoteRevision(input: $input) {
      id
      quoteId
      revisionNumber
      validUntil
      createdAt
    }
  }
`);

const CREATE_PDF_FROM_PAGE = graphql(`
  mutation CreatePdfFromPageAndAttachToQuote(
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

// Helper functions
function formatPrice(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
}

function getStatusColor(
  status: QuoteStatus,
): "default" | "primary" | "success" | "error" | "warning" {
  switch (status) {
    case QuoteStatus.Active:
      return "primary";
    case QuoteStatus.Accepted:
      return "success";
    case QuoteStatus.Rejected:
      return "error";
    case QuoteStatus.Cancelled:
      return "error";
    case QuoteStatus.Expired:
      return "warning";
    default:
      return "default";
  }
}

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params?.quote_id as string;
  const workspaceId = params?.workspace_id as string;
  const currentWorkspace = useSelectedWorkspace();

  // GraphQL hooks
  const { data, loading, error, refetch } = useGetQuoteByIdQuery({
    variables: { id: quoteId },
    fetchPolicy: "cache-and-network",
    skip: !quoteId,
  });

  const quote = data?.quoteById;

  // Fetch RFQ if quote has rfqId
  const {
    data: rfqData,
    loading: rfqLoading,
    error: rfqError,
  } = useGetRfqByIdQuery({
    variables: { id: quote?.rfqId || "" },
    fetchPolicy: "cache-and-network",
    skip: !quote?.rfqId,
  });

  const [updateQuoteStatus] = useUpdateQuoteStatusMutation();

  // UI State
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [showRfqDetails, setShowRfqDetails] = React.useState(false);

  // Dialog states
  const [sendDialogOpen, setSendDialogOpen] = React.useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [printDialogOpen, setPrintDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editLineItemsDialogOpen, setEditLineItemsDialogOpen] = React.useState(false);
  const [revisionHistoryDialogOpen, setRevisionHistoryDialogOpen] = React.useState(false);

  // Determine if current user is buyer or seller
  const isSeller = currentWorkspace?.id === quote?.sellerWorkspaceId;
  const isBuyer = currentWorkspace?.id === quote?.buyerWorkspaceId;

  // Calculate totals
  const totalAmount = React.useMemo(() => {
    if (!quote?.currentRevision?.lineItems) return 0;
    return quote.currentRevision.lineItems.reduce((sum, item) => {
      return sum + (item.subtotalInCents || 0);
    }, 0);
  }, [quote?.currentRevision?.lineItems]);

  // Copy to clipboard handler
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: `${label} copied to clipboard`,
      severity: "success",
    });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !quote) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          {error ? `Error loading quote: ${error.message}` : "Quote not found"}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Quote {quote.id}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={quote.status} color={getStatusColor(quote.status)} size="small" />
              <Typography variant="body2" color="text.secondary">
                {isSeller ? "Seller View" : isBuyer ? "Buyer View" : "View"}
              </Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            {isSeller && quote.status === QuoteStatus.Active && !quote.currentRevisionId && (
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                sx={{ textTransform: "none" }}
                onClick={() => setSendDialogOpen(true)}
              >
                Send Quote
              </Button>
            )}
            {isBuyer && quote.status === QuoteStatus.Active && quote.currentRevisionId && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleOutlinedIcon />}
                  sx={{ textTransform: "none" }}
                  onClick={() => setAcceptDialogOpen(true)}
                >
                  Accept
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  sx={{ textTransform: "none" }}
                  onClick={() => setRejectDialogOpen(true)}
                >
                  Reject
                </Button>
              </>
            )}
            {isSeller && (
              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                sx={{ textTransform: "none" }}
                onClick={() => setEditDialogOpen(true)}
              >
                Edit
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<PrintOutlinedIcon />}
              sx={{ textTransform: "none" }}
              onClick={() => setPrintDialogOpen(true)}
            >
              Print
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Main Content */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Overview Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatPrice(totalAmount)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Valid Until
                </Typography>
                <Typography variant="body1">{formatDate(quote.validUntil)}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Revision
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    cursor: "pointer",
                    "&:hover": { color: "primary.main" },
                  }}
                  onClick={() => setRevisionHistoryDialogOpen(true)}
                >
                  <Typography variant="body1">
                    #{quote.currentRevision?.revisionNumber || 1}
                  </Typography>
                  <HistoryIcon fontSize="small" sx={{ opacity: 0.7 }} />
                </Box>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip label={quote.status} color={getStatusColor(quote.status)} size="small" />
              </Grid>
            </Grid>
          </Paper>

          {/* RFQ Section (if exists) */}
          {quote.rfqId && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Related RFQ
                </Typography>
                <Button
                  size="small"
                  onClick={() => setShowRfqDetails(!showRfqDetails)}
                  sx={{ textTransform: "none" }}
                >
                  {showRfqDetails ? "Hide Details" : "Show Details"}
                </Button>
              </Box>
              {showRfqDetails && rfqData?.rfqById && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    RFQ ID: {rfqData.rfqById.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {rfqData.rfqById.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Response Deadline: {formatDate(rfqData.rfqById.responseDeadline)}
                  </Typography>
                </Box>
              )}
            </Paper>
          )}

          {/* Line Items */}
          <LineItemsSection quote={quote} />

          {/* Files Section - TODO: Add QUOTE to ResourceTypes enum in backend */}
          {/* <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Attached Files
            </Typography>
            <AttachedFilesSection
              entityId={quote.id}
              entityType={ResourceTypes.ErpProject}
            />
          </Paper> */}

          {/* Notes Section - TODO: Add QUOTE to ResourceTypes enum in backend */}
          {/* <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Notes
            </Typography>
            <NotesSection resourceId={quote.id} resourceType="QUOTE" workspaceId={workspaceId} />
          </Paper> */}
        </Grid>

        {/* Right Column - Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Metadata Card */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Details
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Quote ID
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {quote.id}
                  </Typography>
                  <IconButton size="small" onClick={() => handleCopy(quote.id, "Quote ID")}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">{formatDate(quote.createdAt)}</Typography>
                {quote.createdByUser && (
                  <Typography variant="caption" color="text.secondary">
                    by {quote.createdByUser.firstName} {quote.createdByUser.lastName}
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">{formatDate(quote.updatedAt)}</Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Contact Information */}
          {isSeller && quote.sellersBuyerContact && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Buyer Contact
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {quote.sellersBuyerContact.__typename === "PersonContact"
                  ? quote.sellersBuyerContact.name
                  : quote.sellersBuyerContact.__typename === "BusinessContact"
                    ? quote.sellersBuyerContact.name
                    : "Unknown"}
              </Typography>
              {quote.sellersBuyerContact.__typename === "PersonContact" && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    {quote.sellersBuyerContact.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {quote.sellersBuyerContact.phone}
                  </Typography>
                </>
              )}
            </Paper>
          )}

          {isBuyer && quote.buyersSellerContact && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Seller Contact
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {quote.buyersSellerContact.__typename === "PersonContact"
                  ? quote.buyersSellerContact.name
                  : quote.buyersSellerContact.__typename === "BusinessContact"
                    ? quote.buyersSellerContact.name
                    : "Unknown"}
              </Typography>
              {quote.buyersSellerContact.__typename === "PersonContact" && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    {quote.buyersSellerContact.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {quote.buyersSellerContact.phone}
                  </Typography>
                </>
              )}
            </Paper>
          )}

          {/* Project Information */}
          {quote.sellersProject && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Project
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {quote.sellersProject.name}
              </Typography>
              {quote.sellersProject.project_code && (
                <Typography variant="caption" color="text.secondary">
                  {quote.sellersProject.project_code}
                </Typography>
              )}
              {quote.sellersProject.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {quote.sellersProject.description}
                </Typography>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Action Dialogs */}
      <SendQuoteDialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        quoteId={quoteId}
        onSuccess={() => refetch()}
      />
      <AcceptQuoteDialog
        open={acceptDialogOpen}
        onClose={() => setAcceptDialogOpen(false)}
        quoteId={quoteId}
        onSuccess={() => refetch()}
      />
      <RejectQuoteDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        quoteId={quoteId}
        onSuccess={() => refetch()}
      />
      <CancelQuoteDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        quoteId={quoteId}
        onSuccess={() => refetch()}
      />
      <PrintQuoteDialog
        open={printDialogOpen}
        onClose={() => setPrintDialogOpen(false)}
        quoteId={quoteId}
        onSuccess={() => refetch()}
      />
      <EditQuoteDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        quoteId={quoteId}
        onSuccess={() => refetch()}
      />
      <EditLineItemsDialog
        open={editLineItemsDialogOpen}
        onClose={() => setEditLineItemsDialogOpen(false)}
        quoteId={quoteId}
        quoteStatus={quote.status}
        onSuccess={() => refetch()}
      />
      <RevisionHistoryDialog
        open={revisionHistoryDialogOpen}
        onClose={() => setRevisionHistoryDialogOpen(false)}
        currentRevision={quote.currentRevision}
        quoteId={quoteId}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
