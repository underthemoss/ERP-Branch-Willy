"use client";

import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { LinearProgress } from "@mui/material";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const { user, loginWithRedirect, getAccessTokenSilently, isAuthenticated, isLoading, logout } =
    useAuth0();
  const [token, setToken] = useState("");
  useEffect(() => {
    getAccessTokenSilently({ cacheMode: "on" })
      .then(setToken)
      .catch((d) => {
        console.log(d);
        loginWithRedirect({});
      });
  }, [loginWithRedirect, user]);

  return {
    user,
    isAuthenticated,
    isLoading,
    token,
    logout,
  };
};

const AuthWall: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <LinearProgress />;
  }
  return <>{children}</>;
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
