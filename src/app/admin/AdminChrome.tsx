"use client";

import { useAuth0 } from "@auth0/auth0-react";
import {
  AdminPanelSettingsOutlined,
  BugReportOutlined,
  BusinessOutlined,
  CloudSyncOutlined,
  DashboardOutlined,
  EmailOutlined,
  GroupOutlined,
  HomeOutlined,
  LogoutOutlined,
  PolicyOutlined,
  SecurityOutlined,
  SettingsOutlined,
  StorageOutlined,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  ListItemDecorator,
  Tooltip,
  Typography,
} from "@mui/joy";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const AdminChrome: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth0();
  const pathname = usePathname();

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const adminNavItems = [
    {
      text: "Dashboard",
      href: "/admin",
      icon: <DashboardOutlined />,
      selected: pathname === "/admin",
    },
    {
      text: "Customers",
      href: "/admin/customers",
      icon: <BusinessOutlined />,
      selected: pathname === "/admin/customers",
    },
    {
      text: "Users",
      href: "/admin/users",
      icon: <GroupOutlined />,
      selected: pathname === "/admin/users",
    },
    {
      text: "Authz",
      href: "/admin/authz",
      icon: <PolicyOutlined />,
      selected: pathname.startsWith("/admin/authz"),
    },
    {
      text: "SendGrid",
      href: "/admin/sendgrid",
      icon: <EmailOutlined />,
      selected: pathname.startsWith("/admin/sendgrid"),
    },
    {
      text: "CDC Status",
      href: "/admin/change-stream",
      icon: <CloudSyncOutlined />,
      selected: pathname === "/admin/change-stream",
    },
    {
      text: "CDC Live Feed",
      href: "/admin/change-stream/live",
      icon: <StorageOutlined />,
      selected: pathname === "/admin/change-stream/live",
    },
    {
      text: "System",
      href: "/admin/system",
      icon: <StorageOutlined />,
      selected: pathname === "/admin/system",
    },
    {
      text: "Security",
      href: "/admin/security",
      icon: <SecurityOutlined />,
      selected: pathname === "/admin/security",
    },
    {
      text: "Support",
      href: "/admin/support",
      icon: <BugReportOutlined />,
      selected: pathname === "/admin/support",
    },
    {
      text: "Settings",
      href: "/admin/settings",
      icon: <SettingsOutlined />,
      selected: pathname === "/admin/settings",
    },
  ];

  return (
    <Box sx={{ display: "flex", height: "100vh", bgcolor: "background.body" }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 280,
          bgcolor: "background.surface",
          borderRight: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <AdminPanelSettingsOutlined sx={{ fontSize: 28, color: "primary.500" }} />
            <Typography level="h4" sx={{ fontWeight: 600 }}>
              Platform Admin
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: "primary.softBg",
              borderRadius: "sm",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Avatar size="sm" src={user?.picture} alt={user?.name || user?.email}>
              {user?.name?.[0] || user?.email?.[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography level="body-sm" sx={{ fontWeight: 500 }} noWrap>
                {user?.name || "Admin User"}
              </Typography>
              <Typography level="body-xs" noWrap>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Navigation */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 1 }}>
          <List size="sm" sx={{ gap: 0.5 }}>
            {adminNavItems.map((item) => (
              <ListItem key={item.text}>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  selected={item.selected}
                  sx={{
                    borderRadius: "sm",
                    py: 1,
                  }}
                >
                  <ListItemDecorator>{item.icon}</ListItemDecorator>
                  <ListItemContent>{item.text}</ListItemContent>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider />

        {/* Footer Actions */}
        <Box sx={{ p: 2, display: "flex", gap: 1 }}>
          <Tooltip title="Back to App">
            <IconButton component={Link} href="/" variant="outlined" color="neutral" size="sm">
              <HomeOutlined />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} variant="outlined" color="danger" size="sm">
              <LogoutOutlined />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
