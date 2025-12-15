"use client";

import { graphql } from "@/graphql";
import { useGetProjectsAndContactsQuery, useGetStudioDataQuery } from "@/graphql/hooks";
import React from "react";
import { FileNode } from "./types";

// GraphQL Queries
graphql(`
  query GetStudioData($workspaceId: ID!) {
    listPriceBooks(filter: { workspaceId: $workspaceId }, page: { number: 1, size: 100 }) {
      items {
        id
        name
        location
        parentPriceBookId
      }
    }
    listPrices(filter: { workspaceId: $workspaceId }, page: { number: 1, size: 1000 }) {
      items {
        __typename
        ... on RentalPrice {
          id
          name
          priceType
          priceBook {
            id
          }
        }
        ... on SalePrice {
          id
          name
          priceType
          priceBook {
            id
          }
        }
      }
    }
  }
`);

graphql(`
  query GetProjectsAndContacts($workspaceId: String!) {
    listTopLevelProjects(workspaceId: $workspaceId) {
      id
      name
      project_code
      status
      sub_projects {
        id
        name
        project_code
        status
      }
    }
    listContacts(
      filter: { workspaceId: $workspaceId, contactType: BUSINESS }
      page: { number: 1, size: 100 }
    ) {
      items {
        ... on BusinessContact {
          id
          name
          contactType
          employees {
            items {
              id
              name
              email
              role
            }
          }
        }
      }
    }
  }
`);

graphql(`
  query GetProjectChildren($parentProjectId: String!) {
    listProjectsByParentProjectId(parent_project: $parentProjectId) {
      id
      name
      project_code
      status
      sub_projects {
        id
        name
        project_code
        status
      }
    }
  }
`);

interface VirtualFileSystemProps {
  workspaceId: string;
  onTreeDataReady: (data: FileNode[]) => void;
  onRefreshReady?: (refetchFn: () => void) => void;
}

export function VirtualFileSystem({
  workspaceId,
  onTreeDataReady,
  onRefreshReady,
}: VirtualFileSystemProps) {
  const {
    data: priceBookData,
    error: priceBookError,
    loading: priceBookLoading,
    refetch: refetchPriceBook,
  } = useGetStudioDataQuery({
    variables: { workspaceId },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: projectsData,
    error: projectsError,
    loading: projectsLoading,
    refetch: refetchProjects,
  } = useGetProjectsAndContactsQuery({
    variables: { workspaceId },
    fetchPolicy: "cache-and-network",
  });

  // Provide refresh function to parent
  React.useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(() => {
        refetchPriceBook();
        refetchProjects();
      });
    }
  }, [onRefreshReady, refetchPriceBook, refetchProjects]);

  // Log errors
  React.useEffect(() => {
    if (priceBookError) {
      console.error("PriceBook query error:", priceBookError);
    }
    if (projectsError) {
      console.error("Projects query error:", projectsError);
    }
  }, [priceBookError, projectsError]);

  // Build tree when both queries complete
  React.useEffect(() => {
    if (priceBookData && projectsData) {
      const treeData = buildFileTree(priceBookData, projectsData);
      onTreeDataReady(treeData);
    }
  }, [priceBookData, projectsData, onTreeDataReady]);

  // This component doesn't render anything - it just manages data
  return null;
}

function buildFileTree(priceBookData: any, projectsData: any): FileNode[] {
  const prices = priceBookData.listPrices?.items || [];
  const priceBooks = priceBookData.listPriceBooks?.items || [];

  const root: FileNode[] = [
    {
      id: "root-pricebooks",
      name: "Price Books",
      type: "folder",
      children: buildPriceBookNodes(priceBooks, prices),
    },
    {
      id: "root-projects",
      name: "Projects",
      type: "folder",
      children: buildProjectNodes(projectsData.listTopLevelProjects || []),
    },
    {
      id: "root-contacts",
      name: "Contacts",
      type: "folder",
      children: buildContactNodes(projectsData.listContacts?.items || []),
    },
  ];

  return root;
}

function buildPriceBookNodes(priceBooks: any[], prices: any[]): FileNode[] {
  return priceBooks.map((pb) => {
    // Find all prices belonging to this price book
    const priceBookPrices = prices.filter((price: any) => price.priceBook?.id === pb.id);

    return {
      id: `pricebook-${pb.id}`,
      name: pb.name || "Unnamed Price Book",
      type: "entity",
      entityType: "pricebook",
      entityId: pb.id,
      children:
        priceBookPrices.length > 0
          ? priceBookPrices.map((price: any) => ({
              id: `price-${price.id}`,
              name: `${price.name} (${price.priceType})`,
              type: "entity",
              entityType: "price",
              entityId: price.id,
            }))
          : undefined,
    };
  });
}

function buildProjectNodes(projects: any[]): FileNode[] {
  return projects.map((project) => {
    const hasChildren = project.sub_projects && project.sub_projects.length > 0;

    return {
      id: `project-${project.id}`,
      name: `${project.name} (${project.project_code})`,
      type: "entity",
      entityType: "project",
      entityId: project.id,
      children: hasChildren ? buildProjectNodes(project.sub_projects) : undefined,
      isLazyLoaded: true, // First level is already loaded
      hasUnloadedChildren: hasChildren,
    };
  });
}

function buildContactNodes(contacts: any[]): FileNode[] {
  return contacts.map((contact) => {
    const employees = contact.employees?.items || [];
    const hasEmployees = employees.length > 0;

    return {
      id: `contact-${contact.id}`,
      name: contact.name,
      type: "entity",
      entityType: "contact",
      entityId: contact.id,
      children: hasEmployees
        ? employees.map((emp: any) => ({
            id: `contact-${emp.id}`,
            name: `${emp.name} (${emp.role || "Employee"})`,
            type: "entity",
            entityType: "contact",
            entityId: emp.id,
            children: [],
          }))
        : undefined,
      isLazyLoaded: true, // Employees are already loaded
    };
  });
}
