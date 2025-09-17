"use client";

import { graphql } from "@/graphql";
import { useWorkspaceProviderListWorkspacesQuery } from "@/graphql/hooks";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { createContext, ReactNode, useCallback, useContext, useMemo } from "react";

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
  isLoadingWorkspaces: boolean;
  selectWorkspace: (workspaceId: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};

/**
 * Hook to get the currently selected workspace ID from the URL
 * This is the single source of truth for workspace selection
 */
export const useSelectedWorkspaceId = (): string | null => {
  const params = useParams<{ workspace_id?: string }>();
  return params?.workspace_id || null;
};

/**
 * Hook to get the currently selected workspace object
 * Combines URL-derived workspace ID with workspace data
 */
export const useSelectedWorkspace = (): WorkspaceItem | null => {
  const { workspaces } = useWorkspace();
  const workspaceId = useSelectedWorkspaceId();

  return useMemo(() => {
    if (!workspaceId || !workspaces) return null;
    return workspaces.find((workspace) => workspace.id === workspaceId) || null;
  }, [workspaceId, workspaces]);
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname() || "";

  const { data, loading: workspacesLoading } = useWorkspaceProviderListWorkspacesQuery({
    fetchPolicy: "cache-and-network",
  });

  const workspaces = data?.listWorkspaces?.items;

  const selectWorkspace = useCallback(
    (workspaceId: string) => {
      // If already within this workspace path, don't navigate
      if (pathname === `/app/${workspaceId}` || pathname.startsWith(`/app/${workspaceId}/`)) {
        return;
      }
      router.push(`/app/${workspaceId}`);
    },
    [router, pathname],
  );

  const value: WorkspaceContextType = {
    workspaces,
    isLoadingWorkspaces: workspacesLoading,
    selectWorkspace,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
