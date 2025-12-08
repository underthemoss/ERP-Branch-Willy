import { ApolloClientProvider } from "@/providers/ApolloProvider";
import { Auth0ClientProvider } from "@/providers/Auth0ClientProvider";
import { ConfigProvider, useConfig } from "@/providers/ConfigProvider";
import { DatadogRumProvider } from "@/providers/DatadogRumProvider";
import { GoogleMapsServerProvider } from "@/providers/GoogleMapsServerProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { UserBootstrapProvider } from "@/providers/UserBootstrapProvider";
import React from "react";

interface ProviderComposerProps {
  children: React.ReactNode;
}

/**
 * Inner component that uses the config context.
 * Does NOT enforce authentication - routes opt-in via RequireAuth component.
 * Does NOT include WorkspaceProvider - only /app routes need workspace context.
 */
function ProviderComposerInner({ children }: ProviderComposerProps) {
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
            <ApolloClientProvider api={config.graphqlUrl}>
              <UserBootstrapProvider>{children}</UserBootstrapProvider>
            </ApolloClientProvider>
          </NotificationProvider>
        </GoogleMapsServerProvider>
      </DatadogRumProvider>
    </Auth0ClientProvider>
  );
}

/**
 * ProviderComposer consolidates all application providers in a single component.
 * This maintains the correct nesting order while keeping the layout clean.
 *
 * Does NOT enforce authentication by default. Routes that require authentication
 * should use the RequireAuth component to wrap their content.
 *
 * Does NOT include WorkspaceProvider. Routes that need workspace context (like /app/*)
 * should add WorkspaceProvider in their layout.
 */
export function ProviderComposer({ children }: ProviderComposerProps) {
  return (
    <ConfigProvider>
      <ProviderComposerInner>{children}</ProviderComposerInner>
    </ConfigProvider>
  );
}

/**
 * @deprecated Use ProviderComposer instead. All routes now use the same provider,
 * and authentication is enforced per-route via the RequireAuth component.
 */
export const ProviderComposerNoAuth = ProviderComposer;
