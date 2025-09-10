"use client";

import { useAuth0 } from "@auth0/auth0-react";

// Define the available roles as string literals
type Role = "PLATFORM_ADMIN" | "USER";

interface Organization {
  id: string;
  name: string;
  display_name?: string;
}

interface Auth0ErpUser {
  // Standard Auth0 fields
  email?: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
  sub?: string;
  updated_at?: string;

  // Custom ERP claims
  organizations?: Organization[];
  roles?: Role[];
  permissions?: string[];
  workspaceId?: string;
  companyId?: string;
  userId?: string;
  orgId?: string; // Current organization ID from token

  // Helper methods
  isPlatformAdmin: boolean;
  hasRole: (role: Role) => boolean;
  hasPermission: (permission: string) => boolean;
  hasOrganization: (orgId: string) => boolean;
}

/**
 * Custom hook to access Auth0 user with ERP-specific custom claims
 * Provides type-safe access to custom claims and helper methods
 */
export function useAuth0ErpUser(): {
  user: Auth0ErpUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error?: Error;
} {
  const { user: auth0User, isLoading, isAuthenticated, error } = useAuth0();

  if (!auth0User) {
    return {
      user: null,
      isLoading,
      isAuthenticated,
      error,
    };
  }

  // Extract custom claims from the Auth0 user object
  const organizations = auth0User["https://erp.estrack.com/organizations"] as
    | Organization[]
    | undefined;
  const roles = auth0User["https://erp.estrack.com/es_erp_roles"] as Role[] | undefined;
  const permissions = auth0User["https://erp.estrack.com/permissions"] as string[] | undefined;
  const workspaceId = auth0User["https://erp.estrack.com/workspace_id"] as string | undefined;
  const companyId = auth0User["https://erp.estrack.com/company_id"] as string | undefined;
  const userId = auth0User["https://erp.estrack.com/user_id"] as string | undefined;

  // Get the current organization ID from the token (standard Auth0 claim)
  const orgId = (auth0User.org_id || auth0User["https://erp.estrack.com/org_id"]) as
    | string
    | undefined;

  // Create the enhanced user object with helper methods
  const erpUser: Auth0ErpUser = {
    // Standard Auth0 fields
    email: auth0User.email,
    email_verified: auth0User.email_verified,
    name: auth0User.name,
    nickname: auth0User.nickname,
    picture: auth0User.picture,
    sub: auth0User.sub,
    updated_at: auth0User.updated_at,

    // Custom ERP claims
    organizations,
    roles,
    permissions,
    workspaceId,
    companyId,
    userId,
    orgId,

    // Helper methods
    isPlatformAdmin: roles?.includes("PLATFORM_ADMIN") ?? false,

    hasRole: (role: Role) => {
      return roles?.includes(role) ?? false;
    },

    hasPermission: (permission: string) => {
      return permissions?.includes(permission) ?? false;
    },

    hasOrganization: (orgId: string) => {
      return organizations?.some((org) => org.id === orgId) ?? false;
    },
  };

  return {
    user: erpUser,
    isLoading,
    isAuthenticated,
    error,
  };
}

// Export types for use in other components
export type { Auth0ErpUser, Organization, Role };
