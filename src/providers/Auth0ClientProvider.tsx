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

export const Auth0ClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN || ""}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || ""}
      authorizationParams={{
        redirect_uri: process.env.NEXT_PUBLIC_BASE_URL + "" || "",
      }}
    >
      {children}
    </Auth0Provider>
  );
};
