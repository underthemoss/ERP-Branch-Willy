"use client";

import { ApolloClient, ApolloProvider, createHttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import React, { useMemo } from "react";
import { useAuth } from "./Auth0ClientProvider";

export const ApolloClientProvider: React.FC<{
  children: React.ReactNode;
  api: string;
}> = ({ children, api }) => {
  const { token } = useAuth();
  const client = useMemo(() => {
    const httpLink = createHttpLink({
      uri: api,
    });

    const authLink = setContext((_, { headers }) => ({
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }));

    return new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
    });
  }, [token]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
