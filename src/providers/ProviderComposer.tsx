import { ApolloClientProvider } from "@/providers/ApolloProvider";
import { AppContextResolver } from "@/providers/AppContextResolver";
import { Auth0ClientProvider } from "@/providers/Auth0ClientProvider";
import { DatadogRumProvider } from "@/providers/DatadogRumProvider";
import { GoogleMapsServerProvider } from "@/providers/GoogleMapsServerProvider";
import { OrganizationProvider } from "@/providers/OrganizationProvider";
import { WorkspaceProvider } from "@/providers/WorkspaceProvider";
import React from "react";

interface ProviderComposerProps {
  children: React.ReactNode;
  auth0Domain: string;
  auth0ClientId: string;
  auth0Audience: string;
  apiUrl: string;
}

/**
 * ProviderComposer consolidates all application providers in a single component.
 * This maintains the correct nesting order while keeping the layout clean.
 */
export function ProviderComposer({
  children,
  auth0Domain,
  auth0ClientId,
  auth0Audience,
  apiUrl,
}: ProviderComposerProps) {
  return (
    <Auth0ClientProvider domain={auth0Domain} clientId={auth0ClientId} audience={auth0Audience}>
      <DatadogRumProvider>
        <GoogleMapsServerProvider>
          <ApolloClientProvider api={apiUrl}>
            <OrganizationProvider>
              <WorkspaceProvider>
                <AppContextResolver>{children}</AppContextResolver>
              </WorkspaceProvider>
            </OrganizationProvider>
          </ApolloClientProvider>
        </GoogleMapsServerProvider>
      </DatadogRumProvider>
    </Auth0ClientProvider>
  );
}
