"use client";

import { format } from "date-fns";
import { MessageSquare, Reply, Smile, Trash2 } from "lucide-react";
import React, { useState } from "react";
import {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useGetCurrentUserQuery,
  useListNotesByEntityIdQuery,
} from "./api";
import NoteReactions from "./NoteReactions";
import NoteWithSubmit from "./NoteWithSubmit";

interface NotesSectionProps {
  entityId: string;
  workspaceId: string;
}

const NotesSection: React.FC<NotesSectionProps> = ({ entityId, workspaceId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
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
  const { data: currentUserData } = useGetCurrentUserQuery();
  const currentUserId = currentUserData?.getCurrentUser?.id;

  // Helper function to check if a note is an emoji reaction
  const isEmojiReaction = (note: any): boolean => {
    return (
      typeof note.value === "object" &&
      note.value.reaction &&
      typeof note.value.reaction === "string"
    );
  };

  // Helper function to get reactions for a note
  const getReactionsForNote = (noteId: string, allNotes: any[], parentNoteId?: string): any[] => {
    const reactions: { [emoji: string]: { emoji: string; users: any[] } } = {};

    if (parentNoteId) {
      const parentNote = allNotes.find((n) => n._id === parentNoteId);
      if (!parentNote || !parentNote.sub_notes) return [];

      const reply = parentNote.sub_notes.find((sn: any) => sn._id === noteId);
      if (!reply || !reply.sub_notes) return [];

      reply.sub_notes.forEach((subNote: any) => {
        if (!subNote.deleted && isEmojiReaction(subNote)) {
          const emoji = subNote.value.reaction;
          const userId = subNote.created_by;

          if (!reactions[emoji]) {
            reactions[emoji] = { emoji, users: [] };
          }

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
    } else {
      const note = allNotes.find((n) => n._id === noteId);
      if (!note || !note.sub_notes) return [];

      note.sub_notes.forEach((subNote: any) => {
        if (!subNote.deleted && isEmojiReaction(subNote)) {
          const emoji = subNote.value.reaction;
          const userId = subNote.created_by;

          if (!reactions[emoji]) {
            reactions[emoji] = { emoji, users: [] };
          }

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
    }

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
            workspace_id: workspaceId,
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
  const handleRemoveReaction = async (noteId: string, emoji: string, parentNoteId?: string) => {
    let reactionNote = null;

    if (parentNoteId) {
      const parentNote = notes.find((n) => n._id === parentNoteId);
      if (!parentNote || !parentNote.sub_notes) return;

      const reply = parentNote.sub_notes.find((sn: any) => sn._id === noteId);
      if (!reply || !reply.sub_notes) return;

      reactionNote = reply.sub_notes.find(
        (subNote: any) =>
          !subNote.deleted &&
          isEmojiReaction(subNote) &&
          subNote.value.reaction === emoji &&
          subNote.created_by === currentUserId,
      );
    } else {
      const note = notes.find((n) => n._id === noteId);
      if (!note || !note.sub_notes) return;

      reactionNote = note.sub_notes.find(
        (subNote: any) =>
          !subNote.deleted &&
          isEmojiReaction(subNote) &&
          subNote.value.reaction === emoji &&
          subNote.created_by === currentUserId,
      );
    }

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
            workspace_id: workspaceId,
            value: { plainText: trimmedText },
          },
        },
      });
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
            parent_entity_id: noteId,
            workspace_id: workspaceId,
            value: { plainText: trimmedText },
          },
        },
      });
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

    if (typeof value === "object" && value.plainText) {
      return value.plainText;
    }

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

    if (typeof value === "string") return value;

    return "";
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-sm text-gray-600">Loading comments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">Error loading comments: {error.message}</p>
      </div>
    );
  }

  const notes = data?.listNotesByEntityId || [];
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  // Render a single note with its replies
  const renderNote = (note: any, isReply = false, parentNoteId?: string) => {
    if (isEmojiReaction(note)) return null;

    const reactions = getReactionsForNote(note._id, notes, isReply ? parentNoteId : undefined);
    const isHovered = hoveredNoteId === note._id;
    const canDelete = currentUserId === note.created_by_user?.id;

    return (
      <div key={note._id} className={isReply ? "" : "mb-1.5"}>
        <div
          className={`group relative transition-all duration-200 ${
            isReply
              ? ""
              : "bg-white border border-gray-200 hover:border-blue-200 hover:shadow-sm rounded-xl p-4"
          }`}
          onMouseEnter={() => setHoveredNoteId(note._id)}
          onMouseLeave={() => setHoveredNoteId(null)}
        >
          <div className={`flex ${isReply ? "gap-3" : "gap-4"}`}>
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div
                className={`${isReply ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"} rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-blue-100`}
              >
                {getUserInitials(note.created_by_user)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className={`flex items-start justify-between ${isReply ? "mb-1.5" : "mb-2"}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">
                    {getUserFullName(note.created_by_user)}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {formatDate(note.created_at)}
                  </span>
                </div>

                {/* Action buttons */}
                <div
                  className={`flex items-center gap-0.5 transition-opacity duration-200 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <NoteReactions
                    noteId={note._id}
                    reactions={reactions}
                    currentUserId={currentUserId || ""}
                    onReactionChange={async (updatedReactions) => {
                      const currentEmojis = reactions.map((r) => r.emoji);
                      const updatedEmojis = updatedReactions.map((r) => r.emoji);

                      const addedEmojis = updatedEmojis.filter(
                        (emoji) => !currentEmojis.includes(emoji),
                      );
                      for (const emoji of addedEmojis) {
                        await handleEmojiReaction(note._id, emoji);
                      }

                      const removedEmojis = currentEmojis.filter(
                        (emoji) => !updatedEmojis.includes(emoji),
                      );
                      for (const emoji of removedEmojis) {
                        await handleRemoveReaction(
                          note._id,
                          emoji,
                          isReply ? parentNoteId : undefined,
                        );
                      }
                    }}
                    showPicker={true}
                  />

                  <button
                    onClick={() =>
                      handleReplyClick(isReply && parentNoteId ? parentNoteId : note._id)
                    }
                    className="p-2 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105"
                    title="Reply to this comment"
                  >
                    <Reply className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteClick(note._id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105"
                      title="Delete this comment"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Comment text */}
              <div
                className={`${isReply ? "text-sm" : "text-[15px]"} leading-relaxed text-gray-800 whitespace-pre-wrap break-words`}
              >
                {getNoteContent(note.value)}
              </div>

              {/* Reactions display */}
              {reactions.length > 0 && (
                <div className={isReply ? "mt-1.5" : "mt-2"}>
                  <NoteReactions
                    noteId={note._id}
                    reactions={reactions}
                    currentUserId={currentUserId || ""}
                    onReactionChange={async (updatedReactions) => {
                      const currentEmojis = reactions.map((r) => r.emoji);
                      const updatedEmojis = updatedReactions.map((r) => r.emoji);

                      const addedEmojis = updatedEmojis.filter(
                        (emoji) => !currentEmojis.includes(emoji),
                      );
                      for (const emoji of addedEmojis) {
                        await handleEmojiReaction(note._id, emoji);
                      }

                      const removedEmojis = currentEmojis.filter(
                        (emoji) => !updatedEmojis.includes(emoji),
                      );
                      for (const emoji of removedEmojis) {
                        await handleRemoveReaction(
                          note._id,
                          emoji,
                          isReply ? parentNoteId : undefined,
                        );
                      }
                    }}
                    showPicker={false}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Render replies inside the parent card */}
          {!isReply && note.sub_notes && note.sub_notes.length > 0 && (
            <div className="mt-3 bg-gray-50/50 rounded-lg p-3">
              {note.sub_notes
                .filter((reply: any) => !reply.deleted && !isEmojiReaction(reply))
                .sort(
                  (a: any, b: any) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                )
                .map((reply: any, index: any) => (
                  <div
                    key={reply._id}
                    className={index > 0 ? "mt-3 pt-3 border-t border-gray-200/50" : ""}
                    onMouseEnter={() => setHoveredNoteId(reply._id)}
                    onMouseLeave={() => setHoveredNoteId(null)}
                  >
                    {renderNote(reply, true, note._id)}
                  </div>
                ))}
            </div>
          )}

          {/* Reply input - now inside the card */}
          {!isReply && replyingTo === note._id && (
            <div className="mt-3 bg-gray-50/50 rounded-lg p-3">
              <NoteWithSubmit
                initialContent={replyText}
                onChange={setReplyText}
                onSubmit={() => replyingTo && handleSubmitReply(replyingTo)}
                isSubmitting={isSubmitting}
              />
              <button
                onClick={handleCancelReply}
                className="mt-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Comments list */}
      {sortedNotes.length > 0 ? (
        <div className="space-y-0 mb-6">{sortedNotes.map((note) => renderNote(note))}</div>
      ) : (
        <div className="text-center py-12 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 mb-4">
            <MessageSquare className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No comments yet</h3>
          <p className="text-sm text-gray-500">
            Start the conversation by adding the first comment
          </p>
        </div>
      )}

      {/* Comment input */}
      {!replyingTo && (
        <div>
          <NoteWithSubmit
            initialContent={commentText}
            onChange={setCommentText}
            onSubmit={handleSubmitComment}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Comment</h3>
                  <p className="text-sm text-gray-500">This action is permanent</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to delete this comment? This action cannot be undone and the
                comment will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-red-500/30"
                >
                  Delete Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesSection;
