"use client";

import { initializeDatadogRum } from "@/lib/datadog-rum";
import { useAuth0 } from "@auth0/auth0-react";
import { datadogRum } from "@datadog/browser-rum";
import { useEffect } from "react";

export function DatadogRumProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    initializeDatadogRum();
  }, []);

  useEffect(() => {
    // Set user context when authentication state changes
    if (!isLoading && isAuthenticated && user && user.sub) {
      // Determine the API prefix based on the environment
      const hostname = typeof window !== "undefined" ? window.location.hostname : "";
      const isProduction = hostname === "erp.estrack.com";
      const apiPrefix = isProduction
        ? "https://api.equipmentshare.com"
        : "https://staging-api.equipmentshare.com";

      // Extract ES-specific user data with environment-aware property names
      const esUserId = user[`${apiPrefix}/es_user_id`];
      const esCompanyId = user[`${apiPrefix}/es_company_id`];
      const esCompanyName = user[`${apiPrefix}/es_company_name`];
      const esUserName = user[`${apiPrefix}/es_user_name`];
      const esUserEmail = user[`${apiPrefix}/es_user_email`];
      const esSecurityLevel = user[`${apiPrefix}/es_user_security_level_id`];
      const isFederated = user[`${apiPrefix}/is_federated`];

      datadogRum.setUser({
        id: esUserId,
        name: user.name || undefined,
        email: user.email || undefined,
        // Add custom attributes
        ...(user.nickname && { nickname: user.nickname }),
        ...(user.picture && { avatar: user.picture }),
        ...(user.given_name && { given_name: user.given_name }),
        ...(user.family_name && { family_name: user.family_name }),
        ...(esUserId && { es_user_id: esUserId }),
        ...(esCompanyId && { es_company_id: esCompanyId }),
        ...(esCompanyName && { es_company_name: esCompanyName }),
        ...(esSecurityLevel && { es_security_level: esSecurityLevel }),
        ...(isFederated !== undefined && { is_federated: isFederated }),
      });

      // Also set global context for better tracking
      datadogRum.setGlobalContextProperty("user_authenticated", true);
      datadogRum.setGlobalContextProperty("user_email", user.email || "unknown");
      datadogRum.setGlobalContextProperty("user_name", user.name || "unknown");
      datadogRum.setGlobalContextProperty("es_user_id", esUserId || "unknown");
      datadogRum.setGlobalContextProperty("es_company_id", esCompanyId || "unknown");
    } else if (!isLoading && !isAuthenticated) {
      // Clear user context when not authenticated
      datadogRum.clearUser();
      datadogRum.setGlobalContextProperty("user_authenticated", false);
    }
  }, [user, isAuthenticated, isLoading]);

  return <>{children}</>;
}
