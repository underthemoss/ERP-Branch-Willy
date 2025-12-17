"use client";

import { IntakeFormSubmissionLineItemFieldsFragment } from "@/graphql/graphql";
import { useWorkspaceProviderListWorkspacesQuery } from "@/graphql/hooks";
import {
  useAdoptOrphanedSubmissionsMutation,
  useGetIntakeFormByIdQuery,
  useListIntakeFormSubmissionsAsBuyerQuery,
} from "@/ui/intake-forms/api";
import { CreateWorkspaceFlow } from "@/ui/workspace/CreateWorkspaceFlow";
import { WorkspaceSelector, WorkspaceSelectorWorkspace } from "@/ui/workspace/WorkspaceSelector";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  Building2,
  CheckCircle,
  Clock,
  Edit3,
  FileQuestion,
  Package,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import OrdersHeader from "./components/OrdersHeader";

// Helper to determine line item status
function getLineItemStatus(
  lineItem: IntakeFormSubmissionLineItemFieldsFragment,
): "pending" | "accepted" | "assigned" {
  if (lineItem.inventoryReservations && lineItem.inventoryReservations.length > 0) {
    return "assigned";
  }
  if (lineItem.salesOrderId) {
    return "accepted";
  }
  return "pending";
}

// Helper to get order overall status
function getOrderStatus(
  lineItems: IntakeFormSubmissionLineItemFieldsFragment[],
): "pending" | "processing" | "assigned" {
  if (lineItems.length === 0) return "pending";

  const statuses = lineItems.map(getLineItemStatus);

  // All items assigned = fully assigned
  if (statuses.every((s) => s === "assigned")) {
    return "assigned";
  }

  // Any item accepted or assigned = processing
  if (statuses.some((s) => s === "accepted" || s === "assigned")) {
    return "processing";
  }

  return "pending";
}

const formatPrice = (cents?: number | null): string => {
  if (!cents) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
};

function StatusChip({ status }: { status: "draft" | "pending" | "processing" | "assigned" }) {
  const config = {
    draft: {
      label: "Draft",
      color: "default" as const,
      icon: <Edit3 className="w-3 h-3" />,
    },
    pending: {
      label: "Pending Review",
      color: "warning" as const,
      icon: <Clock className="w-3 h-3" />,
    },
    processing: {
      label: "Processing",
      color: "info" as const,
      icon: <ShoppingBag className="w-3 h-3" />,
    },
    assigned: {
      label: "Equipment Assigned",
      color: "success" as const,
      icon: <CheckCircle className="w-3 h-3" />,
    },
  };

  const { label, color, icon } = config[status];

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      icon={<Box sx={{ display: "flex", pl: 0.5 }}>{icon}</Box>}
    />
  );
}

