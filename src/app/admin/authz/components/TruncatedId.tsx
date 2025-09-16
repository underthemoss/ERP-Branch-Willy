"use client";

import { Box, Tooltip, Typography } from "@mui/joy";

interface TruncatedIdProps {
  id: string;
  maxLength?: number;
  showCopyButton?: boolean;
}

export function TruncatedId({ id, maxLength = 20, showCopyButton = false }: TruncatedIdProps) {
  const shouldTruncate = id.length > maxLength;
  const displayId = shouldTruncate ? `${id.slice(0, maxLength)}...` : id;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
  };

  const content = (
    <Typography
      component="span"
      sx={{
        fontFamily: "monospace",
        fontSize: 12,
        fontWeight: 500,
        cursor: shouldTruncate ? "help" : "default",
      }}
    >
      {displayId}
    </Typography>
  );

  if (shouldTruncate) {
    return (
      <Tooltip title={id} placement="top">
        {content}
      </Tooltip>
    );
  }

  return content;
}
