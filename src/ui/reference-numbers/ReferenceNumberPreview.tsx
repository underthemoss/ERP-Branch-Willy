"use client";

import { Box, Chip, Typography } from "@mui/material";
import * as React from "react";

interface ReferenceNumberPreviewProps {
  template: string;
  seqPadding?: number;
  startAt?: number;
  projectCode?: string;
  parentProjectCode?: string;
}

export default function ReferenceNumberPreview({
  template,
  seqPadding = 4,
  startAt = 1,
  projectCode,
  parentProjectCode,
}: ReferenceNumberPreviewProps) {
  const generatePreview = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    // Generate sequence number with padding
    const seqStr = String(startAt).padStart(seqPadding, "0");

    // Replace template tokens with individual date segments and project codes
    return template
      .replace(/\{YYYY\}/g, String(year))
      .replace(/\{YY\}/g, String(year).slice(-2))
      .replace(/\{MM\}/g, month)
      .replace(/\{DD\}/g, day)
      .replace(/\{seq\}/g, seqStr)
      .replace(/\{projectCode\}/g, projectCode || "PROJECT123")
      .replace(/\{parentProjectCode\}/g, parentProjectCode || "PARENT456");
  };

  const preview = generatePreview();

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Preview:
      </Typography>
      <Chip
        label={preview}
        variant="outlined"
        sx={{
          fontFamily: "monospace",
          fontWeight: 600,
          fontSize: "0.875rem",
          bgcolor: "background.paper",
        }}
      />
    </Box>
  );
}
