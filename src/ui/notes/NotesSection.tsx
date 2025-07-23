"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import ReplyIcon from "@mui/icons-material/Reply";
import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
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
import NoteReactions from "./NoteReactions";
import NoteWithSubmit from "./NoteWithSubmit";

interface NotesSectionProps {
  entityId: string;
}

const NotesSection: React.FC<NotesSectionProps> = ({ entityId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);

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

  // Helper function to check if a note is an emoji reaction
  const isEmojiReaction = (note: any): boolean => {
    return (
      typeof note.value === "object" &&
      note.value.reaction &&
      typeof note.value.reaction === "string"
    );
  };

  // Helper function to get reactions for a note
  const getReactionsForNote = (noteId: string, allNotes: any[]): any[] => {
    const reactions: { [emoji: string]: { emoji: string; users: any[] } } = {};

    // Find the note
    const note = allNotes.find((n) => n._id === noteId);
    if (!note || !note.sub_notes) return [];

    // Process sub_notes to find reactions
    note.sub_notes.forEach((subNote: any) => {
      if (!subNote.deleted && isEmojiReaction(subNote)) {
        const emoji = subNote.value.reaction;
        const userId = subNote.created_by;

        if (!reactions[emoji]) {
          reactions[emoji] = { emoji, users: [] };
        }

        // Check if user already exists in this reaction
        const existingUser = reactions[emoji].users.find((u: any) => u.id === userId);
        if (!existingUser) {
          reactions[emoji].users.push({
            id: userId,
            name: getUserFullName(subNote.created_by_user),
            timestamp: subNote.created_at,
          });
        }
      }
    });

    return Object.values(reactions);
  };

  // Handle emoji reaction
  const handleEmojiReaction = async (noteId: string, emoji: string) => {
    setIsSubmitting(true);
    try {
      await createNote({
        variables: {
          input: {
            parent_entity_id: noteId,
            value: { reaction: emoji },
          },
        },
      });
    } catch (error) {
      console.error("Failed to create reaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle removing emoji reaction
  const handleRemoveReaction = async (noteId: string, emoji: string) => {
    // Find the reaction note to delete
    const note = notes.find((n) => n._id === noteId);
    if (!note || !note.sub_notes) return;

    const reactionNote = note.sub_notes.find(
      (subNote: any) =>
        !subNote.deleted &&
        isEmojiReaction(subNote) &&
        subNote.value.reaction === emoji &&
        subNote.created_by === currentUserId,
    );

    if (reactionNote) {
      try {
        await deleteNote({
          variables: { id: reactionNote._id },
        });
      } catch (error) {
        console.error("Failed to delete reaction:", error);
      }
    }
  };

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

  // Handle submit reply
  const handleSubmitReply = async (noteId: string) => {
    const trimmedText = replyText.trim();
    if (!trimmedText) return;

    setIsSubmitting(true);
    try {
      await createNote({
        variables: {
          input: {
            parent_entity_id: noteId, // Use the note ID directly
            value: { plainText: trimmedText },
          },
        },
      });
      // Reset the reply state
      setReplyText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to create reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reply click
  const handleReplyClick = (noteId: string) => {
    setReplyingTo(noteId);
    setReplyText("");
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
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

  // Render a single note with its replies
  const renderNote = (note: any, isReply = false, parentNoteId?: string) => {
    // Don't render emoji reactions as regular notes
    if (isEmojiReaction(note)) return null;

    const reactions = getReactionsForNote(note._id, notes);

    return (
      <Box key={note._id}>
        <Card
          onMouseEnter={(e) => {
            e.stopPropagation();
            setHoveredNoteId(note._id);
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            setHoveredNoteId(null);
          }}
          sx={{
            p: 1,
            boxShadow: 0,
            border: "none",
          }}
        >
          <Box display="flex" gap={1}>
            <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
              {getUserInitials(note.created_by_user)}
            </Avatar>
            <Box flex={1}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.25}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="body2" fontWeight={600}>
                    {getUserFullName(note.created_by_user)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(note.created_at)}
                  </Typography>
                </Box>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  sx={{
                    opacity: hoveredNoteId === note._id ? 1 : 0,
                    transition: "opacity 0.2s ease-in-out",
                  }}
                >
                  {/* Reaction picker button */}
                  <NoteReactions
                    noteId={note._id}
                    reactions={reactions}
                    currentUserId={currentUserId || ""}
                    onReactionChange={async (updatedReactions) => {
                      // Find which reactions changed
                      const currentEmojis = reactions.map((r) => r.emoji);
                      const updatedEmojis = updatedReactions.map((r) => r.emoji);

                      // Find added reactions
                      const addedEmojis = updatedEmojis.filter(
                        (emoji) => !currentEmojis.includes(emoji),
                      );
                      for (const emoji of addedEmojis) {
                        await handleEmojiReaction(note._id, emoji);
                      }

                      // Find removed reactions
                      const removedEmojis = currentEmojis.filter(
                        (emoji) => !updatedEmojis.includes(emoji),
                      );
                      for (const emoji of removedEmojis) {
                        await handleRemoveReaction(note._id, emoji);
                      }
                    }}
                    showPicker={true}
                  />
                  <Tooltip title="Reply to this comment">
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleReplyClick(isReply && parentNoteId ? parentNoteId : note._id)
                      }
                      sx={{ ml: 1 }}
                    >
                      <ReplyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {currentUserId === note.created_by && (
                    <Tooltip title="Delete this comment">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(note._id)}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              <Box
                sx={{
                  overflow: "auto",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {getNoteContent(note.value)}
                </Typography>
              </Box>
              {/* Reactions display */}
              {reactions.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <NoteReactions
                    noteId={note._id}
                    reactions={reactions}
                    currentUserId={currentUserId || ""}
                    onReactionChange={async (updatedReactions) => {
                      // Find which reactions changed
                      const currentEmojis = reactions.map((r) => r.emoji);
                      const updatedEmojis = updatedReactions.map((r) => r.emoji);

                      // Find added reactions
                      const addedEmojis = updatedEmojis.filter(
                        (emoji) => !currentEmojis.includes(emoji),
                      );
                      for (const emoji of addedEmojis) {
                        await handleEmojiReaction(note._id, emoji);
                      }

                      // Find removed reactions
                      const removedEmojis = currentEmojis.filter(
                        (emoji) => !updatedEmojis.includes(emoji),
                      );
                      for (const emoji of removedEmojis) {
                        await handleRemoveReaction(note._id, emoji);
                      }
                    }}
                    showPicker={false}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Card>

        {/* Render replies */}
        {note.sub_notes && note.sub_notes.length > 0 && (
          <Box sx={{ mt: 1, ml: 3, borderLeft: "2px solid", borderColor: "divider", pl: 1.5 }}>
            <Stack spacing={1}>
              {note.sub_notes
                .filter((reply: any) => !reply.deleted && !isEmojiReaction(reply))
                .sort(
                  (a: any, b: any) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                )
                .map((reply: any) => renderNote(reply, true, note._id))}
            </Stack>
          </Box>
        )}

        {/* Reply input */}
        {replyingTo === note._id && (
          <Box sx={{ mt: 1 }}>
            <NoteWithSubmit
              initialContent={replyText}
              onChange={setReplyText}
              onSubmit={() => replyingTo && handleSubmitReply(replyingTo)}
              isSubmitting={isSubmitting}
            />
            <Button size="small" onClick={handleCancelReply} sx={{ mt: 1 }}>
              Cancel
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Comments list */}
      {sortedNotes.length > 0 && (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {sortedNotes.map((note) => renderNote(note))}
        </Stack>
      )}

      {/* Comment input - hide when replying */}
      {!replyingTo && (
        <Box sx={{ mt: 2 }}>
          <NoteWithSubmit
            initialContent={commentText}
            onChange={setCommentText}
            onSubmit={handleSubmitComment}
            isSubmitting={isSubmitting}
          />
        </Box>
      )}

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
