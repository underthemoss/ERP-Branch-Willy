"use client";

import { useListIntakeFormSubmissionsByFormIdQuery } from "@/ui/intake-forms/api";
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

export default function IntakeFormSubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspace_id as string;
  const formId = params.formId as string;

  // Fetch submissions for this specific form (includes lineItems)
  const { data, loading, refetch } = useListIntakeFormSubmissionsByFormIdQuery({
    variables: { workspaceId, intakeFormId: formId },
    fetchPolicy: "cache-and-network",
  });

  const handleBack = () => {
    router.push(`/app/${workspaceId}/intake-forms`);
  };

  const formSubmissions = data?.listIntakeFormSubmissions?.items || [];

  // Calculate stats
  const totalLineItems = formSubmissions.reduce(
    (acc, sub) => acc + (sub.lineItems?.length || 0),
    0,
  );

  const totalValue = formSubmissions.reduce((acc, sub) => acc + (sub.totalInCents || 0), 0);

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
                Total Line Items
              </Typography>
              <Typography variant="h4">{totalLineItems}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h4">
                ${(totalValue / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
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
      </Grid>

      {/* Submissions Table */}
      <SubmissionsTable
        submissions={formSubmissions as any}
        loading={loading}
        showFormId={false}
        emptyStateTitle="No submissions yet"
        emptyStateMessage="Share the form link to start collecting submissions"
        onRefetch={refetch}
        workspaceId={workspaceId}
      />
    </Container>
  );
}
