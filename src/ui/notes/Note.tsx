"use client";

import React from "react";

export type NoteProps = {
  initialContent?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  className?: string;
};

const Note: React.FC<NoteProps> = ({
  initialContent = "",
  readOnly = false,
  onChange,
  onSubmit,
  className,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (onSubmit) {
        onSubmit();
      }
    }
  };

  return (
    <textarea
      value={initialContent}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={readOnly}
      className={`w-full resize-none border-none focus:outline-none text-sm ${className || ""} ${
        readOnly ? "p-0 bg-transparent cursor-default" : "p-1"
      }`}
      placeholder={readOnly ? "" : "Leave a comment..."}
      rows={readOnly ? 1 : 2}
    />
  );
};

export default Note;
