"use client";

import { graphql } from "@/graphql";
import { useListWorkspaceMembersQuery } from "@/graphql/hooks";
import { useSelectedWorkspace, useWorkspace } from "@/providers/WorkspaceProvider";
import { Group, Warning } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Paper,
} from "@mui/material";
import { useParams } from "next/navigation";

// Define the GraphQL query for listing workspace members
graphql(`
  query ListWorkspaceMembers($workspaceId: String!) {
    listWorkspaceMembers(workspaceId: $workspaceId) {
      items {
        userId
        role
        user {
          id
          email
          firstName
          lastName
          companyId
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

  // Fetch workspace members
  const { data, loading, error } = useListWorkspaceMembersQuery({
    variables: {
      workspaceId: workspaceId || "",
    },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  const members = data?.listWorkspaceMembers?.items || [];

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
      case "ADMIN":
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
      case "ADMIN":
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
      </Box>

      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Member</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="center">Company ID</TableCell>
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

                return (
                  <TableRow key={member.userId} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 40,
                            height: 40,
                          }}
                        >
                          {getInitials(user?.firstName, user?.lastName, user?.email)}
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
                      <Chip
                        label={getRoleLabel(member.role)}
                        color={getRoleColor(member.role)}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                        {user?.companyId || "-"}
                      </Typography>
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
    </Box>
  );
}
