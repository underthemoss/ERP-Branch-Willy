"use client";

import { graphql } from "@/graphql";
import { useAdminCdcEventsSubscription } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import {
  AddOutlined,
  ClearAllOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  ExpandMoreOutlined,
  FilterListOutlined,
  LiveTvOutlined,
  PauseCircleOutlineOutlined,
  PlayCircleOutlineOutlined,
  UpdateOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Sheet,
  Stack,
  Table,
  Tooltip,
  Typography,
} from "@mui/joy";
import * as Diff from "diff";
import { useEffect, useMemo, useRef, useState } from "react";

// GraphQL subscription
const ADMIN_CDC_EVENTS_SUBSCRIPTION = graphql(`
  subscription AdminCdcEvents {
    adminCdcEvents {
      collection
      database
      documentKey
      fullDocument
      fullDocumentBeforeChange
      operationType
      rawEvent
      timestamp
      updateDescription
    }
  }
`);

interface CDCEvent {
  collection: string;
  database: string;
  documentKey: any;
  fullDocument: any;
  fullDocumentBeforeChange: any;
  operationType: string;
  rawEvent: any;
  timestamp: string;
  updateDescription: any;
}

const MAX_EVENTS = 1000;

export default function LiveCDCFeedPage() {
  const { notifyInfo } = useNotification();
  const [events, setEvents] = useState<CDCEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [operationFilter, setOperationFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CDCEvent | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to CDC events
  const { data, loading, error } = useAdminCdcEventsSubscription({
    skip: isPaused,
    onData: ({ data }) => {
      if (data.data?.adminCdcEvents && !isPaused) {
        const newEvent = data.data.adminCdcEvents as CDCEvent;
        setEvents((prev) => {
          const updated = [newEvent, ...prev];
          // Keep only the latest MAX_EVENTS
          return updated.slice(0, MAX_EVENTS);
        });

        // Auto-scroll if enabled
        if (autoScroll && tableContainerRef.current) {
          tableContainerRef.current.scrollTop = 0;
        }
      }
    },
  });

  // Get unique collections from events
  const uniqueCollections = useMemo(() => {
    const collections = new Set(events.map((e) => e.collection));
    return Array.from(collections).sort();
  }, [events]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Collection filter
      if (collectionFilter !== "all" && event.collection !== collectionFilter) {
        return false;
      }

      // Operation filter
      if (operationFilter !== "all" && event.operationType !== operationFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const docKeyStr = JSON.stringify(event.documentKey).toLowerCase();
        const collectionMatch = event.collection.toLowerCase().includes(searchLower);
        return collectionMatch || docKeyStr.includes(searchLower);
      }

      return true;
    });
  }, [events, collectionFilter, operationFilter, searchQuery]);

  const handleClearEvents = () => {
    setEvents([]);
    notifyInfo("Event history cleared");
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case "insert":
        return <AddOutlined sx={{ fontSize: 16 }} />;
      case "update":
      case "replace":
        return <EditOutlined sx={{ fontSize: 16 }} />;
      case "delete":
        return <DeleteOutlined sx={{ fontSize: 16 }} />;
      default:
        return <UpdateOutlined sx={{ fontSize: 16 }} />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case "insert":
        return "success";
      case "update":
      case "replace":
        return "primary";
      case "delete":
        return "danger";
      default:
        return "neutral";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  const formatDocumentKey = (docKey: any) => {
    if (!docKey) return "N/A";
    if (typeof docKey === "object") {
      // Extract _id if present
      if (docKey._id) {
        return String(docKey._id);
      }
      return JSON.stringify(docKey);
    }
    return String(docKey);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography level="h2" sx={{ mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
          <LiveTvOutlined sx={{ fontSize: 32, color: "primary.500" }} />
          Live CDC Event Stream
          {!isPaused && (
            <Chip size="sm" color="success" variant="soft" sx={{ ml: 1 }}>
              LIVE
            </Chip>
          )}
        </Typography>
        <Typography level="body-md" sx={{ color: "text.secondary" }}>
          Real-time feed of all database change events across the platform
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Total Events
          </Typography>
          <Typography level="h3">{events.length.toLocaleString()}</Typography>
        </Card>

        <Card sx={{ flex: 1 }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Filtered Events
          </Typography>
          <Typography level="h3">{filteredEvents.length.toLocaleString()}</Typography>
        </Card>

        <Card sx={{ flex: 1 }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Collections
          </Typography>
          <Typography level="h3">{uniqueCollections.length}</Typography>
        </Card>

        <Card sx={{ flex: 1 }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Status
          </Typography>
          <Typography level="h3" sx={{ color: isPaused ? "warning.500" : "success.500" }}>
            {isPaused ? "Paused" : "Active"}
          </Typography>
        </Card>
      </Box>

      {/* Controls */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", flexWrap: "wrap" }}>
        <Input
          placeholder="Search by collection or document key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1, minWidth: 300 }}
          size="sm"
        />

        <Select
          value={collectionFilter}
          onChange={(_, value) => setCollectionFilter(value as string)}
          size="sm"
          sx={{ minWidth: 200 }}
          startDecorator={<FilterListOutlined />}
        >
          <Option value="all">All Collections</Option>
          {uniqueCollections.map((collection) => (
            <Option key={collection} value={collection}>
              {collection}
            </Option>
          ))}
        </Select>

        <Select
          value={operationFilter}
          onChange={(_, value) => setOperationFilter(value as string)}
          size="sm"
          sx={{ minWidth: 150 }}
        >
          <Option value="all">All Operations</Option>
          <Option value="insert">Insert</Option>
          <Option value="update">Update</Option>
          <Option value="replace">Replace</Option>
          <Option value="delete">Delete</Option>
        </Select>

        <Box sx={{ flex: 1 }} />

        <Tooltip title={isPaused ? "Resume stream" : "Pause stream"}>
          <IconButton
            onClick={handleTogglePause}
            variant="outlined"
            size="sm"
            color={isPaused ? "success" : "warning"}
          >
            {isPaused ? <PlayCircleOutlineOutlined /> : <PauseCircleOutlineOutlined />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Clear event history">
          <Button
            onClick={handleClearEvents}
            variant="outlined"
            size="sm"
            startDecorator={<ClearAllOutlined />}
          >
            Clear
          </Button>
        </Tooltip>
      </Box>

      {/* Error Display */}
      {error && (
        <Card color="danger" variant="soft" sx={{ mb: 3 }}>
          <Typography level="title-md">Subscription Error</Typography>
          <Typography level="body-sm">{error.message}</Typography>
        </Card>
      )}

      {/* Events Table */}
      <Sheet
        ref={tableContainerRef}
        variant="outlined"
        sx={{
          borderRadius: "sm",
          overflow: "auto",
          maxHeight: "calc(100vh - 450px)",
        }}
      >
        <Table
          stickyHeader
          hoverRow
          sx={{
            "--TableCell-headBackground": "var(--joy-palette-background-level1)",
            "--Table-headerUnderlineThickness": "1px",
            "& thead th": {
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            },
            "& tbody td": {
              fontSize: "13px",
            },
          }}
        >
          <thead>
            <tr>
              <th style={{ width: "100px" }}>Time</th>
              <th style={{ width: "120px" }}>Operation</th>
              <th style={{ width: "200px" }}>Collection</th>
              <th style={{ width: "250px" }}>Document Key</th>
              <th>Changes</th>
              <th style={{ width: "80px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <Box sx={{ py: 8, textAlign: "center" }}>
                    <LiveTvOutlined sx={{ fontSize: 48, color: "neutral.400", mb: 2 }} />
                    <Typography level="body-md" sx={{ color: "text.secondary" }}>
                      {isPaused
                        ? "Stream is paused. Click Resume to continue receiving events."
                        : events.length === 0
                          ? "Waiting for CDC events..."
                          : "No events match your filters"}
                    </Typography>
                  </Box>
                </td>
              </tr>
            ) : (
              filteredEvents.map((event, index) => (
                <tr key={`${event.timestamp}-${index}`}>
                  <td>
                    <Typography
                      level="body-xs"
                      sx={{ fontFamily: "monospace", color: "text.tertiary" }}
                    >
                      {formatTimestamp(event.timestamp)}
                    </Typography>
                  </td>
                  <td>
                    <Chip
                      size="sm"
                      color={getOperationColor(event.operationType) as any}
                      variant="soft"
                      startDecorator={getOperationIcon(event.operationType)}
                    >
                      {event.operationType}
                    </Chip>
                  </td>
                  <td>
                    <Typography level="body-sm" sx={{ fontFamily: "monospace", fontWeight: 500 }}>
                      {event.collection}
                    </Typography>
                  </td>
                  <td>
                    <Typography
                      level="body-xs"
                      sx={{
                        fontFamily: "monospace",
                        color: "text.secondary",
                        wordBreak: "break-all",
                      }}
                    >
                      {formatDocumentKey(event.documentKey)}
                    </Typography>
                  </td>
                  <td>
                    {event.operationType === "update" && event.updateDescription ? (
                      <Stack spacing={0.5}>
                        {event.updateDescription.updatedFields && (
                          <Typography level="body-xs" sx={{ color: "primary.600" }}>
                            Updated: {Object.keys(event.updateDescription.updatedFields).join(", ")}
                          </Typography>
                        )}
                        {event.updateDescription.removedFields && (
                          <Typography level="body-xs" sx={{ color: "danger.600" }}>
                            Removed: {event.updateDescription.removedFields.join(", ")}
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      <Typography level="body-xs" sx={{ color: "text.tertiary" }}>
                        -
                      </Typography>
                    )}
                  </td>
                  <td>
                    <Tooltip title="View full document">
                      <IconButton
                        size="sm"
                        variant="plain"
                        color="primary"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <ExpandMoreOutlined />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Sheet>

      {/* Footer Info */}
      <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography level="body-xs" sx={{ color: "text.tertiary" }}>
          Showing {filteredEvents.length.toLocaleString()} of {events.length.toLocaleString()}{" "}
          events
          {events.length >= MAX_EVENTS &&
            ` (limited to ${MAX_EVENTS.toLocaleString()} most recent)`}
        </Typography>
        <Typography level="body-xs" sx={{ color: "text.tertiary" }}>
          {isPaused ? "⏸ Stream Paused" : "🔴 Live Stream Active"}
        </Typography>
      </Box>

      {/* Document Details Modal */}
      <Modal open={!!selectedEvent} onClose={() => setSelectedEvent(null)}>
        <ModalDialog
          sx={{
            width: "90vw",
            maxWidth: 1400,
            height: "90vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ModalClose />
          {selectedEvent && (
            <>
              <Typography level="h4" sx={{ mb: 2 }}>
                CDC Event Details
              </Typography>

              {/* Event Metadata */}
              <Box sx={{ mb: 2, flexShrink: 0 }}>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                  <Chip
                    size="lg"
                    color={getOperationColor(selectedEvent.operationType) as any}
                    variant="soft"
                    startDecorator={getOperationIcon(selectedEvent.operationType)}
                  >
                    {selectedEvent.operationType.toUpperCase()}
                  </Chip>
                  <Chip size="lg" variant="outlined">
                    {selectedEvent.collection}
                  </Chip>
                  <Chip size="lg" variant="outlined">
                    {new Date(selectedEvent.timestamp).toLocaleString()}
                  </Chip>
                </Box>

                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Typography level="body-sm" sx={{ fontWeight: 600 }}>
                    Document Key:
                  </Typography>
                  <Typography
                    level="body-sm"
                    sx={{ fontFamily: "monospace", color: "text.secondary" }}
                  >
                    {formatDocumentKey(selectedEvent.documentKey)}
                  </Typography>
                </Box>
              </Box>

              {/* Document Content */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  flex: 1,
                  overflow: "auto",
                  pr: 1,
                }}
              >
                {selectedEvent.fullDocumentBeforeChange &&
                  selectedEvent.fullDocument &&
                  (() => {
                    const beforeStr = JSON.stringify(
                      selectedEvent.fullDocumentBeforeChange,
                      null,
                      2,
                    );
                    const afterStr = JSON.stringify(selectedEvent.fullDocument, null, 2);
                    const beforeLines = beforeStr.split("\n");
                    const afterLines = afterStr.split("\n");
                    const diffs = Diff.diffLines(beforeStr, afterStr);

                    // Build side-by-side line mapping
                    let beforeIdx = 0;
                    let afterIdx = 0;
                    const rows: Array<{
                      before: {
                        line: string;
                        lineNum: number;
                        type: "unchanged" | "removed" | "empty";
                      };
                      after: {
                        line: string;
                        lineNum: number;
                        type: "unchanged" | "added" | "empty";
                      };
                    }> = [];

                    diffs.forEach((part) => {
                      const lines = part.value.split("\n");
                      // Remove empty last line if exists
                      if (lines[lines.length - 1] === "") lines.pop();

                      if (!part.added && !part.removed) {
                        // Unchanged lines
                        lines.forEach((line) => {
                          rows.push({
                            before: { line, lineNum: beforeIdx + 1, type: "unchanged" },
                            after: { line, lineNum: afterIdx + 1, type: "unchanged" },
                          });
                          beforeIdx++;
                          afterIdx++;
                        });
                      } else if (part.removed) {
                        // Removed lines (only on left)
                        lines.forEach((line) => {
                          rows.push({
                            before: { line, lineNum: beforeIdx + 1, type: "removed" },
                            after: { line: "", lineNum: 0, type: "empty" },
                          });
                          beforeIdx++;
                        });
                      } else if (part.added) {
                        // Added lines (only on right)
                        lines.forEach((line) => {
                          rows.push({
                            before: { line: "", lineNum: 0, type: "empty" },
                            after: { line, lineNum: afterIdx + 1, type: "added" },
                          });
                          afterIdx++;
                        });
                      }
                    });

                    return (
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Typography level="title-sm" sx={{ mb: 1 }}>
                          Side-by-Side Diff
                        </Typography>
                        <Sheet
                          variant="soft"
                          sx={{
                            maxHeight: 500,
                            overflow: "auto",
                            borderRadius: "sm",
                            bgcolor: "neutral.50",
                          }}
                        >
                          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                            {/* Left side - Before */}
                            <Box
                              sx={{
                                borderRight: "1px solid",
                                borderColor: "divider",
                                bgcolor: "#fff5f5",
                              }}
                            >
                              <Box
                                sx={{
                                  position: "sticky",
                                  top: 0,
                                  bgcolor: "danger.100",
                                  p: 1,
                                  borderBottom: "1px solid",
                                  borderColor: "divider",
                                  zIndex: 1,
                                }}
                              >
                                <Typography
                                  level="body-xs"
                                  sx={{ fontWeight: 600, color: "danger.700" }}
                                >
                                  Before
                                </Typography>
                              </Box>
                              {rows.map((row, idx) => (
                                <Box
                                  key={`before-${idx}`}
                                  sx={{
                                    display: "flex",
                                    fontFamily: "monospace",
                                    fontSize: "11px",
                                    lineHeight: 1.5,
                                    bgcolor:
                                      row.before.type === "removed"
                                        ? "#ffeef0"
                                        : row.before.type === "empty"
                                          ? "#fafafa"
                                          : "transparent",
                                    borderLeft:
                                      row.before.type === "removed" ? "3px solid #d73a4a" : "none",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      minWidth: "40px",
                                      px: 1,
                                      textAlign: "right",
                                      color: "text.tertiary",
                                      bgcolor: row.before.type === "empty" ? "#fafafa" : "#f6f8fa",
                                      userSelect: "none",
                                    }}
                                  >
                                    {row.before.lineNum > 0 ? row.before.lineNum : ""}
                                  </Box>
                                  <Box
                                    sx={{
                                      px: 1,
                                      flex: 1,
                                      whiteSpace: "pre-wrap",
                                      wordBreak: "break-all",
                                      maxWidth: "600px",
                                    }}
                                  >
                                    {row.before.line || " "}
                                  </Box>
                                </Box>
                              ))}
                            </Box>

                            {/* Right side - After */}
                            <Box sx={{ bgcolor: "#f0fff4" }}>
                              <Box
                                sx={{
                                  position: "sticky",
                                  top: 0,
                                  bgcolor: "success.100",
                                  p: 1,
                                  borderBottom: "1px solid",
                                  borderColor: "divider",
                                  zIndex: 1,
                                }}
                              >
                                <Typography
                                  level="body-xs"
                                  sx={{ fontWeight: 600, color: "success.700" }}
                                >
                                  After
                                </Typography>
                              </Box>
                              {rows.map((row, idx) => (
                                <Box
                                  key={`after-${idx}`}
                                  sx={{
                                    display: "flex",
                                    fontFamily: "monospace",
                                    fontSize: "11px",
                                    lineHeight: 1.5,
                                    bgcolor:
                                      row.after.type === "added"
                                        ? "#e6ffec"
                                        : row.after.type === "empty"
                                          ? "#fafafa"
                                          : "transparent",
                                    borderLeft:
                                      row.after.type === "added" ? "3px solid #28a745" : "none",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      minWidth: "40px",
                                      px: 1,
                                      textAlign: "right",
                                      color: "text.tertiary",
                                      bgcolor: row.after.type === "empty" ? "#fafafa" : "#f6f8fa",
                                      userSelect: "none",
                                    }}
                                  >
                                    {row.after.lineNum > 0 ? row.after.lineNum : ""}
                                  </Box>
                                  <Box
                                    sx={{
                                      px: 1,
                                      flex: 1,
                                      whiteSpace: "pre-wrap",
                                      wordBreak: "break-all",
                                      maxWidth: "600px",
                                    }}
                                  >
                                    {row.after.line || " "}
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Sheet>
                      </Card>
                    );
                  })()}

                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography level="title-sm" sx={{ mb: 1 }}>
                    Raw CDC Event
                  </Typography>
                  <Sheet
                    variant="soft"
                    sx={{
                      maxHeight: 600,
                      overflow: "auto",
                      p: 2,
                      borderRadius: "sm",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      lineHeight: 1.6,
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {JSON.stringify(selectedEvent, null, 2)}
                    </pre>
                  </Sheet>
                </Card>
              </Box>
            </>
          )}
        </ModalDialog>
      </Modal>
    </Box>
  );
}
