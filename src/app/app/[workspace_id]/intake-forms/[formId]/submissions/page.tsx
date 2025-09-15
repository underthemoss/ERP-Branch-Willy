"use client";

import { graphql } from "@/graphql";
import { useListFormSubmissionsQuery } from "@/graphql/hooks";
import SubmissionsTable from "@/ui/intake-forms/SubmissionsTable";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import React from "react";

// GraphQL query for submissions
graphql(`
  query ListFormSubmissions($workspaceId: String!) {
    listIntakeFormSubmissions(workspaceId: $workspaceId) {
      items {
        id
        formId
        workspaceId
        name
        email
        createdAt
        phone
        companyName
        purchaseOrderNumber
        lineItems {
          description
          startDate
          type
          durationInDays
          quantity
        }
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`);

export default function IntakeFormSubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspace_id as string;
  const formId = params.formId as string;

  // Fetch submissions
  const { data, loading } = useListFormSubmissionsQuery({
    variables: { workspaceId },
    fetchPolicy: "cache-and-network",
  });

  const handleBack = () => {
    router.push(`/app/${workspaceId}/intake-forms`);
  };

  // Filter submissions for this specific form
  const allSubmissions = data?.listIntakeFormSubmissions?.items || [];
  const formSubmissions = allSubmissions.filter((sub) => sub.formId === formId);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Form Submissions</Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Form ID: {formId}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Submissions
              </Typography>
              <Typography variant="h4">{formSubmissions.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                This Week
              </Typography>
              <Typography variant="h4">
                {
                  formSubmissions.filter((sub) => {
                    const subDate = new Date(sub.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return subDate >= weekAgo;
                  }).length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Today
              </Typography>
              <Typography variant="h4">
                {
                  formSubmissions.filter((sub) => {
                    const subDate = new Date(sub.createdAt);
                    const today = new Date();
                    return subDate.toDateString() === today.toDateString();
                  }).length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Avg. Quantity
              </Typography>
              <Typography variant="h4">
                {formSubmissions.length > 0
                  ? Math.round(
                      formSubmissions.reduce((acc, sub) => {
                        const totalQuantity =
                          sub.lineItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                        return acc + totalQuantity;
                      }, 0) / formSubmissions.length,
                    )
                  : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Submissions Table */}
      <SubmissionsTable
        submissions={formSubmissions}
        loading={loading}
        showFormId={false}
        emptyStateTitle="No submissions yet"
        emptyStateMessage="Share the form link to start collecting submissions"
      />
    </Container>
  );
}
