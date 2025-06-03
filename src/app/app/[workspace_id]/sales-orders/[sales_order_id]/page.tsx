"use client";

import { graphql } from "@/graphql";
import { useGetSalesOrderByIdQuery } from "@/graphql/hooks";
import { Box, Button, Container, Divider, Grid, Paper, Typography } from "@mui/material";
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

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
  
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
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Sales Order #{salesOrder.order_id}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Purchase Order Number: {salesOrder.purchase_order_number}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Buyer
              </Typography>
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
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Project
              </Typography>
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
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Metadata
              </Typography>
              <Typography>ID: {salesOrder.id}</Typography>
              <Typography>Company ID: {salesOrder.company_id}</Typography>
              <Typography>Project ID: {salesOrder.project_id}</Typography>
              <Typography>Buyer ID: {salesOrder.buyer_id}</Typography>
              <Typography>Created At: {salesOrder.created_at}</Typography>
              <Typography>Updated At: {salesOrder.updated_at}</Typography>
              <Typography>
                Created By:{" "}
                {salesOrder.created_by_user
                  ? `${salesOrder.created_by_user.firstName} ${salesOrder.created_by_user.lastName} (${salesOrder.created_by_user.email})`
                  : salesOrder.created_by}
              </Typography>
              <Typography>
                Updated By:{" "}
                {salesOrder.updated_by_user
                  ? `${salesOrder.updated_by_user.firstName} ${salesOrder.updated_by_user.lastName} (${salesOrder.updated_by_user.email})`
                  : salesOrder.updated_by}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
}
