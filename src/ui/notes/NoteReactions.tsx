"use client";

import { format } from "date-fns";
import Picker from "emoji-picker-react";
import { Smile } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface ReactionUser {
  id: string;
  name: string;
  timestamp: string;
}

interface Reaction {
  emoji: string;
  users: ReactionUser[] | string[];
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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };

    if (isPickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isPickerOpen]);

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

    const existingReactionIndex = updatedReactions.findIndex((r) => r.emoji === emoji);

    if (existingReactionIndex >= 0) {
      const reaction = updatedReactions[existingReactionIndex];
      const userIds = getUserIds(reaction);
      const userIndex = userIds.indexOf(currentUserId);

      if (userIndex >= 0) {
        if (isDetailedUsers(reaction.users)) {
          reaction.users = reaction.users.filter((u) => u.id !== currentUserId);
        } else {
          reaction.users = reaction.users.filter((id) => id !== currentUserId);
        }

        if (reaction.users.length === 0) {
          updatedReactions.splice(existingReactionIndex, 1);
        }
      } else {
        if (isDetailedUsers(reaction.users)) {
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
      updatedReactions.push({
        emoji,
        users: [currentUserId],
      });
    }

    setIsPickerOpen(false);

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
        if (isDetailedUsers(reaction.users)) {
          reaction.users = reaction.users.filter((u) => u.id !== currentUserId);
        } else {
          reaction.users = reaction.users.filter((id) => id !== currentUserId);
        }

        if (reaction.users.length === 0) {
          updatedReactions.splice(reactionIndex, 1);
        }
      } else {
        if (isDetailedUsers(reaction.users)) {
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
    return (
      <div className="relative inline-block" ref={pickerRef}>
        <button
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
          title="Add reaction"
        >
          <Smile className="w-4 h-4 text-gray-500 hover:text-blue-600" />
        </button>

        {isPickerOpen && (
          <div className="absolute top-full left-0 mt-2 z-50 shadow-xl rounded-lg overflow-hidden">
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
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {reactions.map((reaction) => {
        const isUserReacted = getUserReactionStatus(reaction.emoji);
        return (
          <button
            key={reaction.emoji}
            onClick={() => handleReactionClick(reaction.emoji)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer hover:scale-105 shadow-sm ${
              isUserReacted
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-2 border-blue-300 hover:border-blue-400 hover:shadow-md"
                : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-100"
            }`}
          >
            <span className="text-base">{reaction.emoji}</span>
            <span className="text-xs">{reaction.users.length}</span>
          </button>
        );
      })}
    </div>
  );
};

export default NoteReactions;
