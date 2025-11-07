"use client";

import Client from "@searchkit/instantsearch-client";

/**
 * Creates a SearchKit client for use with React InstantSearch
 *
 * This creates a client that proxies search requests to the backend API endpoint.
 * The backend handles all Searchkit configuration and OpenSearch communication.
 *
 * @param token - JWT Bearer token from Auth0 for authentication
 * @param searchApiUrl - The search API endpoint URL from configuration
 * @param workspaceId - Optional workspace ID to filter search results by workspace
 * @returns InstantSearch-compatible search client
 */
export function createSearchClient(token: string, searchApiUrl: string, workspaceId?: string) {
  return Client({
    url: searchApiUrl,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(workspaceId && { "X-Workspace-Id": workspaceId }),
    },
  });
}