export default function OrdersListPage() {
  const params = useParams();
  const { loginWithRedirect, user, isAuthenticated, isLoading: authLoading } = useAuth0();
  const formId = params.id as string;

  // State for selected buyer workspace
  const [selectedBuyerWorkspaceId, setSelectedBuyerWorkspaceId] = useState<string | null>(null);

  // State for workspace onboarding flow (for users with no workspaces)
  const [showWorkspaceOnboarding, setShowWorkspaceOnboarding] = useState(false);

  // Mutation to adopt orphaned submissions to a workspace
  const [adoptOrphanedSubmissions] = useAdoptOrphanedSubmissionsMutation();

  // Query to get the intake form
  const {
    data: intakeFormData,
    loading: loadingForm,
    error: formError,
  } = useGetIntakeFormByIdQuery({
    variables: { id: formId },
    fetchPolicy: "cache-and-network",
    skip: !formId,
  });

  const intakeForm = intakeFormData?.getIntakeFormById;

  // Fetch user's workspaces (only if authenticated)
  const {
    data: workspacesData,
    loading: loadingWorkspaces,
    refetch: refetchWorkspaces,
  } = useWorkspaceProviderListWorkspacesQuery({
    fetchPolicy: "cache-and-network",
    skip: !isAuthenticated || authLoading,
  });

  const userWorkspaces: WorkspaceSelectorWorkspace[] = useMemo(
    () => workspacesData?.listWorkspaces?.items || [],
    [workspacesData?.listWorkspaces?.items],
  );

  // Auto-select first workspace when workspaces load
  useEffect(() => {
    if (userWorkspaces.length > 0 && !selectedBuyerWorkspaceId) {
      setSelectedBuyerWorkspaceId(userWorkspaces[0].id);
    }
  }, [userWorkspaces, selectedBuyerWorkspaceId]);

  // Query to get submissions for this form using the buyer query
  const {
    data: submissionsData,
    loading: loadingSubmissions,
    refetch: refetchSubmissions,
  } = useListIntakeFormSubmissionsAsBuyerQuery({
    variables: {
      buyerWorkspaceId: selectedBuyerWorkspaceId || "",
      intakeFormId: formId,
    },
    fetchPolicy: "cache-and-network",
    skip: !selectedBuyerWorkspaceId || !formId,
  });

  // Show all submissions (both draft and submitted)
  const submissions = submissionsData?.listIntakeFormSubmissionsAsBuyer?.items || [];

  // Handler when workspace is created during onboarding
  const handleWorkspaceCreated = async (workspaceId: string) => {
    // Adopt orphaned submissions to the new workspace
    try {
      await adoptOrphanedSubmissions({ variables: { workspaceId } });
    } catch (error) {
      console.error("Failed to adopt submissions:", error);
    }

    // Set the selected workspace and close onboarding
    setSelectedBuyerWorkspaceId(workspaceId);
    setShowWorkspaceOnboarding(false);

    // Refetch workspaces to update the list
    await refetchWorkspaces();

    // Refetch submissions to show newly adopted ones
    // Use setTimeout to ensure the workspace ID state has been updated
    setTimeout(() => {
      refetchSubmissions();
    }, 100);
  };

  // Loading state
  if (loadingForm || loadingWorkspaces || authLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading orders...</Typography>
        </Paper>
      </Container>
    );
  }

  // If user is not authenticated, prompt to login
  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Sign in to view your orders
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            You need to be signed in to view your orders for this form.
          </Typography>
          <button
            onClick={() =>
              loginWithRedirect({
                appState: { returnTo: window.location.pathname },
              })
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </Paper>
      </Container>
    );
  }

  // If user is authenticated but has no workspaces, show workspace onboarding
  if (userWorkspaces.length === 0) {
    // Show the full workspace creation flow
    if (showWorkspaceOnboarding) {
      return (
        <CreateWorkspaceFlow
          onComplete={handleWorkspaceCreated}
          onCancel={() => setShowWorkspaceOnboarding(false)}
        />
      );
    }

    // Show the prompt to set up a workspace
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "primary.light",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <Building2 size={32} className="text-blue-600" />
          </Box>
          <Typography variant="h6" gutterBottom>
            Set Up Your Workspace
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            To view and track your orders, you need to create or join a workspace.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setShowWorkspaceOnboarding(true)}
            sx={{ textTransform: "none" }}
          >
            Get Started
          </Button>
        </Paper>
      </Container>
    );
  }

  // Permission error
  if (formError && formError.message.includes("permission")) {
    if (user) {
      return (
        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="error" gutterBottom>
              Access Denied
            </Typography>
            <Typography>You do not have permission to view these orders.</Typography>
          </Paper>
        </Container>
      );
    }
    loginWithRedirect({
      appState: {
        returnTo: window.location.pathname,
      },
    });
    return null;
  }

  // Form not found
  if (formError || (!loadingForm && !intakeForm)) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="error" gutterBottom>
            Form Not Found
          </Typography>
          <Typography>The intake form you&apos;re looking for could not be found.</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <OrdersHeader
        projectName={intakeForm?.project?.name || "Equipment Request"}
        companyName={intakeForm?.workspace?.name || ""}
        logoUrl={intakeForm?.workspace?.logoUrl || undefined}
        formId={formId}
      />

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Your Orders
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track the status of your equipment requests
            </Typography>
          </Box>

          {/* Workspace selector - only shown if user has multiple workspaces */}
          {userWorkspaces.length > 1 && (
            <WorkspaceSelector
              workspaces={userWorkspaces}
              selectedWorkspaceId={selectedBuyerWorkspaceId}
              onWorkspaceChange={setSelectedBuyerWorkspaceId}
              label="Viewing orders for"
              hideIfSingle={true}
            />
          )}
        </Box>

        {loadingSubmissions ? (
          <Paper elevation={1} sx={{ p: 6, textAlign: "center" }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography color="text.secondary">Loading your orders...</Typography>
          </Paper>
        ) : submissions.length === 0 ? (
          <Paper elevation={1} sx={{ p: 6, textAlign: "center" }}>
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <Typography variant="h6" gutterBottom>
              No Orders Yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              You haven&apos;t submitted any equipment requests yet.
            </Typography>
            <Link
              href={`/intake-form/${formId}/catalog`}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Catalog
            </Link>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={1}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => {
                  const lineItems = submission.lineItems || [];
                  const isDraft = submission.status === "DRAFT";
                  const status: "draft" | "pending" | "processing" | "assigned" = isDraft
                    ? "draft"
                    : getOrderStatus(lineItems);

                  // Draft orders go to catalog to continue editing, submitted go to order details
                  const handleRowClick = () => {
                    if (isDraft) {
                      window.location.href = `/intake-form/${formId}/catalog?submissionId=${submission.id}`;
                    } else {
                      window.location.href = `/intake-form/${formId}/orders/${submission.id}`;
                    }
                  };

                  const linkHref = isDraft
                    ? `/intake-form/${formId}/catalog?submissionId=${submission.id}`
                    : `/intake-form/${formId}/orders/${submission.id}`;

                  const linkText = isDraft ? "Continue Editing" : "View Details";

                  return (
                    <TableRow
                      key={submission.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={handleRowClick}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {submission.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {isDraft
                            ? submission.createdAt
                              ? new Date(submission.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "-"
                            : submission.submittedAt
                              ? new Date(submission.submittedAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {lineItems.length} {lineItems.length === 1 ? "item" : "items"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {submission.totalInCents ? (
                          <Typography variant="body2" fontWeight="medium">
                            {formatPrice(submission.totalInCents)}
                          </Typography>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              color: "warning.main",
                            }}
                          >
                            <FileQuestion size={14} />
                            <Typography variant="caption" fontWeight="medium" color="warning.main">
                              Quote pending
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={status} />
                      </TableCell>
                      <TableCell align="right">
                        <Link
                          href={linkHref}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {linkText}
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </div>
  );
}
