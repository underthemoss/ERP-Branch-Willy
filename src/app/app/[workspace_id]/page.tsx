"use client";

import { graphql } from "@/graphql";
import {
  useDashboardActiveRentalsQuery,
  useDashboardIntakeSubmissionsQuery,
  useDashboardInvoicesQuery,
  useDashboardProjectsQuery,
  useDashboardSalesOrdersQuery,
  useListMyOrphanedSubmissionsQuery,
} from "@/graphql/hooks";
import { useAuth0ErpUser } from "@/hooks/useAuth0ErpUser";
import { useSelectedWorkspace } from "@/providers/WorkspaceProvider";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import InventoryIcon from "@mui/icons-material/Inventory";
import MailIcon from "@mui/icons-material/Mail";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { format, formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import * as React from "react";

// Dashboard KPIs Query
graphql(`
  query DashboardActiveRentals($workspaceId: ID!) {
    listRentalFulfilments(filter: { workspaceId: $workspaceId }, page: { number: 1, size: 1000 }) {
      page {
        totalItems
      }
    }
  }
`);

graphql(`
  query DashboardSalesOrders($workspaceId: String!) {
    listSalesOrders(workspaceId: $workspaceId, limit: 1000, offset: 0) {
      items {
        id
        status
        sales_order_number
        created_at
        buyer {
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
    }
  }
`);

graphql(`
  query DashboardInvoices($workspaceId: String!) {
    listInvoices(
      query: { filter: { workspaceId: $workspaceId }, page: { number: 1, size: 1000 } }
    ) {
      items {
        id
        status
        finalSumInCents
        createdAt
        invoiceNumber
      }
    }
  }
`);

graphql(`
  query DashboardProjects($workspaceId: String!) {
    listProjects(workspaceId: $workspaceId) {
      id
      status
      name
      project_code
      created_at
    }
  }
`);

graphql(`
  query DashboardIntakeSubmissions($workspaceId: String!) {
    listIntakeFormSubmissions(
      workspaceId: $workspaceId
      excludeWithSalesOrder: true
      limit: 100
      page: 1
    ) {
      items {
        id
        status
      }
      page {
        totalItems
      }
    }
  }
`);

export default function DashboardMainSection() {
  const workspace = useSelectedWorkspace();
  const workspaceId = workspace?.id ?? "";
  const router = useRouter();
  const { user } = useAuth0ErpUser();

  // Fetch dashboard data
  const { data: rentalsData, loading: rentalsLoading } = useDashboardActiveRentalsQuery({
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const { data: salesOrdersData, loading: salesOrdersLoading } = useDashboardSalesOrdersQuery({
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const { data: invoicesData, loading: invoicesLoading } = useDashboardInvoicesQuery({
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const { data: projectsData, loading: projectsLoading } = useDashboardProjectsQuery({
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const { data: intakeData, loading: intakeLoading } = useDashboardIntakeSubmissionsQuery({
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const { data: orphanedData } = useListMyOrphanedSubmissionsQuery({
    fetchPolicy: "cache-and-network",
  });

  // Calculate KPIs
  const activeRentals = rentalsData?.listRentalFulfilments?.page?.totalItems ?? 0;
  const totalOrders = salesOrdersData?.listSalesOrders?.total ?? 0;
  const totalInvoices = invoicesData?.listInvoices?.items?.length ?? 0;
  const totalProjects = projectsData?.listProjects?.length ?? 0;
  const orphanedCount = orphanedData?.listMyOrphanedSubmissions?.length ?? 0;

  const isLoading =
    rentalsLoading || salesOrdersLoading || invoicesLoading || projectsLoading || intakeLoading;

  // Get user's first name for personalization
  const firstName = user?.name?.split(" ")[0] || user?.nickname || "there";

  return (
    <>
      {/* Workspace Banner */}
      <Box
        sx={{
          background: workspace?.bannerImageUrl
            ? `url(${workspace.bannerImageUrl}) center/cover`
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          position: "relative",
          "&::before": workspace?.bannerImageUrl
            ? {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.4)",
              }
            : {},
        }}
      >
        <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1, py: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            {workspace?.logoUrl ? (
              <Avatar
                src={workspace.logoUrl}
                alt={workspace.name}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "white",
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "white",
                  color: "#667eea",
                  fontSize: "2rem",
                  fontWeight: 700,
                }}
              >
                {workspace?.name?.charAt(0).toUpperCase() || "W"}
              </Avatar>
            )}
            <Box>
              <Typography
                variant="h4"
                sx={{
                  color: "white",
                  fontWeight: 600,
                  mb: 0.5,
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                Welcome back, {firstName}! 👋
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {workspace?.name} • {format(new Date(), "EEEE, MMMM do")}
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Orphaned Submissions Alert */}
        {orphanedCount > 0 && (
          <Alert
            severity="info"
            icon={<InfoOutlinedIcon />}
            sx={{
              mb: 3,
              alignItems: "center",
              "& .MuiAlert-message": {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              },
            }}
            action={
              <Button
                color="inherit"
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={() => router.push(`/app/${workspaceId}/my-requests/orphaned`)}
                sx={{ whiteSpace: "nowrap" }}
              >
                Review Requests
              </Button>
            }
          >
            <Box>
              <Typography variant="body2" fontWeight={600}>
                You have {orphanedCount} request{orphanedCount !== 1 ? "s" : ""} waiting to be added
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Requests you submitted before joining this workspace can be added to track them
                here.
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Overview Copy */}
        <Box mb={3}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Your workspace at a glance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Here&apos;s what&apos;s happening across your projects, orders, and inventory today.
          </Typography>
        </Box>

        {/* KPI Cards - Real Data Only */}
        <Grid container spacing={2} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
              onClick={() => router.push(`/app/${workspaceId}/sales-orders`)}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: "#e3f2fd",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SyncAltIcon sx={{ color: "#1976d2", fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {isLoading ? <CircularProgress size={24} /> : totalOrders}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sales Orders
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
              onClick={() => router.push(`/app/${workspaceId}/invoices`)}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: "#f3e5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ReceiptLongIcon sx={{ color: "#7b1fa2", fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {isLoading ? <CircularProgress size={24} /> : totalInvoices}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Invoices
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
              onClick={() => router.push(`/app/${workspaceId}/projects`)}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: "#fff3e0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FolderOpenIcon sx={{ color: "#f57c00", fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {isLoading ? <CircularProgress size={24} /> : totalProjects}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Projects
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
              onClick={() => router.push(`/app/${workspaceId}/fulfillment`)}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: "#e8f5e9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <InventoryIcon sx={{ color: "#2e7d32", fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {isLoading ? <CircularProgress size={24} /> : activeRentals}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Rentals
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
              onClick={() => router.push(`/app/${workspaceId}/requests`)}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: "#fce4ec",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MailIcon sx={{ color: "#c2185b", fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {isLoading ? (
                        <CircularProgress size={24} />
                      ) : (
                        (intakeData?.listIntakeFormSubmissions?.items?.filter(
                          (item) => item.status === "SUBMITTED",
                        ).length ?? 0)
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Submissions
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Activity Section */}
        <Box mb={3}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Recent activity
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Stay on top of your latest transactions and project updates.
          </Typography>
        </Box>

        {/* Data Tables */}
        <Grid container spacing={3}>
          {/* Recent Projects */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)", height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Recent Projects
                </Typography>
                {projectsLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : projectsData?.listProjects && projectsData.listProjects.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Code</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projectsData.listProjects
                          .filter((project) => project !== null)
                          .slice(0, 5)
                          .map((project) => (
                            <TableRow
                              key={project.id}
                              hover
                              sx={{ cursor: "pointer" }}
                              onClick={() =>
                                router.push(`/app/${workspaceId}/projects/${project.id}`)
                              }
                            >
                              <TableCell>{project.name}</TableCell>
                              <TableCell>{project.project_code}</TableCell>
                              <TableCell>
                                {project.status ? (
                                  <Chip
                                    label={project.status}
                                    size="small"
                                    sx={{ height: 20, fontSize: "0.7rem" }}
                                  />
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box py={4} textAlign="center">
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      No projects yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Create your first project to get started
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Invoices */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)", height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Recent Invoices
                </Typography>
                {invoicesLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : invoicesData?.listInvoices?.items &&
                  invoicesData.listInvoices.items.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Invoice #</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoicesData.listInvoices.items.slice(0, 5).map((invoice) => (
                          <TableRow
                            key={invoice.id}
                            hover
                            sx={{ cursor: "pointer" }}
                            onClick={() =>
                              router.push(`/app/${workspaceId}/invoices/${invoice.id}`)
                            }
                          >
                            <TableCell>{invoice.invoiceNumber}</TableCell>
                            <TableCell>
                              ${((invoice.finalSumInCents ?? 0) / 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={invoice.status}
                                size="small"
                                color={invoice.status === "PAID" ? "success" : "default"}
                                sx={{ height: 20, fontSize: "0.7rem" }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box py={4} textAlign="center">
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      No invoices yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Your invoices will appear here once created
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Sales Orders */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Recent Sales Orders
                </Typography>
                {salesOrdersLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : salesOrdersData?.listSalesOrders?.items &&
                  salesOrdersData.listSalesOrders.items.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Order #</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {salesOrdersData.listSalesOrders.items.slice(0, 10).map((order) => {
                          const buyerName =
                            order.buyer && "name" in order.buyer ? order.buyer.name : "Unknown";
                          return (
                            <TableRow
                              key={order.id}
                              hover
                              sx={{ cursor: "pointer" }}
                              onClick={() =>
                                router.push(`/app/${workspaceId}/sales-orders/${order.id}`)
                              }
                            >
                              <TableCell>{order.sales_order_number}</TableCell>
                              <TableCell>{buyerName}</TableCell>
                              <TableCell>
                                {order.created_at
                                  ? formatDistanceToNow(new Date(Number(order.created_at)), {
                                      addSuffix: true,
                                    })
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={order.status}
                                  size="small"
                                  color={order.status === "SUBMITTED" ? "primary" : "default"}
                                  sx={{ height: 22, fontSize: "0.75rem" }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box py={4} textAlign="center">
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      No sales orders yet
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Create your first sales order to start tracking orders
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
