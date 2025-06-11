"use client";

import type { BlockNoteEditor, PartialBlock } from "@blocknote/core";
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
  entityType?: string;
}

const NotesSection: React.FC<NotesSectionProps> = ({ entityId, entityType = "Entity" }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  // State for the input editor
  const [blocks, setBlocks] = useState<PartialBlock[]>([
    {
      type: "paragraph",
      content: "",
    },
  ]);

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
    // Remove trailing empty blocks
    let lastIndex = blocks.length;
    for (let i = blocks.length - 1; i >= 0; i--) {
      const block = blocks[i];
      const isEmpty =
        !block.content ||
        (typeof block.content === "string" && block.content.trim() === "") ||
        (Array.isArray(block.content) && block.content.length === 0);

      if (isEmpty) {
        lastIndex = i;
      } else {
        break;
      }
    }
    const nonEmptyBlocks = blocks.slice(0, lastIndex);

    // Check if there's any content left
    if (nonEmptyBlocks.length === 0) return;

    // Check if all remaining blocks are empty
    const hasContent = nonEmptyBlocks.some((block: PartialBlock) => {
      if (!block.content) return false;
      if (typeof block.content === "string") return block.content.trim() !== "";
      if (Array.isArray(block.content)) return block.content.length > 0;
      return false;
    });

    if (!hasContent) return;

    setIsSubmitting(true);
    try {
      await createNote({
        variables: {
          input: {
            parent_entity_id: entityId,
            value: nonEmptyBlocks,
          },
        },
      });
      // Reset the editor state
      setBlocks([
        {
          type: "paragraph",
          content: "",
        },
      ]);
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
      <Typography variant="h6" sx={{ mb: 2 }}>
        Comments
      </Typography>

      {/* Comments list */}
      {sortedNotes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No comments yet. Be the first to comment!
        </Typography>
      ) : (
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
                    "& .bn-container": {
                      fontSize: "14px",
                      "& .bn-editor": {
                        padding: 0,
                      },
                    },
                  }}
                >
                  <Note initialContent={note.value} readOnly={true} />
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
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            p: 1,
            backgroundColor: "background.paper",
          }}
        >
          <Note
            key={"comment-" + blocks.length}
            initialContent={undefined}
            onChange={setBlocks}
            className="min-h-[80px]"
          />
        </Box>
        <Box display="flex" justifyContent="flex-end" mt={1}>
          <Button
            variant="contained"
            size="small"
            onClick={handleSubmitComment}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} /> : <SendIcon />}
          >
            Submit
          </Button>
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
