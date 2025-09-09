"use client";

import { useFetchWorkspacesQuery } from "@/graphql/hooks";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useOrganization } from "./OrganizationProvider";

interface Workspace {
  id?: string | null | undefined;
  name?: string | null | undefined;
  companyId?: number | null | undefined;
}

interface WorkspaceContextType {
  workspaces: Workspace[] | undefined;
  selectedWorkspace: string | null;
  isLoadingWorkspaces: boolean;
  selectWorkspace: (workspaceId: string) => void;
  clearWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const router = useRouter();
  const { selectedOrg } = useOrganization();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);

  const { data, loading: workspacesLoading } = useFetchWorkspacesQuery({
    skip: !selectedOrg,
    fetchPolicy: "cache-and-network",
  });

  const workspaces = data?.listWorkspaces?.items;

  const selectWorkspace = useCallback(
    (workspaceId: string) => {
      setSelectedWorkspace(workspaceId);
      router.push(`/app/${workspaceId}`);
    },
    [router],
  );

  const clearWorkspace = useCallback(() => {
    setSelectedWorkspace(null);
  }, []);

  // Auto-redirect if only one workspace
  useEffect(() => {
    if (!workspacesLoading && workspaces?.length === 1 && selectedOrg && !selectedWorkspace) {
      const workspaceId = workspaces[0].id;
      if (workspaceId) {
        selectWorkspace(workspaceId);
      }
    }
  }, [workspaces, workspacesLoading, selectedOrg, selectedWorkspace, selectWorkspace]);

  const value: WorkspaceContextType = {
    workspaces,
    selectedWorkspace,
    isLoadingWorkspaces: workspacesLoading,
    selectWorkspace,
    clearWorkspace,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
