import { ApolloClientProvider } from "@/providers/ApolloProvider";
import { AppContextResolver } from "@/providers/AppContextResolver";
import { Auth0ClientProvider } from "@/providers/Auth0ClientProvider";
import { AuthWall } from "@/providers/AuthWall";
import { ConfigProvider, useConfig } from "@/providers/ConfigProvider";
import { DatadogRumProvider } from "@/providers/DatadogRumProvider";
import { GoogleMapsServerProvider } from "@/providers/GoogleMapsServerProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { WorkspaceProvider } from "@/providers/WorkspaceProvider";
import React from "react";

interface ProviderComposerProps {
  children: React.ReactNode;
}

/**
 * Inner component that uses the config context
 */
function ProviderComposerInner({ children }: ProviderComposerProps) {
  const config = useConfig();

  return (
    <Auth0ClientProvider
      domain={config.auth0Domain}
      clientId={config.auth0ClientId}
      audience={config.auth0Audience}
    >
      <AuthWall>
        <DatadogRumProvider>
          <GoogleMapsServerProvider>
            <NotificationProvider>
              <ApolloClientProvider api={config.graphqlUrl}>
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

/**
 * Inner component for no-auth variant
 */
function ProviderComposerNoAuthInner({ children }: ProviderComposerProps) {
  const config = useConfig();

  return (
    <Auth0ClientProvider
      domain={config.auth0Domain}
      clientId={config.auth0ClientId}
      audience={config.auth0Audience}
    >
      <DatadogRumProvider>
        <GoogleMapsServerProvider>
          <NotificationProvider>
            <ApolloClientProvider api={config.graphqlUrl}>{children}</ApolloClientProvider>
          </NotificationProvider>
        </GoogleMapsServerProvider>
      </DatadogRumProvider>
    </Auth0ClientProvider>
  );
}

/**
 * ProviderComposer consolidates all application providers in a single component.
 * This maintains the correct nesting order while keeping the layout clean.
 */
export function ProviderComposer({ children }: ProviderComposerProps) {
  return (
    <ConfigProvider>
      <ProviderComposerInner>{children}</ProviderComposerInner>
    </ConfigProvider>
  );
}

export function ProviderComposerNoAuth({ children }: ProviderComposerProps) {
  return (
    <ConfigProvider>
      <ProviderComposerNoAuthInner>{children}</ProviderComposerNoAuthInner>
    </ConfigProvider>
  );
}
