"use client";

import AddReactionIcon from "@mui/icons-material/AddReaction";
import { Box, Chip, IconButton, Popover, Tooltip } from "@mui/material";
import { format } from "date-fns";
import Picker from "emoji-picker-react";
import React, { useState } from "react";

interface ReactionUser {
  id: string;
  name: string;
  timestamp: string;
}

interface Reaction {
  emoji: string;
  users: ReactionUser[] | string[]; // Can be either detailed users or just IDs for backward compatibility
}

interface NoteReactionsProps {
  noteId: string;
  reactions?: Reaction[];
  currentUserId?: string;
  onReactionChange?: (reactions: Reaction[]) => void;
  showPicker?: boolean;
}

const NoteReactions: React.FC<NoteReactionsProps> = ({
  noteId,
  reactions = [],
  currentUserId = "",
  onReactionChange,
  showPicker = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // Helper to check if users array contains detailed user info
  const isDetailedUsers = (users: ReactionUser[] | string[]): users is ReactionUser[] => {
    return users.length > 0 && typeof users[0] === "object";
  };

  // Helper to get user IDs from reaction
  const getUserIds = (reaction: Reaction): string[] => {
    if (isDetailedUsers(reaction.users)) {
      return reaction.users.map((u) => u.id);
    }
    return reaction.users;
  };

  // Helper to format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "MMM d 'at' h:mm a");
    } catch {
      return "";
    }
  };

  // Helper to generate tooltip content
  const getTooltipContent = (reaction: Reaction): string => {
    if (isDetailedUsers(reaction.users)) {
      return reaction.users
        .map((user) => `${user.name} - ${formatTimestamp(user.timestamp)}`)
        .join("\n");
    }
    return `${reaction.users.length} ${reaction.users.length === 1 ? "person" : "people"} reacted`;
  };

  const handleReaction = (emojiData: any) => {
    const emoji = emojiData.emoji;
    const updatedReactions = [...reactions];

    // Check if this emoji already exists
    const existingReactionIndex = updatedReactions.findIndex((r) => r.emoji === emoji);

    if (existingReactionIndex >= 0) {
      // Emoji exists, toggle user
      const reaction = updatedReactions[existingReactionIndex];
      const userIds = getUserIds(reaction);
      const userIndex = userIds.indexOf(currentUserId);

      if (userIndex >= 0) {
        // User already reacted, remove them
        if (isDetailedUsers(reaction.users)) {
          reaction.users = reaction.users.filter((u) => u.id !== currentUserId);
        } else {
          reaction.users = reaction.users.filter((id) => id !== currentUserId);
        }

        // If no users left, remove the reaction
        if (reaction.users.length === 0) {
          updatedReactions.splice(existingReactionIndex, 1);
        }
      } else {
        // Add user to existing reaction
        if (isDetailedUsers(reaction.users)) {
          // This shouldn't happen in practice, but handle it gracefully
          reaction.users.push({
            id: currentUserId,
            name: "You",
            timestamp: new Date().toISOString(),
          });
        } else {
          reaction.users.push(currentUserId);
        }
      }
    } else {
      // New reaction
      updatedReactions.push({
        emoji,
        users: [currentUserId],
      });
    }

    handleClose();

    if (onReactionChange) {
      onReactionChange(updatedReactions);
    }
  };

  const handleReactionClick = (emoji: string) => {
    const updatedReactions = [...reactions];
    const reactionIndex = updatedReactions.findIndex((r) => r.emoji === emoji);

    if (reactionIndex >= 0) {
      const reaction = updatedReactions[reactionIndex];
      const userIds = getUserIds(reaction);
      const userIndex = userIds.indexOf(currentUserId);

      if (userIndex >= 0) {
        // User already reacted, remove them
        if (isDetailedUsers(reaction.users)) {
          reaction.users = reaction.users.filter((u) => u.id !== currentUserId);
        } else {
          reaction.users = reaction.users.filter((id) => id !== currentUserId);
        }

        // If no users left, remove the reaction
        if (reaction.users.length === 0) {
          updatedReactions.splice(reactionIndex, 1);
        }
      } else {
        // Add user to existing reaction
        if (isDetailedUsers(reaction.users)) {
          // This shouldn't happen in practice, but handle it gracefully
          reaction.users.push({
            id: currentUserId,
            name: "You",
            timestamp: new Date().toISOString(),
          });
        } else {
          reaction.users.push(currentUserId);
        }
      }

      if (onReactionChange) {
        onReactionChange(updatedReactions);
      }
    }
  };

  const getUserReactionStatus = (emoji: string): boolean => {
    const reaction = reactions.find((r) => r.emoji === emoji);
    if (!reaction) return false;
    const userIds = getUserIds(reaction);
    return userIds.includes(currentUserId);
  };

  if (showPicker) {
    // Return just the picker button when used inline with actions
    return (
      <>
        <Tooltip title="Add reaction">
          <IconButton size="small" onClick={handleClick} sx={{ ml: 1 }}>
            <AddReactionIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Emoji picker popover */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          sx={{
            "& .MuiPaper-root": {
              backgroundColor: "transparent",
              boxShadow: "none",
              border: "none",
              overflow: "visible",
            },
          }}
        >
          <Box>
            <Picker
              reactionsDefaultOpen={true}
              onReactionClick={handleReaction}
              onEmojiClick={handleReaction}
              height={250}
              width={280}
              previewConfig={{ showPreview: false }}
              searchDisabled
              skinTonesDisabled
            />
          </Box>
        </Popover>
      </>
    );
  }

  // Return the reactions display
  return (
    <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
      {/* Display existing reactions */}
      {reactions.map((reaction) => (
        <Tooltip
          key={reaction.emoji}
          title={getTooltipContent(reaction)}
          sx={{
            "& .MuiTooltip-tooltip": {
              whiteSpace: "pre-line",
              maxWidth: "none",
            },
          }}
        >
          <Chip
            label={`${reaction.emoji} ${reaction.users.length}`}
            size="small"
            onClick={() => handleReactionClick(reaction.emoji)}
            color={getUserReactionStatus(reaction.emoji) ? "primary" : "default"}
            variant={getUserReactionStatus(reaction.emoji) ? "filled" : "outlined"}
            sx={{
              height: 24,
              fontSize: "0.875rem",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: getUserReactionStatus(reaction.emoji)
                  ? "primary.dark"
                  : "action.hover",
              },
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
};

export default NoteReactions;
