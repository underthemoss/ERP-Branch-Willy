"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { JwtOverrideProvider } from "./JwtOverrideContext";

export const Auth0ClientProvider: React.FC<{
  domain: string;
  clientId: string;
  redirect?: string;
  audience: string;
  children: React.ReactNode;
}> = ({ children, clientId, domain, redirect, audience }) => {
  const router = useRouter();
  // Parse JWT from URL hash: #jwt=...
  const jwt = useMemo(() => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash;
    if (!hash) return null;
    const match = hash.match(/jwt=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }, []);

  // Construct redirect URI dynamically
  const redirectUri = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}`;
    }
    // Fallback for SSR - use provided redirect or environment variable
    return redirect || `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}`;
  }, [redirect]);

  if (jwt) {
    // If JWT is present in hash, provide it and skip Auth0 logic

    return <JwtOverrideProvider jwt={jwt}>{children}</JwtOverrideProvider>;
  }

  // Otherwise, proceed with Auth0Provider and provide null JWT
  return (
    <JwtOverrideProvider jwt={null}>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: redirectUri,
          audience,
        }}
        onRedirectCallback={(appState?: { returnTo?: string }) => {
          router.push(appState?.returnTo || "/");
        }}
      >
        {children}
      </Auth0Provider>
    </JwtOverrideProvider>
  );
};
