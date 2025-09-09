"use client";

import {
  ApiOutlined,
  BugReportOutlined,
  BuildOutlined,
  BusinessOutlined,
  CheckCircleOutlined,
  CloudQueueOutlined,
  ErrorOutlineOutlined,
  GroupOutlined,
  PersonAddOutlined,
  SecurityOutlined,
  StorageOutlined,
  SupportAgentOutlined,
  TrendingUpOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemContent,
  ListItemDecorator,
  Typography,
} from "@mui/joy";

export default function AdminDashboard() {
  // Mock data for internal platform metrics
  const platformMetrics = {
    totalCustomers: 247,
    activeCustomers: 198,
    totalUsers: 3842,
    activeWorkspaces: 512,
    apiCalls24h: "2.4M",
    storageUsed: "847 GB",
    systemHealth: "operational",
    dbConnections: 89,
    cacheHitRate: 94.2,
  };

  const recentActivity = [
    {
      type: "signup",
      message: "New customer: Acme Construction",
      time: "5 minutes ago",
      status: "success",
    },
    {
      type: "error",
      message: "API rate limit exceeded - Customer ID: 4821",
      time: "12 minutes ago",
      status: "warning",
    },
    {
      type: "support",
      message: "Critical ticket #8234 opened",
      time: "28 minutes ago",
      status: "error",
    },
    { type: "system", message: "Database backup completed", time: "1 hour ago", status: "success" },
    {
      type: "auth",
      message: "Multiple failed login attempts - User: john@example.com",
      time: "2 hours ago",
      status: "warning",
    },
  ];

  const supportQueue = [
    {
      id: "#8234",
      customer: "BuildCo Inc",
      issue: "Cannot access purchase orders",
      priority: "high",
      age: "28m",
    },
    {
      id: "#8233",
      customer: "Smith Rentals",
      issue: "Invoice generation failing",
      priority: "medium",
      age: "1h",
    },
    {
      id: "#8232",
      customer: "ABC Equipment",
      issue: "User permissions question",
      priority: "low",
      age: "3h",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircleOutlined sx={{ color: "success.500" }} />;
      case "warning":
        return <WarningAmberOutlined sx={{ color: "warning.500" }} />;
      case "error":
        return <ErrorOutlineOutlined sx={{ color: "danger.500" }} />;
      default:
        return null;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "signup":
        return <PersonAddOutlined />;
      case "error":
        return <BugReportOutlined />;
      case "support":
        return <SupportAgentOutlined />;
      case "system":
        return <BuildOutlined />;
      case "auth":
        return <SecurityOutlined />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography level="h2" sx={{ mb: 0.5 }}>
          Platform Dashboard
        </Typography>
        <Typography level="body-md" sx={{ color: "text.secondary" }}>
          Internal operations and system monitoring
        </Typography>
      </Box>

      {/* System Status Alert */}
      <Alert
        color={platformMetrics.systemHealth === "operational" ? "success" : "warning"}
        startDecorator={<CheckCircleOutlined />}
        sx={{ mb: 3 }}
      >
        System Status: All services operational
      </Alert>

      {/* Metrics Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <BusinessOutlined sx={{ fontSize: 32, color: "primary.500" }} />
              <Box>
                <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                  Total Customers
                </Typography>
                <Typography level="h3">{platformMetrics.totalCustomers}</Typography>
                <Typography level="body-xs" sx={{ color: "success.500" }}>
                  {platformMetrics.activeCustomers} active
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <GroupOutlined sx={{ fontSize: 32, color: "primary.500" }} />
              <Box>
                <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                  Platform Users
                </Typography>
                <Typography level="h3">{platformMetrics.totalUsers}</Typography>
                <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                  Across all customers
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <ApiOutlined sx={{ fontSize: 32, color: "primary.500" }} />
              <Box>
                <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                  API Calls (24h)
                </Typography>
                <Typography level="h3">{platformMetrics.apiCalls24h}</Typography>
                <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                  <TrendingUpOutlined sx={{ fontSize: 12 }} /> +12% from yesterday
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <Card>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CloudQueueOutlined sx={{ fontSize: 32, color: "primary.500" }} />
              <Box>
                <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                  Storage Used
                </Typography>
                <Typography level="h3">{platformMetrics.storageUsed}</Typography>
                <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                  of 2TB allocated
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <Typography level="title-md" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button variant="outlined" size="sm" startDecorator={<PersonAddOutlined />}>
            Create Customer Account
          </Button>
          <Button variant="outlined" size="sm" startDecorator={<SecurityOutlined />}>
            View Security Logs
          </Button>
          <Button variant="outlined" size="sm" startDecorator={<StorageOutlined />}>
            Database Management
          </Button>
          <Button variant="outlined" size="sm" startDecorator={<BuildOutlined />}>
            System Maintenance
          </Button>
          <Button variant="outlined" size="sm" startDecorator={<SupportAgentOutlined />}>
            Support Queue
          </Button>
        </Box>
      </Card>

      <Grid container spacing={2}>
        {/* Recent Activity */}
        <Grid xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <Typography level="title-md" sx={{ mb: 2 }}>
              Recent Platform Activity
            </Typography>
            <List size="sm">
              {recentActivity.map((activity, index) => (
                <ListItem key={index}>
                  <ListItemDecorator>{getActivityIcon(activity.type)}</ListItemDecorator>
                  <ListItemContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography level="body-sm">{activity.message}</Typography>
                      {getStatusIcon(activity.status)}
                    </Box>
                    <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                      {activity.time}
                    </Typography>
                  </ListItemContent>
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        {/* Support Queue */}
        <Grid xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
            >
              <Typography level="title-md">Support Queue</Typography>
              <Chip size="sm" color="danger" variant="soft">
                3 pending
              </Chip>
            </Box>
            <List size="sm">
              {supportQueue.map((ticket) => (
                <ListItem key={ticket.id}>
                  <ListItemContent>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}
                    >
                      <Box>
                        <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                          {ticket.id} - {ticket.customer}
                        </Typography>
                        <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                          {ticket.issue}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 0.5,
                        }}
                      >
                        <Chip
                          size="sm"
                          variant="soft"
                          color={
                            ticket.priority === "high"
                              ? "danger"
                              : ticket.priority === "medium"
                                ? "warning"
                                : "neutral"
                          }
                        >
                          {ticket.priority}
                        </Chip>
                        <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                          {ticket.age}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItemContent>
                </ListItem>
              ))}
            </List>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid xs={12}>
          <Card>
            <Typography level="title-md" sx={{ mb: 2 }}>
              System Health
            </Typography>
            <Grid container spacing={2}>
              <Grid xs={12} sm={4}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography level="body-sm">Database Connections</Typography>
                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                      {platformMetrics.dbConnections}/100
                    </Typography>
                  </Box>
                  <LinearProgress
                    determinate
                    value={platformMetrics.dbConnections}
                    sx={{ height: 8 }}
                    color={platformMetrics.dbConnections > 80 ? "warning" : "primary"}
                  />
                </Box>
              </Grid>
              <Grid xs={12} sm={4}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography level="body-sm">Cache Hit Rate</Typography>
                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                      {platformMetrics.cacheHitRate}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    determinate
                    value={platformMetrics.cacheHitRate}
                    sx={{ height: 8 }}
                    color="success"
                  />
                </Box>
              </Grid>
              <Grid xs={12} sm={4}>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography level="body-sm">Storage Usage</Typography>
                    <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                      42%
                    </Typography>
                  </Box>
                  <LinearProgress determinate value={42} sx={{ height: 8 }} color="primary" />
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
