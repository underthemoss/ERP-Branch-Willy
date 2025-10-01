"use client";

import { graphql } from "@/graphql";
import { useGetNoteByIdQuery, useGetSearchDocumentByDocumentIdQuery } from "@/graphql/hooks";
import {
  Avatar,
  Box,
  Card,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// GraphQL query for getting search document by document ID
graphql(`
  query GetSearchDocumentByDocumentId($documentId: String!) {
    getSearchDocumentByDocumentId(documentId: $documentId) {
      id
      documentId
      collection
      title
      subtitle
      metadata
    }
  }
`);

// Map of collection types to routes
const COLLECTION_ROUTES: Record<string, (workspaceId: string, documentId: string) => string> = {
  contacts: (workspaceId, documentId) => `/app/${workspaceId}/contacts/${documentId}`,
  invoices: (workspaceId, documentId) => `/app/${workspaceId}/invoices/${documentId}`,
  projects: (workspaceId, documentId) => `/app/${workspaceId}/projects/${documentId}`,
  purchase_orders: (workspaceId, documentId) => `/app/${workspaceId}/purchase-orders/${documentId}`,
  sales_orders: (workspaceId, documentId) => `/app/${workspaceId}/sales-orders/${documentId}`,
};

export default function NoteRedirectPage() {
  const { note_id, workspace_id } = useParams<{ note_id: string; workspace_id: string }>();
  const router = useRouter();
  const [currentNoteId, setCurrentNoteId] = useState(note_id);
  const [showFallback, setShowFallback] = useState(false);

  // Fetch note
  const {
    data: noteData,
    loading: noteLoading,
    error: noteError,
  } = useGetNoteByIdQuery({
    variables: { id: currentNoteId },
    fetchPolicy: "cache-and-network",
  });

  // Fetch parent entity info from search
  const { data: parentSearchData, loading: parentLoading } = useGetSearchDocumentByDocumentIdQuery({
    variables: { documentId: noteData?.getNoteById?.parent_entity_id || "" },
    skip: !noteData?.getNoteById?.parent_entity_id,
    fetchPolicy: "cache-and-network",
  });

  const note = noteData?.getNoteById;
  const parentEntity = parentSearchData?.getSearchDocumentByDocumentId;

  // Handle navigation logic
  useEffect(() => {
    if (noteLoading || parentLoading) {
      return; // Still loading
    }

    if (noteError || !note) {
      // Note not found - show fallback
      setShowFallback(true);
      return;
    }

    if (!parentEntity) {
      // Parent entity not found in search - show fallback
      setShowFallback(true);
      return;
    }

    // Check if parent is another note (a reply)
    if (parentEntity.collection === "notes") {
      // Parent is a note, go up another level
      setCurrentNoteId(parentEntity.documentId);
      return;
    }

    // Found a non-note parent entity - redirect to it
    const routeFn = COLLECTION_ROUTES[parentEntity.collection];
    if (routeFn) {
      router.push(routeFn(workspace_id, parentEntity.documentId));
    } else {
      // Unknown collection type - show fallback
      setShowFallback(true);
    }
  }, [
    noteLoading,
    parentLoading,
    noteError,
    note,
    parentEntity,
    router,
    workspace_id,
    currentNoteId,
  ]);

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  // Get user initials
  const getUserInitials = (user?: { firstName?: string; lastName?: string } | null) => {
    if (!user) return "?";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  // Get user full name
  const getUserFullName = (user?: { firstName?: string; lastName?: string } | null) => {
    if (!user) return "Unknown User";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User";
  };

  // Extract text content from note value
  const getNoteContent = (value: any): string => {
    if (!value) return "";
    if (typeof value === "object" && value.plainText) {
      return value.plainText;
    }
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  };

  // Show loading while redirecting
  if (!showFallback) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={4}
        >
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            Loading note...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Fallback: Show note in isolation
  if (!note) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
        <Typography variant="h6" color="error">
          Note not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h5" fontWeight={600}>
                Note (Isolated View)
              </Typography>
              <Chip label="Note" color="info" />
            </Box>
            <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
              This note could not be displayed in context. Showing isolated view.
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Card sx={{ p: 2, mb: 2 }}>
              <Box display="flex" gap={2}>
                <Avatar sx={{ width: 40, height: 40 }}>
                  {getUserInitials(note.created_by_user)}
                </Avatar>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {getUserFullName(note.created_by_user)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(note.created_at)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {getNoteContent(note.value)}
                  </Typography>
                  {note.updated_at !== note.created_at && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      Edited {formatDate(note.updated_at)}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Card>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Note ID: {note._id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Parent Entity ID: {note.parent_entity_id}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
