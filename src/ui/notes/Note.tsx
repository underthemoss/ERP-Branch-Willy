"use client";

import { TextField } from "@mui/material";
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (onSubmit) {
        onSubmit();
      }
    }
  };

  return (
    <TextField
      multiline
      fullWidth
      value={initialContent}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={readOnly}
      className={className}
      variant="outlined"
      placeholder={readOnly ? "" : "Leave a comment..."}
      minRows={readOnly ? 1 : 1}
      sx={{
        "& .MuiOutlinedInput-root": {
          padding: readOnly ? 0 : undefined,
          "& fieldset": {
            border: "none",
          },
        },
        "& .MuiInputBase-input": {
          fontSize: "14px",
          padding: readOnly ? 0 : "4px 8px",
        },
      }}
    />
  );
};

export default Note;
