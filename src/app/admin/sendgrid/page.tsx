"use client";

import { graphql } from "@/graphql";
import { useSendGridEmailActivityQuery, useSendGridEmailDetailsLazyQuery } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import {
  CreateOutlined,
  EmailOutlined,
  PreviewOutlined,
  RefreshOutlined,
  SearchOutlined,
  SendOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Input,
  Option,
  Select,
  Table,
  Tooltip,
  Typography,
} from "@mui/joy";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
import EmailComposerDialog from "./EmailComposerDialog";
import EmailDetailsDialog from "./EmailDetailsDialog";

// GraphQL Query for Email Activity
graphql(`
  query SendGridEmailActivity($limit: Int, $query: String) {
    admin {
      sendGridEmailActivity(limit: $limit, query: $query) {
        email
        event
        timestamp
        msgId
        fromEmail
        subject
        status
        clicks
        opens
      }
    }
  }
`);

// Reuse the existing query for email details
graphql(`
  query SendGridEmailDetails($msgId: String!) {
    admin {
      sendGridEmailDetails(msgId: $msgId) {
        from
        to
        subject
        htmlContent
        plainContent
        status
        timestamp
        msgId
      }
    }
  }
`);

export default function SendGridDashboard() {
  const router = useRouter();
  const { notifyError, notifyInfo } = useNotification();
  const [selectedEmail, setSelectedEmail] = useState<{
    msgId: string;
    email: string;
    event: string;
    timestamp: number;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [composerDialogOpen, setComposerDialogOpen] = useState(false);

  // Simple search and limit
  const [searchQuery, setSearchQuery] = useState("");
  const [limitFilter, setLimitFilter] = useState<number>(50);

  // Fetch email activity
  const {
    data: activityData,
    loading: activityLoading,
    refetch,
    error: activityError,
  } = useSendGridEmailActivityQuery({
    variables: {
      limit: limitFilter,
      query: searchQuery || undefined,
    },
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      notifyError(`Failed to load email activity: ${error.message}`);
    },
  });

  // Format event type for display
  const formatEventType = (event: string) => {
    const eventMap: Record<string, { label: string; color: any }> = {
      delivered: { label: "Delivered", color: "success" },
      open: { label: "Opened", color: "primary" },
      click: { label: "Clicked", color: "primary" },
      bounce: { label: "Bounced", color: "warning" },
      blocked: { label: "Blocked", color: "danger" },
      spamreport: { label: "Spam", color: "danger" },
      unsubscribe: { label: "Unsubscribed", color: "neutral" },
      deferred: { label: "Deferred", color: "warning" },
      dropped: { label: "Dropped", color: "danger" },
      processed: { label: "Processed", color: "neutral" },
    };
    return eventMap[event?.toLowerCase()] || { label: event || "Unknown", color: "neutral" };
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    try {
      return format(new Date(timestamp * 1000), "MMM dd, HH:mm");
    } catch {
      return "—";
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEmailClick = (activity: any) => {
    setSelectedEmail({
      msgId: activity.msgId,
      email: activity.email,
      event: activity.event,
      timestamp: activity.timestamp,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEmail(null);
  };

  const emailActivity = activityData?.admin?.sendGridEmailActivity || [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography level="h2" sx={{ mb: 0.5 }}>
            SendGrid Email Management
          </Typography>
          <Typography level="body-md" sx={{ color: "text.secondary" }}>
            Monitor email activity and send test emails
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} variant="outlined" size="sm">
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startDecorator={<CreateOutlined />}
            onClick={() => setComposerDialogOpen(true)}
          >
            Compose Email
          </Button>
          <Button
            startDecorator={<SendOutlined />}
            onClick={() => router.push("/admin/sendgrid/test-email")}
          >
            Send Test Email
          </Button>
        </Box>
      </Box>

      {/* Info Card */}
      <Card sx={{ mb: 3, bgcolor: "primary.softBg" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <EmailOutlined sx={{ fontSize: 24, color: "primary.500" }} />
          <Box>
            <Typography level="title-md">Available Features</Typography>
            <Typography level="body-sm">
              View recent email activity and send test emails to verify your SendGrid configuration
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Email Activity Table */}
      <Card>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography level="title-lg">Recent Email Activity</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography level="body-sm" sx={{ color: "text.secondary" }}>
              Showing {emailActivity.length} events
            </Typography>
            <Tooltip title="Refresh Email Activity">
              <IconButton
                onClick={handleRefresh}
                variant="soft"
                size="sm"
                disabled={activityLoading}
              >
                <RefreshOutlined />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Simple Filters */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            alignItems: "center",
          }}
        >
          {/* Search Input */}
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startDecorator={<SearchOutlined />}
            sx={{ minWidth: 250 }}
          />

          {/* Limit Selector */}
          <Select
            value={limitFilter}
            onChange={(_, value) => setLimitFilter(value as number)}
            sx={{ minWidth: 120 }}
            size="sm"
          >
            <Option value={25}>Last 25</Option>
            <Option value={50}>Last 50</Option>
            <Option value={100}>Last 100</Option>
            <Option value={200}>Last 200</Option>
            <Option value={500}>Last 500</Option>
          </Select>
        </Box>

        {activityLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : emailActivity.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography level="body-md" sx={{ color: "text.secondary" }}>
              No email activity found
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table
              size="sm"
              hoverRow
              sx={{
                "--TableCell-paddingY": "8px",
                "& thead th": { fontSize: "13px" },
                "& tbody td": { fontSize: "13px" },
                "& tbody tr": {
                  cursor: "pointer",
                },
              }}
            >
              <thead>
                <tr>
                  <th>Time</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Event</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {emailActivity.map((activity, index) => {
                  const eventInfo = formatEventType(activity.event);
                  return (
                    <tr
                      key={`${activity.msgId}-${index}`}
                      onClick={() => handleEmailClick(activity)}
                    >
                      <td>
                        <Typography level="body-xs" sx={{ fontFamily: "monospace" }}>
                          {formatTimestamp(activity.timestamp)}
                        </Typography>
                      </td>
                      <td>
                        <Typography
                          level="body-xs"
                          sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}
                        >
                          {activity.fromEmail || "—"}
                        </Typography>
                      </td>
                      <td>
                        <Typography
                          level="body-xs"
                          sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}
                        >
                          {activity.email}
                        </Typography>
                      </td>
                      <td>
                        <Typography
                          level="body-xs"
                          sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}
                        >
                          {activity.subject || "—"}
                        </Typography>
                      </td>
                      <td>
                        <Chip size="sm" color={eventInfo.color} variant="soft">
                          {eventInfo.label}
                        </Chip>
                      </td>
                      <td>
                        {activity.status && (
                          <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                            {activity.status}
                          </Typography>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Box>
        )}
      </Card>

      {/* Email Details Dialog */}
      <EmailDetailsDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        msgId={selectedEmail?.msgId || null}
        initialData={selectedEmail || undefined}
      />

      {/* Email Composer Dialog */}
      <EmailComposerDialog open={composerDialogOpen} onClose={() => setComposerDialogOpen(false)} />
    </Box>
  );
}
