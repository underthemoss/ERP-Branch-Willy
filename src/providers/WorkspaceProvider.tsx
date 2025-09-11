"use client";

import { graphql } from "@/graphql";
import { useWorkspaceProviderListWorkspacesQuery } from "@/graphql/hooks";
import { useQuery } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Define comprehensive workspace query
graphql(`
  query WorkspaceProviderListWorkspaces {
    listWorkspaces {
      items {
        id
        name
        companyId
        description
        accessType
        archived
        archivedAt
        bannerImageUrl
        brandId
        domain
        logoUrl
        ownerId
        createdAt
        createdBy
        updatedAt
        updatedBy
      }
    }
  }
`);

// Extract the workspace item type from the query
type WorkspaceItem = NonNullable<
  NonNullable<ReturnType<typeof useWorkspaceProviderListWorkspacesQuery>["data"]>["listWorkspaces"]
>["items"][number];

interface WorkspaceContextType {
  workspaces: WorkspaceItem[] | undefined;
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
  const params = useParams<{ workspace_id?: string }>();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);

  const { data, loading: workspacesLoading } = useWorkspaceProviderListWorkspacesQuery({
    fetchPolicy: "cache-and-network",
  });

  const workspaces = data?.listWorkspaces?.items;

  // Extract workspace ID from params
  useEffect(() => {
    if (params?.workspace_id) {
      // Only set if different to avoid unnecessary re-renders
      if (params.workspace_id !== selectedWorkspace) {
        setSelectedWorkspace(params.workspace_id);
      }
    }
  }, [params?.workspace_id, selectedWorkspace]);

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

  const value: WorkspaceContextType = {
    workspaces,
    selectedWorkspace,
    isLoadingWorkspaces: workspacesLoading,
    selectWorkspace,
    clearWorkspace,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
