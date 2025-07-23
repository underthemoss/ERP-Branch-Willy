"use client";

import SendIcon from "@mui/icons-material/Send";
import { Box, CircularProgress, IconButton } from "@mui/material";
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
          initialContent={initialContent}
          onChange={onChange}
          onSubmit={onSubmit}
          className="min-h-[40px]"
          {...props}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <IconButton
          onClick={onSubmit}
          disabled={isSubmitting || !initialContent?.trim()}
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
  );
};

export default NoteWithSubmit;
