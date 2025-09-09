"use client";

import { useAuth0ErpUser, type Organization } from "@/hooks/useAuth0ErpUser";
import { useAuth0 } from "@auth0/auth0-react";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface OrganizationError {
  orgId: string;
  orgName?: string;
  type: "no-permission" | "other";
  message: string;
}

interface OrganizationContextType {
  organizations: Organization[] | undefined;
  selectedOrganization: string | null;
  isLoadingOrganizations: boolean;
  isSelectingOrganization: boolean;
  organizationError: OrganizationError | null;
  selectOrganization: (orgId: string) => Promise<void>;
  clearOrganization: () => void;
  clearOrganizationError: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const { getAccessTokenSilently } = useAuth0();
  const { user, isLoading: authLoading } = useAuth0ErpUser();
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [isSelectingOrganization, setIsSelectingOrganization] = useState(false);
  const [organizationError, setOrganizationError] = useState<OrganizationError | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const organizations = user?.organizations;

  const selectOrganization = useCallback(
    async (orgId: string) => {
      setIsSelectingOrganization(true);
      setOrganizationError(null); // Clear any previous errors

      try {
        // Try to get a token with the organization
        await getAccessTokenSilently({
          authorizationParams: {
            organization: orgId,
          },
          cacheMode: "off",
        });
        setSelectedOrganization(orgId);
      } catch (error: any) {
        console.error("Organization selection error:", error);
        const errorMessage = error?.message || error?.error_description || error?.toString() || "";
        const org = organizations?.find((o) => o.id === orgId);

        // Check if it's a permission error
        if (
          errorMessage.includes("User must have the USER role to authenticate") ||
          errorMessage.includes("USER role") ||
          errorMessage.includes("insufficient permissions")
        ) {
          // User doesn't have permission in this org
          setOrganizationError({
            orgId,
            orgName: org?.display_name || org?.name,
            type: "no-permission",
            message: `You don't have the necessary permissions to access ${org?.display_name || org?.name || "this organization"}.`,
          });
          setIsSelectingOrganization(false);
          return; // Don't fall back to org-less token for permission errors
        }

        // For other errors, set a generic error
        console.error("Failed to switch to organization token:", error);
        setOrganizationError({
          orgId,
          orgName: org?.display_name || org?.name,
          type: "other",
          message: `Failed to access ${org?.display_name || org?.name || "this organization"}. ${errorMessage}`,
        });
      } finally {
        setIsSelectingOrganization(false);
      }
    },
    [getAccessTokenSilently, organizations],
  );

  const clearOrganization = useCallback(() => {
    setSelectedOrganization(null);
    setOrganizationError(null);
  }, []);

  const clearOrganizationError = useCallback(() => {
    setOrganizationError(null);
  }, []);

  // Initialize organization from token or auto-select if only one
  useEffect(() => {
    if (!authLoading && !hasInitialized) {
      setHasInitialized(true);

      // First, check if there's already an orgId in the token
      if (user?.orgId) {
        // Verify the user still has access to this organization
        if (user.hasOrganization(user.orgId)) {
          // Try to validate the organization by getting a token with it
          selectOrganization(user.orgId).catch((error) => {
            console.error("Failed to use organization from token:", error);
            // Clear the invalid organization so user can select a different one
            setSelectedOrganization(null);
          });
          return;
        } else {
          // User has an orgId in token but no longer has access to it
          console.warn(`User has orgId ${user.orgId} in token but no longer has access to it`);
          // Clear it so they can select a different one
          setSelectedOrganization(null);
        }
      }

      // Otherwise, auto-select if only one organization
      if (organizations?.length === 1 && !selectedOrganization) {
        selectOrganization(organizations[0].id).catch((error) => {
          console.error("Failed to auto-select organization:", error);
        });
      }
    }
  }, [authLoading, organizations, selectedOrganization, selectOrganization, user, hasInitialized]);

  const value: OrganizationContextType = {
    organizations,
    selectedOrganization,
    isLoadingOrganizations: authLoading,
    isSelectingOrganization,
    organizationError,
    selectOrganization,
    clearOrganization,
    clearOrganizationError,
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};
