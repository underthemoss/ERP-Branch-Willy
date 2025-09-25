"use client";

import { graphql } from "@/graphql";
import { useInviteUserToWorkspaceMutation } from "@/graphql/hooks";
import { useNotification } from "@/providers/NotificationProvider";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import {
  AdminPanelSettings,
  Assignment,
  AttachMoney,
  ContactMail,
  Description,
  Email,
  Group,
  Inventory,
  LocalShipping,
  PersonAdd,
  Receipt,
  ShoppingCart,
  Store,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

// Define the GraphQL mutation for inviting users
graphql(`
  mutation InviteUserToWorkspace(
    $email: String!
    $roles: [WorkspaceUserRole!]!
    $workspaceId: String!
  ) {
    inviteUserToWorkspace(email: $email, roles: $roles, workspaceId: $workspaceId) {
      userId
      roles
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`);

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onInviteSuccess?: () => void;
}

// Role definitions with descriptions and icons - Currently restricted to admin only
const ROLE_DEFINITIONS = [
  {
    value: "admin",
    label: "Admin",
    description: "Full access to all workspace features and settings",
    icon: <AdminPanelSettings />,
    color: "error" as const,
  },
];

export default function InviteMemberDialog({
  open,
  onClose,
  workspaceId,
  onInviteSuccess,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["admin"]);
  const [emailError, setEmailError] = useState("");
  const { notifySuccess, notifyError } = useNotification();
  const { permissions } = useWorkspace();

  const [inviteUser, { loading }] = useInviteUserToWorkspaceMutation({
    onCompleted: (data) => {
      if (data?.inviteUserToWorkspace) {
        notifySuccess(`Successfully invited ${email} to the workspace`);
        handleClose();
        if (onInviteSuccess) {
          onInviteSuccess();
        }
      }
    },
    onError: (error) => {
      notifyError(error.message || "Failed to invite user");
    },
  });

  const handleClose = () => {
    setEmail("");
    setSelectedRoles(["admin"]);
    setEmailError("");
    onClose();
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (emailError) {
      setEmailError(validateEmail(newEmail));
    }
  };

  const handleInvite = async () => {
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    if (selectedRoles.length === 0) {
      notifyError("Please select at least one role");
      return;
    }

    await inviteUser({
      variables: {
        email: email.toLowerCase().trim(),
        roles: selectedRoles as any,
        workspaceId,
      },
    });
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        // Don't allow removing all roles
        if (prev.length === 1) {
          notifyError("At least one role must be selected");
          return prev;
        }
        return prev.filter((r) => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  // Check if user has permission to invite
  const canInvite = permissions?.permissionMap?.ERP_WORKSPACE_MANAGE;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonAdd color="primary" />
          <Typography variant="h6">Invite Member to Workspace</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {!canInvite ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            You don&apos;t have permission to invite members to this workspace. Only workspace
            admins can invite new members.
          </Alert>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              Invited users will receive an email invitation to join this workspace with the
              selected roles.
            </Alert>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={handleEmailChange}
                error={!!emailError}
                helperText={emailError}
                placeholder="user@example.com"
                disabled={loading}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: "action.active" }} />,
                }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                Role Assignment
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                New members will be invited as workspace administrators with full access to all
                features.
              </Alert>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {ROLE_DEFINITIONS.map((role) => (
                  <Box
                    key={role.value}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: "primary.main",
                      borderRadius: 1,
                      backgroundColor: "action.selected",
                      pointerEvents: "none", // Disable interaction since it's always selected
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ color: `${role.color}.main` }}>{role.icon}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {role.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {role.description}
                        </Typography>
                      </Box>
                      <Chip label="Selected" color="primary" size="small" />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleInvite}
          variant="contained"
          disabled={loading || !canInvite || !email || selectedRoles.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
        >
          {loading ? "Inviting..." : "Send Invitation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
