"use client";

import { Box, Chip, Typography } from "@mui/material";
import * as React from "react";
import { generateReferenceNumberPreview } from "./generateReferenceNumberPreview";

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
  const preview = generateReferenceNumberPreview({
    template,
    seqPadding,
    startAt,
    projectCode,
    parentProjectCode,
  });

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
