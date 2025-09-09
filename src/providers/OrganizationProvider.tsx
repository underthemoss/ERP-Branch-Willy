"use client";

import { useAuth0ErpUser, type Organization } from "@/hooks/useAuth0ErpUser";
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

interface OrganizationContextType {
  organizations: Organization[] | undefined;
  selectedOrg: Organization | undefined;
  isLoading: boolean;
  selectOrganization: (orgId: string) => void;
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
  const { user, isLoading } = useAuth0ErpUser();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const organizations = user?.organizations;

  // Select the first organization by default
  useEffect(() => {
    if (!isLoading && organizations?.length && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [isLoading, organizations, selectedOrgId]);

  // Get the selected organization details
  const selectedOrg = useMemo(() => {
    if (!selectedOrgId || !organizations) return undefined;
    return organizations.find((org) => org.id === selectedOrgId);
  }, [selectedOrgId, organizations]);

  const selectOrganization = (orgId: string) => {
    setSelectedOrgId(orgId);
  };

  const value: OrganizationContextType = {
    organizations,
    selectedOrg,
    isLoading,
    selectOrganization,
  };

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
};
