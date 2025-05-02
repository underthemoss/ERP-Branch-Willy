"use client";

import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

const AuthWall: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { loginWithRedirect, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    getAccessTokenSilently({ cacheMode: "on" }).catch((d) => {
      loginWithRedirect({});
    });
  }, []);

  return children;
};

export const Auth0ClientProvider: React.FC<{
  domain: string;
  clientId: string;
  redirect: string;
  audience: string;
  children: React.ReactNode;
}> = ({ children, clientId, domain, redirect, audience }) => {
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirect,
        audience,
      }}
    >
      <AuthWall>{children}</AuthWall>
    </Auth0Provider>
  );
};
