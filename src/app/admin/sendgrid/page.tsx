"use client";

import { graphql } from "@/graphql";
import { useSendGridEmailActivityQuery } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { EmailOutlined, RefreshOutlined, SendOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  Table,
  Tooltip,
  Typography,
} from "@mui/joy";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
      }
    }
  }
`);

export default function SendGridDashboard() {
  const router = useRouter();
  const { notifyError } = useNotification();
  const [selectedEmail, setSelectedEmail] = useState<{
    msgId: string;
    email: string;
    event: string;
    timestamp: number;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch email activity
  const {
    data: activityData,
    loading: activityLoading,
    refetch,
    error: activityError,
  } = useSendGridEmailActivityQuery({
    variables: {
      limit: 50,
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
              Last {emailActivity.length} events
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
                  <th>Email</th>
                  <th>Event</th>
                  <th>Message ID</th>
                  <th>Details</th>
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
                        <Typography level="body-sm">{activity.email}</Typography>
                      </td>
                      <td>
                        <Chip size="sm" color={eventInfo.color} variant="soft">
                          {eventInfo.label}
                        </Chip>
                      </td>
                      <td>
                        <Typography level="body-xs" sx={{ fontFamily: "monospace" }}>
                          {activity.msgId.substring(0, 12)}...
                        </Typography>
                      </td>
                      <td>
                        <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                          {eventInfo.label}
                        </Typography>
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
    </Box>
  );
}
