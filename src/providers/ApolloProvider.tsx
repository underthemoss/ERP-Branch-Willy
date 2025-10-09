"use client";

import { ApolloClient, ApolloProvider, createHttpLink, InMemoryCache, split } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { useAuth0 } from "@auth0/auth0-react";
import { createClient } from "graphql-ws";
import React, { useMemo } from "react";
import introspectionResult from "../graphql/hooks";
import { useJwtOverride } from "./JwtOverrideContext";

export const ApolloClientProvider: React.FC<{
  children: React.ReactNode;
  api: string;
}> = ({ children, api }) => {
  const { getAccessTokenSilently } = useAuth0();
  const jwtOverride = useJwtOverride();

  const client = useMemo(() => {
    const httpLink = createHttpLink({
      uri: (operation) => {
        if (!operation.operationName) return api;
        const hasQuery = api.includes("?");
        const opParam = `op=${encodeURIComponent(operation.operationName)}`;
        return hasQuery ? `${api}&${opParam}` : `${api}?${opParam}`;
      },
    });

    const authLink = setContext(async (_, { headers }) => {
      try {
        const token = jwtOverride ? jwtOverride : await getAccessTokenSilently({ cacheMode: "on" });
        return {
          headers: {
            ...headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        };
      } catch (error) {
        console.error("Error getting access token:", error);
      }
    });

    // Create WebSocket link for subscriptions
    const wsUrl = api.replace(/^http/, "ws");
    const wsLink = new GraphQLWsLink(
      createClient({
        url: wsUrl,
        connectionParams: async () => {
          try {
            const token = jwtOverride
              ? jwtOverride
              : await getAccessTokenSilently({ cacheMode: "on" });
            return {
              Authorization: token ? `Bearer ${token}` : "",
            };
          } catch (error) {
            console.error("Error getting access token:", error);
          }
        },
      }),
    );

    // Split based on operation type
    const splitLink = split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return definition.kind === "OperationDefinition" && definition.operation === "subscription";
      },
      wsLink,
      authLink.concat(httpLink),
    );

    return new ApolloClient({
      link: splitLink,
      cache: new InMemoryCache({
        possibleTypes: introspectionResult.possibleTypes,
      }),
    });
  }, [api, getAccessTokenSilently, jwtOverride]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
