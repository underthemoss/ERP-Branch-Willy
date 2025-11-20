"use client";

import { Send } from "lucide-react";
import React from "react";
import Note, { NoteProps } from "./Note";

interface NoteWithSubmitProps extends NoteProps {
  isSubmitting?: boolean;
}

const NoteWithSubmit: React.FC<NoteWithSubmitProps> = ({
  isSubmitting = false,
  initialContent = "",
  onChange,
  onSubmit,
  ...props
}) => {
  return (
    <div className="flex items-stretch border-2 border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all duration-200 shadow-sm hover:shadow-md">
      <div className="flex-1 p-3">
        <Note
          initialContent={initialContent}
          onChange={onChange}
          onSubmit={onSubmit}
          className="min-h-[48px]"
          {...props}
        />
      </div>
      <div className="flex items-center border-l border-gray-200">
        <button
          onClick={onSubmit}
          disabled={isSubmitting || !initialContent?.trim()}
          className="h-full px-5 text-gray-400 hover:text-white hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200 group"
          title="Send (Cmd/Ctrl + Enter)"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          ) : (
            <Send className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          )}
        </button>
      </div>
    </div>
  );
};

export default NoteWithSubmit;
