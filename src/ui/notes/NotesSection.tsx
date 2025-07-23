"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import React, { useState } from "react";
import {
  useCreateNoteMutation,
  useCurrentUserQuery,
  useDeleteNoteMutation,
  useListNotesByEntityIdQuery,
  type Note as NoteType,
} from "./api";
import Note from "./Note";

interface NotesSectionProps {
  entityId: string;
}

const NotesSection: React.FC<NotesSectionProps> = ({ entityId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // State for the input text
  const [commentText, setCommentText] = useState("");

  // Fetch notes
  const { data, loading, error } = useListNotesByEntityIdQuery({
    variables: { parent_entity_id: entityId },
    fetchPolicy: "cache-and-network",
  });

  // Mutations
  const [createNote] = useCreateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();

  // Get current user
  const { data: currentUserData } = useCurrentUserQuery();
  const currentUserId = currentUserData?.currentUser?.es_user_id;

  // Handle submit comment
  const handleSubmitComment = async () => {
    const trimmedText = commentText.trim();
    if (!trimmedText) return;

    setIsSubmitting(true);
    try {
      await createNote({
        variables: {
          input: {
            parent_entity_id: entityId,
            value: { plainText: trimmedText },
          },
        },
      });
      // Reset the input
      setCommentText("");
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete note
  const handleDeleteClick = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return;

    try {
      await deleteNote({
        variables: { id: noteToDelete },
        update: (cache) => {
          // Remove from cache
          cache.modify({
            fields: {
              listNotesByEntityId(existingNotes = [], { readField }) {
                return existingNotes.filter(
                  (noteRef: any) => noteToDelete !== readField("_id", noteRef),
                );
              },
            },
          });
        },
      });
    } catch (error) {
      console.error("Failed to delete comment:", error);
    } finally {
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
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

    // Handle new format { plainText: "..." }
    if (typeof value === "object" && value.plainText) {
      return value.plainText;
    }

    // Handle old block format
    if (Array.isArray(value)) {
      return value
        .map((block: any) => {
          if (typeof block.content === "string") return block.content;
          if (Array.isArray(block.content)) {
            return block.content
              .map((item: any) => (typeof item === "string" ? item : item.text || ""))
              .join("");
          }
          return "";
        })
        .join("\n")
        .trim();
    }

    // Fallback for string
    if (typeof value === "string") return value;

    return "";
  };

  if (loading && !data) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" p={2}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Loading comments...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading comments: {error.message}
      </Alert>
    );
  }

  const notes = data?.listNotesByEntityId || [];
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return (
    <Box>
      {/* Comments list */}
      {sortedNotes.length > 0 && (
        <Stack spacing={2} sx={{ mb: 3 }}>
          {sortedNotes.map((note) => (
            <Box key={note._id} display="flex" gap={1.5}>
              <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                {getUserInitials(note.created_by_user)}
              </Avatar>
              <Box flex={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {getUserFullName(note.created_by_user)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(note.created_at)}
                    </Typography>
                  </Box>
                  {currentUserId === note.created_by && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(note._id)}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Box
                  sx={{
                    maxWidth: 640,
                    overflow: "auto",
                  }}
                >
                  <Note initialContent={getNoteContent(note.value)} readOnly={true} />
                </Box>
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      {/* Comment input */}
      <Box sx={{ mt: 3 }}>
        <Box
          sx={{
            display: "flex",
            border: 1,
            borderColor: "grey.300",
            borderRadius: 1,
            backgroundColor: "grey.50",
            overflow: "hidden",
            "&:focus-within": {
              borderColor: "primary.main",
              backgroundColor: "background.paper",
            },
            transition: "all 0.2s ease",
          }}
        >
          <Box sx={{ flex: 1, p: 1 }}>
            <Note
              initialContent={commentText}
              onChange={setCommentText}
              onSubmit={handleSubmitComment}
              className="min-h-[40px]"
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "stretch",
            }}
          >
            <IconButton
              onClick={handleSubmitComment}
              disabled={isSubmitting || !commentText.trim()}
              sx={{
                borderRadius: 0,
                px: 2,
                color: "grey.600",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "grey.100",
                  color: "primary.main",
                },
                "&:disabled": {
                  color: "grey.400",
                },
              }}
            >
              {isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete Comment</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this comment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotesSection;
