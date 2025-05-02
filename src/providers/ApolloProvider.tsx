"use client";

import { ApolloClient, ApolloProvider, createHttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useMemo } from "react";

export const ApolloClientProvider: React.FC<{
  children: React.ReactNode;
  api: string;
}> = ({ children, api }) => {
  const { getAccessTokenSilently } = useAuth0();
  const client = useMemo(() => {
    const httpLink = createHttpLink({
      uri: api,
    });

    const authLink = setContext(async (_, { headers }) => {
      const token = await getAccessTokenSilently({ cacheMode: "on" });
      return {
        headers: {
          ...headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };
    });

    return new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
    });
  }, []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
