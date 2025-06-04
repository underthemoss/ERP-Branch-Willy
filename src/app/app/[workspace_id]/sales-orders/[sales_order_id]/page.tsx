"use client";

import { graphql } from "@/graphql";
import { useGetSalesOrderByIdQuery } from "@/graphql/hooks";
import { Box, Button, Container, Divider, Grid, Paper, Stack, Typography } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";

const SALES_ORDER_DETAIL_QUERY = graphql(`
  query GetSalesOrderById($id: String) {
    getSalesOrderById(id: $id) {
      id
      order_id
      purchase_order_number
      company_id
      created_at
      created_by
      updated_at
      updated_by
      buyer_id
      project_id
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

export default function SalesOrderDetailPage() {
  const { sales_order_id, workspace_id } = useParams<{
    sales_order_id: string;
    workspace_id: string;
  }>();
  const router = useRouter();

  const { data, loading, error } = useGetSalesOrderByIdQuery({
    variables: { id: sales_order_id },
    fetchPolicy: "cache-and-network",
  });

  const salesOrder = data?.getSalesOrderById;

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
                  <Typography variant="h4" gutterBottom>
                    Sales Order #{salesOrder.order_id}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                    Purchase Order Number: {salesOrder.purchase_order_number}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { md: "right", xs: "left" } }}>
                  <Button variant="contained" sx={{ mr: 1 }}>
                    Edit
                  </Button>
                  <Button variant="outlined" color="secondary">
                    Print
                  </Button>
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

            {/* Buyer & Project Info */}
            <Grid container spacing={3} alignItems="stretch">
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
                          <Typography>Address: {salesOrder.buyer.address}</Typography>
                        )}
                        {"website" in salesOrder.buyer && salesOrder.buyer.website && (
                          <Typography>Website: {salesOrder.buyer.website}</Typography>
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
                      Project Information
                    </Typography>
                    <Divider sx={{ mb: 1 }} />
                    {salesOrder.project ? (
                      <Box>
                        <Typography>
                          Name: <b>{salesOrder.project.name}</b>
                        </Typography>
                        <Typography>Code: {salesOrder.project.project_code}</Typography>
                        <Typography>Description: {salesOrder.project.description}</Typography>
                        <Typography>Company: {salesOrder.project.company?.name}</Typography>
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
              </Grid>
            </Grid>

            {/* Stubbed Order Items Section */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {/* Replace with real items table if available */}
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                No items found for this order.
              </Typography>
              <Button variant="outlined" size="small" disabled>
                Add Item (stub)
              </Button>
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
                    ID
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {salesOrder.id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Company ID
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {salesOrder.company_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Project ID
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {salesOrder.project_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Buyer ID
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {salesOrder.buyer_id}
                  </Typography>
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
    </Container>
  );
}
