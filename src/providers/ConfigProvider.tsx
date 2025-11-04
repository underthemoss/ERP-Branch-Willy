"use client";

import React, { createContext, useContext } from "react";

/**
 * Application configuration values from environment variables
 * These are read at build time (module level) to ensure they're available in client components
 */
interface AppConfig {
  graphqlUrl: string;
  searchApiUrl: string;
  apiUrl: string;
  auth0Domain: string;
  auth0ClientId: string;
  auth0Audience: string;
}

/**
 * Derives the search API URL from the GraphQL URL
 * Replaces /graphql with /api/search/_msearch
 */
function getSearchApiUrl(graphqlUrl: string): string {
  const url = new URL(graphqlUrl);
  const pathPrefix = url.pathname.replace(/\/graphql$/, "");
  return `${url.protocol}//${url.host}${pathPrefix}/api/search/_msearch`;
}

// Read environment variables at module level (build time)
const graphqlUrl =
  process.env.NEXT_PUBLIC_GQL_URL ||
  (process.env.NEXT_PUBLIC_API_URL || "") + "/es-erp-api/graphql";

const config: AppConfig = {
  graphqlUrl,
  searchApiUrl: getSearchApiUrl(graphqlUrl),
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "",
  auth0Domain: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "",
  auth0ClientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "",
  auth0Audience: (process.env.NEXT_PUBLIC_API_URL || "") + "/es-erp-api",
};

const ConfigContext = createContext<AppConfig | undefined>(undefined);

/**
 * ConfigProvider makes application configuration available throughout the component tree
 * Environment variables are read at build time and provided via React Context
 */
export function ConfigProvider({ children }: { children: React.ReactNode }) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

/**
 * Hook to access application configuration
 * @throws Error if used outside of ConfigProvider
 */
export function useConfig(): AppConfig {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
