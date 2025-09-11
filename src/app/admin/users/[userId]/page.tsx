"use client";

import { graphql } from "@/graphql";
import {
  useAssignRolesToUserMutation,
  useGetUserByIdQuery,
  useGetUserRolesQuery,
  useListRolesQuery,
  useRemoveRolesFromUserMutation,
} from "@/graphql/hooks";
import {
  ArrowBackOutlined,
  BlockOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EmailOutlined,
  HistoryOutlined,
  KeyOutlined,
  PersonOutlined,
  PhoneOutlined,
  RefreshOutlined,
  SaveOutlined,
  SecurityOutlined,
  ShieldOutlined,
  VerifiedOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  Modal,
  ModalClose,
  ModalDialog,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/joy";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// GraphQL queries and mutations
graphql(`
  query GetUserById($userId: String!) {
    admin {
      getUserById(userId: $userId) {
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
        lastIp
        username
        identities {
          provider
          userId
          connection
          isSocial
          accessToken
        }
      }
    }
  }
`);

graphql(`
  query GetUserRoles($userId: String!) {
    admin {
      getUserRoles(userId: $userId) {
        id
        name
        description
      }
    }
  }
`);

graphql(`
  mutation AssignRolesToUser($userId: String!, $roleIds: String!) {
    admin {
      assignRolesToUser(userId: $userId, roleIds: $roleIds)
    }
  }
`);

graphql(`
  mutation RemoveRolesFromUser($userId: String!, $roleIds: String!) {
    admin {
      removeRolesFromUser(userId: $userId, roleIds: $roleIds)
    }
  }
`);

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  // Decode the URI-encoded userId parameter
  const userId = decodeURIComponent(params.userId as string);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [isEditingRoles, setIsEditingRoles] = useState(false);

  // Fetch user details
  const {
    data: userData,
    loading: userLoading,
    refetch: refetchUser,
  } = useGetUserByIdQuery({
    variables: { userId },
    fetchPolicy: "cache-and-network",
  });

  // Fetch user roles
  const {
    data: userRolesData,
    loading: rolesLoading,
    refetch: refetchUserRoles,
  } = useGetUserRolesQuery({
    variables: { userId },
    fetchPolicy: "cache-and-network",
  });

  // Fetch all available roles
  const { data: allRolesData } = useListRolesQuery({
    fetchPolicy: "cache-and-network",
  });

  // Mutations
  const [assignRoles] = useAssignRolesToUserMutation();
  const [removeRoles] = useRemoveRolesFromUserMutation();

  const user = userData?.admin?.getUserById;
  const userRoles = userRolesData?.admin?.getUserRoles || [];
  const allRoles = allRolesData?.admin?.listRoles || [];

  // Initialize selected roles when user roles are loaded
  useEffect(() => {
    if (userRoles && userRoles.length > 0) {
      const roleIds = userRoles.map((role: any) => role?.id).filter(Boolean);
      setSelectedRoles((prevRoles) => {
        // Only update if the role IDs have actually changed
        const prevRoleIds = Array.from(prevRoles).sort();
        const newRoleIds = roleIds.sort();
        if (JSON.stringify(prevRoleIds) !== JSON.stringify(newRoleIds)) {
          return new Set(roleIds);
        }
        return prevRoles;
      });
    }
  }, [userRoles?.length]); // Only depend on the length to avoid infinite loops

  const handleRoleToggle = (roleId: string) => {
    const newSelectedRoles = new Set(selectedRoles);
    if (newSelectedRoles.has(roleId)) {
      newSelectedRoles.delete(roleId);
    } else {
      newSelectedRoles.add(roleId);
    }
    setSelectedRoles(newSelectedRoles);
  };

  const handleSaveRoles = async () => {
    if (!user) return;

    const currentRoleIds = new Set(userRoles.map((role: any) => role?.id).filter(Boolean));
    const rolesToAdd = Array.from(selectedRoles).filter((id) => !currentRoleIds.has(id));
    const rolesToRemove = Array.from(currentRoleIds).filter((id) => !selectedRoles.has(id));

    try {
      // Add new roles
      if (rolesToAdd.length > 0) {
        await assignRoles({
          variables: {
            userId: user.userId,
            roleIds: rolesToAdd.join(","),
          },
        });
      }

      // Remove roles
      if (rolesToRemove.length > 0) {
        await removeRoles({
          variables: {
            userId: user.userId,
            roleIds: rolesToRemove.join(","),
          },
        });
      }

      // Refresh data
      await refetchUserRoles();
      setIsEditingRoles(false);
    } catch (error) {
      console.error("Error updating roles:", error);
    }
  };

  const handleCancelRoleEdit = () => {
    setSelectedRoles(new Set(userRoles.map((role: any) => role?.id).filter(Boolean)));
    setIsEditingRoles(false);
  };

  const handleRefresh = () => {
    refetchUser();
    refetchUserRoles();
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserStatusColor = () => {
    if (!user) return "neutral";
    if (user.blocked) return "danger";
    if (!user.emailVerified) return "warning";
    return "success";
  };

  const getUserStatus = () => {
    if (!user) return "Unknown";
    if (user.blocked) return "Blocked";
    if (!user.emailVerified) return "Unverified";
    return "Active";
  };

  if (userLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3, minHeight: "100vh" }}>
        <Alert color="danger">User not found</Alert>
        <Button
          startDecorator={<ArrowBackOutlined />}
          onClick={() => router.push("/admin/users")}
          sx={{ mt: 2 }}
        >
          Back to Users
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton onClick={() => router.push("/admin/users")} variant="outlined">
          <ArrowBackOutlined />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography level="h2" sx={{ mb: 0.5 }}>
            User Details
          </Typography>
          <Typography level="body-md">Manage user account and roles</Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} variant="outlined">
            <RefreshOutlined />
          </IconButton>
        </Tooltip>
      </Box>

      {/* User Overview Card */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <Avatar
            size="lg"
            src={user.picture || undefined}
            sx={{
              width: 80,
              height: 80,
              bgcolor: user.picture ? "transparent" : "primary.softBg",
            }}
          >
            {!user.picture && (user.name?.[0] || user.email?.[0] || "U")}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography level="h3" sx={{ mb: 0.5 }}>
              {user.name || user.nickname || "No name"}
            </Typography>
            <Typography level="body-md" sx={{ mb: 1 }}>
              {user.email}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip size="sm" color={getUserStatusColor()} variant="soft">
                {getUserStatus()}
              </Chip>
              {user.emailVerified && (
                <Chip
                  size="sm"
                  color="primary"
                  variant="soft"
                  startDecorator={<VerifiedOutlined />}
                >
                  Email Verified
                </Chip>
              )}
              {user.multifactor && user.multifactor.length > 0 && (
                <Chip size="sm" color="success" variant="soft" startDecorator={<ShieldOutlined />}>
                  MFA Enabled
                </Chip>
              )}
            </Stack>
          </Box>
        </Box>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value as number)}
        sx={{ bgcolor: "transparent" }}
      >
        <TabList sx={{ borderRadius: "sm", mb: 2 }}>
          <Tab>Details</Tab>
          <Tab>Roles & Permissions</Tab>
          <Tab>Activity</Tab>
          <Tab>Metadata</Tab>
        </TabList>

        {/* Details Tab */}
        <TabPanel value={0} sx={{ p: 0 }}>
          <Card>
            <Typography level="title-md" sx={{ mb: 2 }}>
              Account Information
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography level="body-sm" sx={{ mb: 0.5 }}>
                  User ID
                </Typography>
                <Typography level="body-md" sx={{ fontFamily: "monospace", fontSize: "13px" }}>
                  {user.userId}
                </Typography>
              </Box>
              <Box>
                <Typography level="body-sm" sx={{ mb: 0.5 }}>
                  Username
                </Typography>
                <Typography level="body-md">{user.username || "Not set"}</Typography>
              </Box>
              <Box>
                <Typography level="body-sm" sx={{ mb: 0.5 }}>
                  Email
                </Typography>
                <Typography level="body-md">{user.email}</Typography>
              </Box>
              <Box>
                <Typography level="body-sm" sx={{ mb: 0.5 }}>
                  Phone
                </Typography>
                <Typography level="body-md">{user.phoneNumber || "Not set"}</Typography>
              </Box>
              <Box>
                <Typography level="body-sm" sx={{ mb: 0.5 }}>
                  Created
                </Typography>
                <Typography level="body-md">{formatDate(user.createdAt)}</Typography>
              </Box>
              <Box>
                <Typography level="body-sm" sx={{ mb: 0.5 }}>
                  Last Updated
                </Typography>
                <Typography level="body-md">{formatDate(user.updatedAt)}</Typography>
              </Box>
              <Box>
                <Typography level="body-sm" sx={{ mb: 0.5 }}>
                  Last Login
                </Typography>
                <Typography level="body-md">{formatDate(user.lastLogin)}</Typography>
              </Box>
              <Box>
                <Typography level="body-sm" sx={{ mb: 0.5 }}>
                  Login Count
                </Typography>
                <Typography level="body-md">{user.loginsCount || 0}</Typography>
              </Box>
              <Box>
                <Typography level="body-sm" sx={{ mb: 0.5 }}>
                  Last IP
                </Typography>
                <Typography level="body-md" sx={{ fontFamily: "monospace", fontSize: "13px" }}>
                  {user.lastIp || "Unknown"}
                </Typography>
              </Box>
              <Box>
                <Typography level="body-sm" sx={{ mb: 0.5 }}>
                  MFA Methods
                </Typography>
                <Typography level="body-md">{user.multifactor?.join(", ") || "None"}</Typography>
              </Box>
            </Box>

            {user.identities && user.identities.length > 0 && (
              <Box>
                <Divider sx={{ my: 3 }} />
                <Typography level="title-md" sx={{ mb: 2 }}>
                  Identity Providers
                </Typography>
                <Stack spacing={1}>
                  {user.identities.map((identity, index) => {
                    if (!identity) return null;
                    return (
                      <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Chip size="sm" variant="soft">
                          {identity.provider}
                        </Chip>
                        <Typography level="body-sm">Connection: {identity.connection}</Typography>
                        {identity.isSocial && (
                          <Chip size="sm" color="primary" variant="soft">
                            Social
                          </Chip>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Card>
        </TabPanel>

        {/* Roles Tab */}
        <TabPanel value={1} sx={{ p: 0 }}>
          <Card>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography level="title-md" sx={{ flex: 1 }}>
                Assigned Roles
              </Typography>
              {!isEditingRoles ? (
                <Button
                  size="sm"
                  startDecorator={<EditOutlined />}
                  onClick={() => setIsEditingRoles(true)}
                >
                  Edit Roles
                </Button>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button size="sm" variant="outlined" onClick={handleCancelRoleEdit}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    startDecorator={<SaveOutlined />}
                    onClick={handleSaveRoles}
                  >
                    Save Changes
                  </Button>
                </Stack>
              )}
            </Box>

            {rolesLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size="sm" />
              </Box>
            ) : (
              <List sx={{ gap: 1 }}>
                {allRoles.map((role) => {
                  if (!role) return null;
                  const isAssigned = selectedRoles.has(role.id);
                  return (
                    <ListItem
                      key={role.id}
                      sx={{
                        bgcolor: isAssigned ? "primary.softBg" : "transparent",
                        borderRadius: "sm",
                        p: 2,
                        border: "1px solid",
                        borderColor: isAssigned ? "primary.400" : "neutral.300",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                        {isEditingRoles && (
                          <Checkbox
                            checked={isAssigned}
                            onChange={() => handleRoleToggle(role.id)}
                            sx={{ mr: 2 }}
                          />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography level="body-md" sx={{ fontWeight: 500 }}>
                            {role.name}
                          </Typography>
                          {role.description && (
                            <Typography level="body-sm">{role.description}</Typography>
                          )}
                        </Box>
                        {!isEditingRoles && isAssigned && (
                          <Chip size="sm" color="primary" variant="soft">
                            Assigned
                          </Chip>
                        )}
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Card>
        </TabPanel>

        {/* Activity Tab */}
        <TabPanel value={2} sx={{ p: 0 }}>
          <Card>
            <Typography level="title-md" sx={{ mb: 2 }}>
              Login Activity
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <Box>
                <Typography level="body-sm" sx={{ mb: 0.5 }}>
                  Last Login
                </Typography>
                <Typography level="body-md">{formatDate(user.lastLogin)}</Typography>
              </Box>
              <Box>
                <Typography level="body-sm" sx={{ mb: 0.5 }}>
                  Total Logins
                </Typography>
                <Typography level="body-md">{user.loginsCount || 0}</Typography>
              </Box>
            </Box>
          </Card>
        </TabPanel>

        {/* Metadata Tab */}
        <TabPanel value={3} sx={{ p: 0 }}>
          <Stack spacing={2}>
            {user.appMetadata && Object.keys(user.appMetadata).length > 0 && (
              <Card>
                <Typography level="title-md" sx={{ mb: 2 }}>
                  App Metadata
                </Typography>
                <Box
                  sx={{
                    bgcolor: "neutral.softBg",
                    p: 2,
                    borderRadius: "sm",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    overflowX: "auto",
                  }}
                >
                  <pre>{JSON.stringify(user.appMetadata, null, 2)}</pre>
                </Box>
              </Card>
            )}

            {user.userMetadata && Object.keys(user.userMetadata).length > 0 && (
              <Card>
                <Typography level="title-md" sx={{ mb: 2 }}>
                  User Metadata
                </Typography>
                <Box
                  sx={{
                    bgcolor: "neutral.softBg",
                    p: 2,
                    borderRadius: "sm",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    overflowX: "auto",
                  }}
                >
                  <pre>{JSON.stringify(user.userMetadata, null, 2)}</pre>
                </Box>
              </Card>
            )}

            {(!user.appMetadata || Object.keys(user.appMetadata).length === 0) &&
              (!user.userMetadata || Object.keys(user.userMetadata).length === 0) && (
                <Card>
                  <Alert color="neutral" variant="soft">
                    No metadata available for this user.
                  </Alert>
                </Card>
              )}
          </Stack>
        </TabPanel>
      </Tabs>
    </Box>
  );
}
