import { ApolloClientProvider } from "@/providers/ApolloProvider";
import { AppContextResolver } from "@/providers/AppContextResolver";
import { Auth0ClientProvider } from "@/providers/Auth0ClientProvider";
import { AuthWall } from "@/providers/AuthWall";
import { DatadogRumProvider } from "@/providers/DatadogRumProvider";
import { GoogleMapsServerProvider } from "@/providers/GoogleMapsServerProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { WorkspaceProvider } from "@/providers/WorkspaceProvider";
import React from "react";

interface ProviderComposerProps {
  children: React.ReactNode;
}

const apiUrl =
  process.env.NEXT_PUBLIC_GQL_URL || process.env.NEXT_PUBLIC_API_URL + "/es-erp-api/graphql";
const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "";
const auth0ClientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "";
const auth0Audience = process.env.NEXT_PUBLIC_API_URL + "/es-erp-api";

/**
 * ProviderComposer consolidates all application providers in a single component.
 * This maintains the correct nesting order while keeping the layout clean.
 */
export function ProviderComposer({ children }: ProviderComposerProps) {
  return (
    <Auth0ClientProvider domain={auth0Domain} clientId={auth0ClientId} audience={auth0Audience}>
      <AuthWall>
        <DatadogRumProvider>
          <GoogleMapsServerProvider>
            <NotificationProvider>
              <ApolloClientProvider api={apiUrl}>
                <WorkspaceProvider>
                  <AppContextResolver>{children}</AppContextResolver>
                </WorkspaceProvider>
              </ApolloClientProvider>
            </NotificationProvider>
          </GoogleMapsServerProvider>
        </DatadogRumProvider>
      </AuthWall>
    </Auth0ClientProvider>
  );
}

export function ProviderComposerNoAuth({ children }: ProviderComposerProps) {
  return (
    <Auth0ClientProvider domain={auth0Domain} clientId={auth0ClientId} audience={auth0Audience}>
      <DatadogRumProvider>
        <GoogleMapsServerProvider>
          <NotificationProvider>
            <ApolloClientProvider api={apiUrl}>{children}</ApolloClientProvider>
          </NotificationProvider>
        </GoogleMapsServerProvider>
      </DatadogRumProvider>
    </Auth0ClientProvider>
  );
}
