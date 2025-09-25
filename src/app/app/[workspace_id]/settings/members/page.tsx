"use client";

import { graphql } from "@/graphql";
import { useListWorkspaceMembersQuery } from "@/graphql/hooks";
import { useSelectedWorkspace, useWorkspace } from "@/providers/WorkspaceProvider";
import { Group, Map, PersonAdd, Warning } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import { useState } from "react";
import InviteMemberDialog from "./components/InviteMemberDialog";
import MembersMapDialog from "./components/MembersMapDialog";

// Define the GraphQL query for listing workspace members
graphql(`
  query ListWorkspaceMembers($workspaceId: String!) {
    listWorkspaceMembers(workspaceId: $workspaceId) {
      items {
        userId
        roles
        user {
          id
          email
          firstName
          lastName
          picture
          lastLoginLocation {
            city
            countryCode
            countryName
            latitude
            longitude
            timezone
          }
        }
      }
      page {
        number
        size
        totalItems
        totalPages
      }
    }
  }
`);

export default function WorkspaceMembersPage() {
  const params = useParams();
  const workspaceId = Array.isArray(params?.workspace_id)
    ? params.workspace_id[0]
    : params?.workspace_id;

  const currentWorkspace = useSelectedWorkspace();
  const { permissions, isLoadingPermissions } = useWorkspace();
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Fetch workspace members
  const { data, loading, error, refetch } = useListWorkspaceMembersQuery({
    variables: {
      workspaceId: workspaceId || "",
    },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const members = data?.listWorkspaceMembers?.items || [];

  // Check if user can invite members
  const canInvite = permissions?.permissionMap?.ERP_WORKSPACE_MANAGE;

  // Check if permissions are still loading
  if (isLoadingPermissions) {
    return (
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Check if user has read permissions
  if (!permissions?.permissionMap?.ERP_WORKSPACE_READ) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 8 }}>
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Warning sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You don&apos;t have permission to view workspace members. Please contact your workspace
            administrator for access.
          </Typography>
          <Button variant="contained" onClick={() => window.history.back()} sx={{ mt: 2 }}>
            Go Back
          </Button>
        </Card>
      </Box>
    );
  }

  if (loading && !data) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Card sx={{ p: 3, bgcolor: "error.light", color: "error.contrastText" }}>
          <Typography variant="h6">Error loading members</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {error.message}
          </Typography>
        </Card>
      </Box>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "primary";
      case "MEMBER":
        return "success";
      case "INVITED":
        return "warning";
      default:
        return "default";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "MEMBER":
        return "Member";
      case "INVITED":
        return "Invited";
      default:
        return role;
    }
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1200 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Group sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h4">Workspace Members</Typography>
            <Typography variant="body2" color="text.secondary">
              {members.length} {members.length === 1 ? "member" : "members"} in{" "}
              {currentWorkspace?.name || "this workspace"}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {canInvite && (
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setInviteDialogOpen(true)}
            >
              Invite Member
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Map />}
            onClick={() => setMapDialogOpen(true)}
            disabled={members.length === 0}
          >
            View on Map
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Member</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    No members found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              members.map((member: any) => {
                const user = member.user;
                const fullName =
                  user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName || user?.lastName || "Unknown User";

                const location = user?.lastLoginLocation;
                const locationDisplay =
                  location?.city && location?.countryName
                    ? `${location.city}, ${location.countryName}`
                    : location?.countryName || "-";

                return (
                  <TableRow key={member.userId} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar
                          src={user?.picture}
                          sx={{
                            bgcolor: "primary.main",
                            width: 40,
                            height: 40,
                          }}
                        >
                          {!user?.picture &&
                            getInitials(user?.firstName, user?.lastName, user?.email)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {fullName}
                          </Typography>
                          {user?.id && (
                            <Typography variant="caption" color="text.secondary">
                              ID: {user.id}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user?.email || "No email"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {member.roles && member.roles.length > 0 ? (
                          member.roles.map((role: string) => (
                            <Chip
                              key={role}
                              label={getRoleLabel(role)}
                              color={getRoleColor(role)}
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No roles assigned
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{locationDisplay}</Typography>
                      {location?.timezone && (
                        <Typography variant="caption" color="text.secondary">
                          {location.timezone}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {data?.listWorkspaceMembers?.page && data.listWorkspaceMembers.page.totalPages > 1 && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Page {data.listWorkspaceMembers.page.number} of{" "}
            {data.listWorkspaceMembers.page.totalPages}
          </Typography>
        </Box>
      )}

      <MembersMapDialog
        open={mapDialogOpen}
        onClose={() => setMapDialogOpen(false)}
        members={members}
      />

      <InviteMemberDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        workspaceId={workspaceId || ""}
        onInviteSuccess={() => {
          refetch();
        }}
      />
    </Box>
  );
}
