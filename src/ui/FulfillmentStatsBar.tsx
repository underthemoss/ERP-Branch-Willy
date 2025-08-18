"use client";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import { Box, Typography } from "@mui/material";

interface FulfillmentStatsBarProps {
  totalItems: number;
  receivedItems: number;
  pendingItems?: number; // Optional, will calculate if not provided
}

export default function FulfillmentStatsBar({
  totalItems,
  receivedItems,
  pendingItems,
}: FulfillmentStatsBarProps) {
  const pending = pendingItems ?? totalItems - receivedItems;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 3,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Inventory2Icon color="primary" fontSize="small" />
        <Typography variant="body2" color="text.secondary">
          {totalItems} total items
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CheckCircleIcon color="success" fontSize="small" />
        <Typography variant="body2" color="text.secondary">
          {receivedItems} items received
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AccessTimeIcon color="warning" fontSize="small" />
        <Typography variant="body2" color="text.secondary">
          {pending} items pending
        </Typography>
      </Box>
    </Box>
  );
}
