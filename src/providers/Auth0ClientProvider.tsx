"use client";

import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { redirect } from "next/navigation";
import { useEffect, useMemo } from "react";
import { JwtOverrideProvider } from "./JwtOverrideContext";

const AuthWall: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { loginWithRedirect, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    getAccessTokenSilently({ cacheMode: "on" }).catch((e) => {
      console.error(e);
      if (e.error === "login_required") {
        loginWithRedirect();
      }
      if (e.error === "consent_required") {
        loginWithRedirect();
      }

      // Check for specific error message about USER role
      if (e.message && e.message.includes("User must have the USER role to authenticate")) {
        redirect("/auth/no-access");
      }

      redirect("/auth/error");
    });
  }, [getAccessTokenSilently, loginWithRedirect]);

  return children;
};

export const Auth0ClientProvider: React.FC<{
  domain: string;
  clientId: string;
  redirect?: string;
  audience: string;
  children: React.ReactNode;
}> = ({ children, clientId, domain, redirect, audience }) => {
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

  // Otherwise, proceed with Auth0Provider/AuthWall and provide null JWT
  return (
    <JwtOverrideProvider jwt={null}>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: redirectUri,
          audience,
        }}
      >
        <AuthWall>{children}</AuthWall>
      </Auth0Provider>
    </JwtOverrideProvider>
  );
};
