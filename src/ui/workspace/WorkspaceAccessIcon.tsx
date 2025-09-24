"use client";

import { WorkspaceAccessType } from "@/graphql/graphql";
import { Domain, Lock } from "@mui/icons-material";
import { SxProps, Theme, Tooltip } from "@mui/material";
import React from "react";

type AccessTypeInput =
  | WorkspaceAccessType
  | "SAME_DOMAIN"
  | "INVITE_ONLY"
  | string
  | null
  | undefined;

export interface WorkspaceAccessIconProps {
  accessType: AccessTypeInput;
  size?: number; // px
  color?: string; // CSS color (e.g. theme.palette.primary.main resolved by caller)
  tooltip?: boolean; // show tooltip label
  sx?: SxProps<Theme>;
  titlePlacement?: "inline" | "tooltip"; // reserved for future use
}

function normalizeAccessType(type: AccessTypeInput): "SAME_DOMAIN" | "INVITE_ONLY" | null {
  if (!type) return null;

  // Handle string inputs
  if (typeof type === "string") {
    const t = type.toUpperCase();
    if (t === "SAME_DOMAIN") return "SAME_DOMAIN";
    if (t === "INVITE_ONLY") return "INVITE_ONLY";
  }

  // Handle generated enum inputs
  try {
    if (type === WorkspaceAccessType.SameDomain) return "SAME_DOMAIN";
    if (type === WorkspaceAccessType.InviteOnly) return "INVITE_ONLY";
  } catch {
    // no-op
  }

  return null;
}

export const WorkspaceAccessIcon: React.FC<WorkspaceAccessIconProps> = ({
  accessType,
  size = 16,
  color,
  tooltip = true,
  sx,
}) => {
  const normalized = normalizeAccessType(accessType);
  if (!normalized) return null;

  const label = normalized === "SAME_DOMAIN" ? "Same domain workspace" : "Invite-only workspace";

  const icon =
    normalized === "SAME_DOMAIN" ? (
      <Domain sx={{ fontSize: size, color, ...(sx || {}) }} />
    ) : (
      <Lock sx={{ fontSize: size, color, ...(sx || {}) }} />
    );

  if (!tooltip) {
    return icon;
  }

  return (
    <Tooltip title={label} arrow>
      {icon}
    </Tooltip>
  );
};
