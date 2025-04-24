"use client";
import React from "react";

import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";

const client = new ApolloClient({
  uri: "https://staging-api.equipmentshare.com/es-erp-api/",
  cache: new InMemoryCache(),
});

export const ApolloClientProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
