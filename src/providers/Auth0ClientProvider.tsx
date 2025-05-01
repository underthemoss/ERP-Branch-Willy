"use client";

import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const { user, loginWithRedirect, getAccessTokenSilently, isAuthenticated, isLoading, logout } =
    useAuth0();
  const [token, setToken] = useState("");
  useEffect(() => {
    getAccessTokenSilently()
      .then(setToken)
      .catch(() => {
        console.log("redirect");
        loginWithRedirect();
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

export const Auth0ClientProvider: React.FC<{
  domain: string;
  clientId: string;
  redirect: string;
  children: React.ReactNode;
}> = ({ children, clientId, domain, redirect }) => {
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirect,
      }}
    >
      {children}
    </Auth0Provider>
  );
};
