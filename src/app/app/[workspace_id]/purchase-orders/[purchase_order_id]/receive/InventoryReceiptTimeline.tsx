"use client";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import NoteAltOutlinedIcon from "@mui/icons-material/NoteAltOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { formatDate, getItemDescription } from "./utils";

interface InventoryReceiptTimelineProps {
  receivedItems: any[];
  expandAll?: boolean;
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

export default function InventoryReceiptTimeline({
  receivedItems,
  expandAll = false,
}: InventoryReceiptTimelineProps) {
  const theme = useTheme();
  const [expandedPanels, setExpandedPanels] = useState<string[]>([]);

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

  // Effect to handle expand all
  useEffect(() => {
    if (expandAll) {
      // Generate all panel IDs
      const allPanelIds: string[] = [];
      timelineEntries.forEach((dayGroup, dayIndex) => {
        dayGroup.receipts.forEach((_, receiptIndex) => {
          allPanelIds.push(`receipt-${dayIndex}-${receiptIndex}`);
        });
      });
      setExpandedPanels(allPanelIds);
    } else {
      setExpandedPanels([]);
    }
  }, [expandAll, timelineEntries]);

  const handleAccordionChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedPanels((prev) =>
        isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel),
      );
    };

  const getConditionIcon = (condition?: string) => {
    switch (condition) {
      case "NEW":
        return <CheckCircleOutlineIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />;
      case "DAMAGED":
        return <ErrorOutlineIcon sx={{ fontSize: 20, color: theme.palette.error.main }} />;
      case "USED":
        return <WarningAmberIcon sx={{ fontSize: 20, color: theme.palette.warning.main }} />;
      default:
        return <InfoOutlinedIcon sx={{ fontSize: 20, color: theme.palette.grey[500] }} />;
    }
  };

  const getConditionColor = (condition?: string): "success" | "error" | "warning" | "default" => {
    switch (condition) {
      case "NEW":
        return "success";
      case "DAMAGED":
        return "error";
      case "USED":
        return "warning";
      default:
        return "default";
    }
  };

  if (timelineEntries.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: "center",
          bgcolor: theme.palette.grey[50],
          borderRadius: 2,
        }}
      >
        <LocalShippingOutlinedIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Receipt History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Items will appear here once they are received
        </Typography>
      </Paper>
    );
  }

  let receiptCounter = 0;

  return (
    <Box>
      <Stack spacing={2}>
        {timelineEntries.map((dayGroup, dayIndex) => (
          <Box key={dayIndex}>
            {/* Date Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 1.5,
                gap: 2,
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 0.5,
                  bgcolor: theme.palette.primary.main,
                  color: "white",
                  borderRadius: 1,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                {formatDate(dayGroup.date)}
              </Box>
              <Divider sx={{ flex: 1 }} />
            </Box>

            {/* Receipt Cards */}
            <Stack spacing={1.5} sx={{ ml: { xs: 0, sm: 2 } }}>
              {dayGroup.receipts.map((receipt, receiptIndex) => {
                receiptCounter++;
                const panelId = `receipt-${dayIndex}-${receiptIndex}`;
                const isExpanded = expandedPanels.includes(panelId);
                const hasIssues = receipt.conditionOnReceipt === "DAMAGED";

                return (
                  <Paper
                    key={receiptIndex}
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      overflow: "hidden",
                      position: "relative",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        bgcolor: hasIssues
                          ? theme.palette.error.main
                          : receipt.conditionOnReceipt === "NEW"
                            ? theme.palette.success.main
                            : theme.palette.grey[400],
                      },
                    }}
                  >
                    <Accordion
                      expanded={isExpanded}
                      onChange={handleAccordionChange(panelId)}
                      elevation={0}
                      sx={{
                        "&:before": { display: "none" },
                        bgcolor: "transparent",
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          px: 2.5,
                          py: 1.5,
                          minHeight: 64,
                          "&:hover": {
                            bgcolor: theme.palette.action.hover,
                          },
                          "& .MuiAccordionSummary-content": {
                            my: 0,
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                          {/* Icon Circle */}
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: theme.palette.grey[100],
                              border: `2px solid ${theme.palette.grey[300]}`,
                            }}
                          >
                            {getConditionIcon(receipt.conditionOnReceipt)}
                          </Avatar>

                          {/* Main Content */}
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {receipt.items.length} item{receipt.items.length !== 1 ? "s" : ""}{" "}
                                received
                              </Typography>
                              {receipt.conditionOnReceipt && (
                                <Chip
                                  label={receipt.conditionOnReceipt}
                                  size="small"
                                  color={getConditionColor(receipt.conditionOnReceipt)}
                                  sx={{ height: 22 }}
                                />
                              )}
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                <PersonOutlineIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                <Typography variant="caption" color="text.secondary">
                                  by {receipt.user}
                                </Typography>
                              </Box>
                              {receipt.lineItemId && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: "monospace",
                                    color: "text.secondary",
                                    bgcolor: theme.palette.grey[100],
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 0.5,
                                  }}
                                >
                                  Line Item: {receipt.lineItemId.slice(-8).toUpperCase()}
                                </Typography>
                              )}
                              {(receipt.receiptNotes || receipt.conditionNotes) && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <NoteAltOutlinedIcon
                                    sx={{
                                      fontSize: 16,
                                      color:
                                        receipt.conditionNotes &&
                                        receipt.conditionOnReceipt === "DAMAGED"
                                          ? theme.palette.error.main
                                          : theme.palette.info.main,
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color:
                                        receipt.conditionNotes &&
                                        receipt.conditionOnReceipt === "DAMAGED"
                                          ? theme.palette.error.main
                                          : theme.palette.info.main,
                                      fontWeight: 500,
                                    }}
                                  >
                                    Notes available
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </AccordionSummary>

                      <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                        <Stack spacing={2} sx={{ ml: 6 }}>
                          {/* Items List */}
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                textTransform: "uppercase",
                                color: "text.secondary",
                                letterSpacing: 0.5,
                              }}
                            >
                              Items Received
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {receipt.items.map((item, itemIndex) => (
                                <Box
                                  key={itemIndex}
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    py: 0.5,
                                    "&:not(:last-child)": {
                                      borderBottom: `1px solid ${theme.palette.divider}`,
                                    },
                                  }}
                                >
                                  <Typography variant="body2" sx={{ flex: 1 }}>
                                    • {getItemDescription(item)}
                                  </Typography>
                                  {item.assetId && (
                                    <Chip
                                      label={`Asset: ${item.assetId}`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ height: 20, fontSize: "0.75rem" }}
                                    />
                                  )}
                                </Box>
                              ))}
                            </Box>
                          </Box>

                          {/* Receipt Notes */}
                          {receipt.receiptNotes && (
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  color: "text.secondary",
                                  letterSpacing: 0.5,
                                }}
                              >
                                Receipt Notes
                              </Typography>
                              <Paper
                                elevation={0}
                                sx={{
                                  mt: 1,
                                  p: 1.5,
                                  bgcolor: theme.palette.grey[50],
                                  borderLeft: `3px solid ${theme.palette.info.main}`,
                                }}
                              >
                                <Typography variant="body2">{receipt.receiptNotes}</Typography>
                              </Paper>
                            </Box>
                          )}

                          {/* Condition Notes */}
                          {receipt.conditionNotes && (
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  color: "text.secondary",
                                  letterSpacing: 0.5,
                                }}
                              >
                                Condition Notes
                              </Typography>
                              <Paper
                                elevation={0}
                                sx={{
                                  mt: 1,
                                  p: 1.5,
                                  bgcolor:
                                    receipt.conditionOnReceipt === "DAMAGED"
                                      ? theme.palette.error.light + "20"
                                      : theme.palette.warning.light + "20",
                                  borderLeft: `3px solid ${
                                    receipt.conditionOnReceipt === "DAMAGED"
                                      ? theme.palette.error.main
                                      : theme.palette.warning.main
                                  }`,
                                }}
                              >
                                <Typography variant="body2">{receipt.conditionNotes}</Typography>
                              </Paper>
                            </Box>
                          )}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
