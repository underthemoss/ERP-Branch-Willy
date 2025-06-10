// "use client";

import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import * as React from "react";

export type EntityDisplayInfoCard = {
  title: string;
  content: React.ReactNode;
  buttonLabel?: string;
  onButtonClick?: () => void;
  buttonDisabled?: boolean;
};

export type EntityDisplayPageProps = {
  entityName: string;
  entityId: string | number;
  overviewFields: Array<{ label: string; value: React.ReactNode }>;
  infoCards: [EntityDisplayInfoCard, EntityDisplayInfoCard];
  itemsSection?: React.ReactNode;
  metadata: Array<{ label: string; value: React.ReactNode }>;
  loading?: boolean;
  error?: string;
};

export function EntityDisplayPage({
  entityName,
  entityId,
  overviewFields,
  infoCards,
  itemsSection,
  metadata,
  loading,
  error,
}: EntityDisplayPageProps) {
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
          Loading {entityName.toLowerCase()} details...
        </Typography>
      )}
      {error && (
        <Typography variant="body1" color="error">
          Error loading {entityName.toLowerCase()}: {error}
        </Typography>
      )}
      {!loading && !error && (
        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Top Card: Entity Overview */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Grid
                container
                alignItems="center"
                justifyContent="space-between"
              >
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="h4" gutterBottom>
                    {entityName} #{entityId}
                  </Typography>
                  {overviewFields.map((field) => (
                    <Typography
                      key={field.label}
                      variant="subtitle1"
                      color="text.secondary"
                      gutterBottom
                    >
                      {field.label}: {field.value}
                    </Typography>
                  ))}
                </Grid>
                <Grid
                  size={{ xs: 12, md: 4 }}
                  sx={{ textAlign: { md: "right", xs: "left" } }}
                >
                  <Button variant="contained" sx={{ mr: 1 }} disabled>
                    Edit
                  </Button>
                  <Button variant="outlined" color="secondary" disabled>
                    Print
                  </Button>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              {/* Stubbed Progress Bar */}
              <Box sx={{ width: "100%", mb: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Progress
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: "80%", mr: 1 }}>
                    {/* Replace with real progress if available */}
                    <Box
                      sx={{ bgcolor: "#e0e0e0", borderRadius: 1, height: 10 }}
                    >
                      <Box
                        sx={{
                          width: "40%",
                          bgcolor: "primary.main",
                          height: 10,
                          borderRadius: 1,
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    2 of 5 steps
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Info Cards */}
            <Grid container spacing={3} alignItems="stretch" sx={{ mb: 3 }}>
              {infoCards.map((card, idx) => (
                <Grid
                  size={{ xs: 12, md: 6 }}
                  sx={{ display: "flex" }}
                  key={card.title}
                >
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
                        {card.title}
                      </Typography>
                      <Divider sx={{ mb: 1 }} />
                      {card.content}
                    </Box>
                    {card.buttonLabel && (
                      <Box sx={{ mt: 2, textAlign: "right" }}>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={card.buttonDisabled}
                          onClick={card.onButtonClick}
                        >
                          {card.buttonLabel}
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Items Section */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Items
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {itemsSection ? (
                itemsSection
              ) : (
                <>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    No items found for this entity.
                  </Typography>
                  <Button variant="outlined" size="small" disabled>
                    Add Item (stub)
                  </Button>
                </>
              )}
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
                {metadata.map((meta) => (
                  <Box key={meta.label}>
                    <Typography variant="body2" color="text.secondary">
                      {meta.label}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {meta.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Stubbed Help/Support Card */}
            <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: "#fffbe6" }}>
              <Typography
                variant="body1"
                sx={{ display: "flex", alignItems: "center", mb: 1 }}
              >
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
                Need help with this entity?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Our team would be happy to help you with any kind of problem you
                might have!
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
              <Button
                variant="outlined"
                size="small"
                sx={{ mb: 1, width: "100%" }}
                disabled
              >
                Invite Team (stub)
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{ mb: 1, width: "100%" }}
                disabled
              >
                View All Entities (stub)
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{ width: "100%" }}
                disabled
              >
                Upgrade Plan (stub)
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

export default EntityDisplayPage;
