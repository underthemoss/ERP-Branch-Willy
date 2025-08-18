"use client";

import { Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { formatDate, getItemDescription } from "./utils";

interface InventoryReceiptTimelineProps {
  receivedItems: any[];
}

interface ReceiptItem {
  date: string;
  user: string;
  items: any[];
  lineItemId: string | null;
  conditionOnReceipt?: string;
  receiptNotes?: string;
  conditionNotes?: string;
}

interface DayGroup {
  date: string;
  receipts: ReceiptItem[];
}

export default function InventoryReceiptTimeline({ receivedItems }: InventoryReceiptTimelineProps) {
  // Group received items by day, then by receipt event
  const timelineEntries = useMemo(() => {
    const receiptEvents = new Map<string, ReceiptItem>();

    // First, group by receipt event (date + user + lineItem)
    receivedItems.forEach((item) => {
      const date = item.receivedAt || item.updatedAt || item.createdAt;
      const user = item.createdByUser
        ? `${item.createdByUser.firstName} ${item.createdByUser.lastName}`
        : item.createdBy || "Unknown User";
      const lineItemId = item.purchaseOrderLineItemId;

      const key = `${date}-${user}-${lineItemId}`;

      if (!receiptEvents.has(key)) {
        receiptEvents.set(key, {
          date,
          user,
          items: [],
          lineItemId,
          conditionOnReceipt: item.conditionOnReceipt,
          receiptNotes: item.receiptNotes,
          conditionNotes: item.conditionNotes,
        });
      }

      receiptEvents.get(key)!.items.push(item);
    });

    // Then group by day
    const dayGroups = new Map<string, DayGroup>();

    receiptEvents.forEach((receipt) => {
      const dayKey = new Date(receipt.date).toDateString();

      if (!dayGroups.has(dayKey)) {
        dayGroups.set(dayKey, {
          date: receipt.date,
          receipts: [],
        });
      }

      dayGroups.get(dayKey)!.receipts.push(receipt);
    });

    // Convert to array and sort by date (newest first)
    return Array.from(dayGroups.values())
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      })
      .map((group) => ({
        ...group,
        // Sort receipts within each day by time (newest first)
        receipts: group.receipts.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateB - dateA;
        }),
      }));
  }, [receivedItems]);

  if (timelineEntries.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No receipt history available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      {timelineEntries.map((dayGroup, dayIndex) => (
        <Box
          key={dayIndex}
          sx={{
            display: "grid",
            gridTemplateColumns: "120px 1px 1fr",
            gap: 3,
            mb: 3,
            position: "relative",
          }}
        >
          {/* Date on the left */}
          <Box sx={{ textAlign: "right", pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {formatDate(dayGroup.date)}
            </Typography>
          </Box>

          {/* Divider in the middle */}
          <Box
            sx={{
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                bottom: dayIndex === timelineEntries.length - 1 ? "50%" : "-24px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "2px",
                bgcolor: "divider",
                backgroundColor: "divider",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                top: "12px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                bgcolor: "success.main",
                backgroundColor: "success.main",
              },
            }}
          />

          {/* Cards on the right */}
          <Stack spacing={2}>
            {dayGroup.receipts.map((receipt, receiptIndex) => (
              <Paper key={receiptIndex} elevation={2} sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  {/* Header with user */}
                  <Box>
                    <Typography variant="subtitle2" component="span">
                      {receipt.items.length} item{receipt.items.length !== 1 ? "s" : ""} received
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      by {receipt.user}
                    </Typography>
                  </Box>

                  {receipt.lineItemId && (
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: "monospace", color: "text.secondary" }}
                    >
                      Line Item: {receipt.lineItemId.slice(-8)}
                    </Typography>
                  )}

                  {/* Items list */}
                  <Box sx={{ pl: 1 }}>
                    {receipt.items.slice(0, 3).map((item, itemIndex) => (
                      <Typography
                        key={itemIndex}
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        • {getItemDescription(item)}
                        {item.assetId && ` (Asset: ${item.assetId})`}
                      </Typography>
                    ))}
                    {receipt.items.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        ... and {receipt.items.length - 3} more
                      </Typography>
                    )}
                  </Box>

                  {/* Condition and notes */}
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                    {receipt.conditionOnReceipt && (
                      <Chip
                        label={`Condition: ${receipt.conditionOnReceipt.replace("_", " ")}`}
                        size="small"
                        color={receipt.conditionOnReceipt === "NEW" ? "success" : "default"}
                      />
                    )}

                    {receipt.receiptNotes && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        Receipt Notes: {receipt.receiptNotes}
                      </Typography>
                    )}

                    {receipt.conditionNotes && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        Condition Notes: {receipt.conditionNotes}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
