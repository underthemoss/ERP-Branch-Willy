"use client";

import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import React from "react";

const uri = process.env.NEXT_PUBLIC_LOCAL_GQL
  ? "http://localhost:5000/graphql"
  : "https://staging-api.equipmentshare.com/es-erp-api/graphql";

const client = new ApolloClient({
  uri,
  cache: new InMemoryCache(),
});

export const ApolloClientProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
