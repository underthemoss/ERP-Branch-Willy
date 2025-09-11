"use client";

import { graphql } from "@/graphql";
import { useListRolesQuery, useSearchUsersQuery } from "@/graphql/hooks";
import {
  AddOutlined,
  AdminPanelSettingsOutlined,
  BlockOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  EditOutlined,
  EmailOutlined,
  FilterListOutlined,
  GroupOutlined,
  HistoryOutlined,
  KeyOutlined,
  MoreVertOutlined,
  PersonOutlined,
  RefreshOutlined,
  SearchOutlined,
  SecurityOutlined,
  ShieldOutlined,
  VerifiedOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Dropdown,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
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
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

// Type definitions
interface User {
  userId: string;
  email?: string | null;
  emailVerified?: boolean | null;
  name?: string | null;
  nickname?: string | null;
  picture?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLogin?: string | null;
  loginsCount?: number | null;
  blocked?: boolean | null;
  givenName?: string | null;
  familyName?: string | null;
  phoneNumber?: string | null;
  phoneVerified?: boolean | null;
  multifactor?: string[] | null;
  appMetadata?: any;
  userMetadata?: any;
}

// GraphQL queries
graphql(`
  query SearchUsers($query: String, $page: Int, $perPage: Int) {
    admin {
      searchUsers(query: $query, page: $page, perPage: $perPage) {
        users {
          userId
          email
          emailVerified
          name
          nickname
          picture
          createdAt
          updatedAt
          lastLogin
          loginsCount
          blocked
          givenName
          familyName
          phoneNumber
          phoneVerified
          multifactor
          appMetadata
          userMetadata
        }
        total
        start
        limit
        length
      }
    }
  }
`);

graphql(`
  query ListRoles {
    admin {
      listRoles {
        id
        name
        description
      }
    }
  }
`);

export default function UsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [perPage, setPerPage] = useState(25);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(0); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users
  const {
    data: usersData,
    loading: usersLoading,
    refetch: refetchUsers,
  } = useSearchUsersQuery({
    variables: {
      query: debouncedSearchQuery || undefined,
      page: currentPage,
      perPage,
    },
    fetchPolicy: "cache-and-network",
  });

  // Fetch roles
  const { data: rolesData } = useListRolesQuery({
    fetchPolicy: "cache-and-network",
  });

  const users = usersData?.admin?.searchUsers?.users || [];
  const totalUsers = usersData?.admin?.searchUsers?.total || 0;
  const roles = rolesData?.admin?.listRoles || [];

  // Filter users based on status
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active") return !user.blocked;
      if (statusFilter === "blocked") return user.blocked;
      if (statusFilter === "verified") return user.emailVerified;
      if (statusFilter === "unverified") return !user.emailVerified;
      return true;
    });
  }, [users, statusFilter]);

  const handleViewDetails = (user: any) => {
    router.push(`/admin/users/${user.userId}`);
  };

  const handleQuickView = (user: any) => {
    setSelectedUser(user);
    setDetailsModalOpen(true);
  };

  const handleRefresh = () => {
    refetchUsers();
  };

  const getUserStatusColor = (user: any) => {
    if (user.blocked) return "danger";
    if (!user.emailVerified) return "warning";
    return "success";
  };

  const getUserStatus = (user: any) => {
    if (user.blocked) return "Blocked";
    if (!user.emailVerified) return "Unverified";
    return "Active";
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatLastLogin = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 5) return "Just now";
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else {
      return formatDate(dateString);
    }
  };

  const totalPages = Math.ceil(totalUsers / perPage);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography level="h2" sx={{ mb: 0.5 }}>
          User Management
        </Typography>
        <Typography level="body-md" sx={{ color: "text.secondary" }}>
          Manage Auth0 users and their roles
        </Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <Input
          placeholder="Search by email, name, or user ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startDecorator={<SearchOutlined />}
          sx={{
            flex: 1,
            minWidth: 300,
          }}
        />

        <Select
          value={statusFilter}
          onChange={(_, value) => setStatusFilter(value as string)}
          sx={{
            minWidth: 140,
          }}
        >
          <Option value="all">All Status</Option>
          <Option value="active">Active</Option>
          <Option value="blocked">Blocked</Option>
          <Option value="verified">Verified</Option>
          <Option value="unverified">Unverified</Option>
        </Select>

        <Select
          value={perPage}
          onChange={(_, value) => {
            setPerPage(value as number);
            setCurrentPage(0);
          }}
          sx={{
            minWidth: 100,
          }}
        >
          <Option value={10}>10</Option>
          <Option value={25}>25</Option>
          <Option value={50}>50</Option>
          <Option value={100}>100</Option>
        </Select>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} variant="outlined">
            <RefreshOutlined />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Total Users
          </Typography>
          <Typography level="h3">{totalUsers}</Typography>
        </Card>
        <Card sx={{ flex: 1 }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Active
          </Typography>
          <Typography level="h3" sx={{ color: "success.500" }}>
            {users.filter((u) => !u.blocked).length}
          </Typography>
        </Card>
        <Card sx={{ flex: 1 }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Verified
          </Typography>
          <Typography level="h3" sx={{ color: "primary.500" }}>
            {users.filter((u) => u.emailVerified).length}
          </Typography>
        </Card>
        <Card sx={{ flex: 1 }}>
          <Typography level="body-sm" sx={{ color: "text.secondary" }}>
            Blocked
          </Typography>
          <Typography level="h3" sx={{ color: "danger.500" }}>
            {users.filter((u) => u.blocked).length}
          </Typography>
        </Card>
      </Box>

      {/* Users Table */}
      {usersLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Sheet
            variant="outlined"
            sx={{
              borderRadius: "sm",
              overflow: "auto",
            }}
          >
            <Table
              stickyHeader
              hoverRow
              sx={{
                "--TableCell-headBackground": "transparent",
                "--Table-headerUnderlineThickness": "1px",
                "& thead th": {
                  fontSize: "13px",
                  fontWeight: 600,
                },
                "& tbody td": {
                  fontSize: "13px",
                },
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: "30%" }}>User</th>
                  <th style={{ width: "15%" }}>Status</th>
                  <th style={{ width: "15%" }}>Created</th>
                  <th style={{ width: "15%" }}>Last Login</th>
                  <th style={{ width: "10%" }}>Logins</th>
                  <th style={{ width: "15%" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          size="sm"
                          src={user.picture || undefined}
                          sx={{
                            bgcolor: user.picture ? "transparent" : "primary.softBg",
                            fontSize: "14px",
                          }}
                        >
                          {!user.picture && (user.name?.[0] || user.email?.[0] || "U")}
                        </Avatar>
                        <Box>
                          <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                            {user.name || user.nickname || "No name"}
                          </Typography>
                          <Typography level="body-xs" sx={{ color: "text.secondary" }}>
                            {user.email}
                          </Typography>
                          <Typography
                            level="body-xs"
                            sx={{ color: "text.tertiary", fontSize: "11px" }}
                          >
                            ID: {user.userId}
                          </Typography>
                        </Box>
                      </Box>
                    </td>
                    <td>
                      <Stack direction="row" spacing={0.5}>
                        <Chip
                          size="sm"
                          color={getUserStatusColor(user)}
                          variant="soft"
                          sx={{ fontSize: "12px" }}
                        >
                          {getUserStatus(user)}
                        </Chip>
                        {user.emailVerified && (
                          <Tooltip title="Email Verified">
                            <VerifiedOutlined sx={{ fontSize: 16, color: "primary.500" }} />
                          </Tooltip>
                        )}
                        {user.multifactor && user.multifactor.length > 0 && (
                          <Tooltip title="MFA Enabled">
                            <ShieldOutlined sx={{ fontSize: 16, color: "success.500" }} />
                          </Tooltip>
                        )}
                      </Stack>
                    </td>
                    <td>
                      <Typography level="body-sm">{formatDate(user.createdAt)}</Typography>
                    </td>
                    <td>
                      <Typography level="body-sm">{formatLastLogin(user.lastLogin)}</Typography>
                    </td>
                    <td>
                      <Typography level="body-sm">{user.loginsCount || 0}</Typography>
                    </td>
                    <td>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="sm"
                            variant="plain"
                            onClick={() => handleViewDetails(user)}
                          >
                            <VisibilityOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Quick View">
                          <IconButton
                            size="sm"
                            variant="plain"
                            onClick={() => handleQuickView(user)}
                            sx={{ color: "neutral.400" }}
                          >
                            <PersonOutlined />
                          </IconButton>
                        </Tooltip>
                        <Dropdown>
                          <MenuButton
                            slots={{ root: IconButton }}
                            slotProps={{
                              root: {
                                size: "sm",
                                variant: "plain",
                                sx: { color: "neutral.400" },
                              },
                            }}
                          >
                            <MoreVertOutlined />
                          </MenuButton>
                          <Menu size="sm">
                            <MenuItem onClick={() => handleViewDetails(user)}>
                              <AdminPanelSettingsOutlined sx={{ mr: 1 }} />
                              Manage Roles
                            </MenuItem>
                            <MenuItem onClick={() => handleViewDetails(user)}>
                              <HistoryOutlined sx={{ mr: 1 }} />
                              View Activity
                            </MenuItem>
                          </Menu>
                        </Dropdown>
                      </Box>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Sheet>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 3 }}>
              <Button
                size="sm"
                variant="outlined"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2 }}>
                <Typography level="body-sm">
                  Page {currentPage + 1} of {totalPages}
                </Typography>
              </Box>
              <Button
                size="sm"
                variant="outlined"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Quick View Modal */}
      <Modal open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)}>
        <ModalDialog sx={{ width: 500 }}>
          <ModalClose />
          <Typography level="h4" sx={{ mb: 2 }}>
            User Quick View
          </Typography>
          {selectedUser && (
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  size="lg"
                  src={selectedUser.picture || undefined}
                  sx={{ bgcolor: selectedUser.picture ? "transparent" : "primary.softBg" }}
                >
                  {!selectedUser.picture &&
                    (selectedUser.name?.[0] || selectedUser.email?.[0] || "U")}
                </Avatar>
                <Box>
                  <Typography level="title-md">
                    {selectedUser.name || selectedUser.nickname || "No name"}
                  </Typography>
                  <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                    {selectedUser.email}
                  </Typography>
                  <Chip
                    size="sm"
                    color={getUserStatusColor(selectedUser)}
                    variant="soft"
                    sx={{ mt: 0.5 }}
                  >
                    {getUserStatus(selectedUser)}
                  </Chip>
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography level="body-sm" sx={{ color: "text.secondary", mb: 1 }}>
                  Account Information
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                      User ID:
                    </Typography>
                    <Typography level="body-sm" sx={{ fontFamily: "monospace", fontSize: "12px" }}>
                      {selectedUser.userId}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                      Email Verified:
                    </Typography>
                    <Typography level="body-sm">
                      {selectedUser.emailVerified ? "Yes" : "No"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                      MFA Enabled:
                    </Typography>
                    <Typography level="body-sm">
                      {selectedUser.multifactor && selectedUser.multifactor.length > 0
                        ? "Yes"
                        : "No"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                      Created:
                    </Typography>
                    <Typography level="body-sm">{formatDate(selectedUser.createdAt)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                      Last Login:
                    </Typography>
                    <Typography level="body-sm">
                      {formatLastLogin(selectedUser.lastLogin)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                      Login Count:
                    </Typography>
                    <Typography level="body-sm">{selectedUser.loginsCount || 0}</Typography>
                  </Box>
                </Stack>
              </Box>

              <Divider />

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="solid"
                  sx={{ flex: 1 }}
                  onClick={() => {
                    setDetailsModalOpen(false);
                    handleViewDetails(selectedUser);
                  }}
                >
                  View Full Details
                </Button>
                <Button
                  variant="outlined"
                  sx={{ flex: 1 }}
                  onClick={() => setDetailsModalOpen(false)}
                >
                  Close
                </Button>
              </Box>
            </Stack>
          )}
        </ModalDialog>
      </Modal>
    </Box>
  );
}
