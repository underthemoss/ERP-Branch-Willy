"use client";

import { graphql } from "@/graphql";
import {
  ResourceType,
  useWorkspaceProviderJoinWorkspaceMutation,
  useWorkspaceProviderListJoinableWorkspacesQuery,
  useWorkspaceProviderListUserResourcePermissionsQuery,
  useWorkspaceProviderListWorkspacesQuery,
} from "@/graphql/hooks";
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

// Define joinable workspaces query
graphql(`
  query WorkspaceProviderListJoinableWorkspaces {
    listJoinableWorkspaces {
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

// Define join workspace mutation
graphql(`
  mutation WorkspaceProviderJoinWorkspace($workspaceId: String!) {
    joinWorkspace(workspaceId: $workspaceId) {
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
`);

// Define user permissions query
graphql(`
  query WorkspaceProviderListUserResourcePermissions(
    $resourceId: ID!
    $resourceType: ResourceType!
  ) {
    listUserResourcePermissions(resourceId: $resourceId, resourceType: $resourceType) {
      permissions {
        permissionMap {
          ERP_DOMAIN_IS_MEMBER
          ERP_WORKSPACE_CAN_JOIN
          ERP_WORKSPACE_MANAGE
          ERP_WORKSPACE_READ
        }
        permissions
        resourceId
        resourceType
      }
    }
  }
`);

// Extract the workspace item type from the query
type WorkspaceItem = NonNullable<
  NonNullable<ReturnType<typeof useWorkspaceProviderListWorkspacesQuery>["data"]>["listWorkspaces"]
>["items"][number];

// Extract the permissions type from the query
type UserPermissions = NonNullable<
  NonNullable<
    ReturnType<typeof useWorkspaceProviderListUserResourcePermissionsQuery>["data"]
  >["listUserResourcePermissions"]
>["permissions"];

interface WorkspaceContextType {
  workspaces: WorkspaceItem[] | undefined;
  joinableWorkspaces: WorkspaceItem[] | undefined;
  isLoadingWorkspaces: boolean;
  isLoadingJoinableWorkspaces: boolean;
  selectWorkspace: (workspaceId: string) => void;
  joinWorkspace: (workspaceId: string) => void;
  permissions: UserPermissions | undefined;
  isLoadingPermissions: boolean;
  refetchPermissions: () => void;
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
  const workspaceId = useSelectedWorkspaceId();

  const {
    data,
    loading: workspacesLoading,
    refetch: refetchWorkspaces,
  } = useWorkspaceProviderListWorkspacesQuery({
    fetchPolicy: "cache-and-network",
  });

  const {
    data: joinableData,
    loading: joinableWorkspacesLoading,
    refetch: refetchJoinableWorkspaces,
  } = useWorkspaceProviderListJoinableWorkspacesQuery({
    fetchPolicy: "cache-and-network",
  });

  // Fetch permissions for the current workspace
  const {
    data: permissionsData,
    loading: permissionsLoading,
    refetch: refetchPermissions,
  } = useWorkspaceProviderListUserResourcePermissionsQuery({
    variables: {
      resourceId: workspaceId || "",
      resourceType: ResourceType.ErpWorkspace,
    },
    skip: !workspaceId, // Skip if no workspace is selected
    fetchPolicy: "cache-and-network",
  });

  const [joinWorkspaceMutation] = useWorkspaceProviderJoinWorkspaceMutation();

  const workspaces = data?.listWorkspaces?.items;
  const joinableWorkspaces = joinableData?.listJoinableWorkspaces?.items;
  const permissions = permissionsData?.listUserResourcePermissions?.permissions;

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

  const joinWorkspace = useCallback(
    async (workspaceId: string) => {
      try {
        const result = await joinWorkspaceMutation({
          variables: { workspaceId },
        });

        if (result.data?.joinWorkspace) {
          // Successfully joined workspace
          // Refetch both workspace lists to update the UI
          await Promise.all([refetchWorkspaces(), refetchJoinableWorkspaces()]);

          // Navigate to the newly joined workspace
          router.push(`/app/${workspaceId}`);
        }
      } catch (error) {
        console.error("Failed to join workspace:", error);
        // TODO: Add proper error handling/notification here
        // For now, just log the error
      }
    },
    [joinWorkspaceMutation, refetchWorkspaces, refetchJoinableWorkspaces, router],
  );

  const value: WorkspaceContextType = {
    workspaces,
    joinableWorkspaces,
    isLoadingWorkspaces: workspacesLoading,
    isLoadingJoinableWorkspaces: joinableWorkspacesLoading,
    selectWorkspace,
    joinWorkspace,
    permissions,
    isLoadingPermissions: permissionsLoading,
    refetchPermissions: () => {
      refetchPermissions();
    },
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
