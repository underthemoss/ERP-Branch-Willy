"use client";

import Client from "@searchkit/instantsearch-client";

/**
 * Gets the search API endpoint URL from existing GraphQL configuration
 *
 * The search endpoint is derived by replacing /graphql with /api/search/_msearch:
 * - GraphQL URL: http://localhost:5000/graphql -> Search URL: http://localhost:5000/api/search/_msearch
 * - GraphQL URL: https://api.example.com/es-erp-api/graphql -> Search URL: https://api.example.com/es-erp-api/api/search/_msearch
 *
 * This matches the backend FastifyPluginAsync endpoint at POST /api/search/_msearch
 */
export function getSearchApiUrl(): string {
  const graphqlUrl = process.env.NEXT_PUBLIC_GQL_URL!;

  // Parse the URL and extract the path prefix (everything before /graphql)
  const url = new URL(graphqlUrl);
  const pathPrefix = url.pathname.replace(/\/graphql$/, "");

  // Construct the search URL preserving the path prefix and adding the _msearch endpoint
  return `${url.protocol}//${url.host}${pathPrefix}/api/search/_msearch`;
}

/**
 * Creates a SearchKit client for use with React InstantSearch
 *
 * This creates a client that proxies search requests to the backend API endpoint.
 * The backend handles all Searchkit configuration and OpenSearch communication.
 *
 * @param token - JWT Bearer token from Auth0 for authentication
 * @returns InstantSearch-compatible search client
 */
export function createSearchClient(token: string) {
  const url = getSearchApiUrl();

  return Client({
    url,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
