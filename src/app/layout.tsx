import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { ApolloClientProvider } from "@/providers/ApolloProvider";
import { Auth0ClientProvider } from "@/providers/Auth0ClientProvider";
import React from "react";
import { AppChrome } from "./AppChrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ES-ERP",
  description: "Equipmentshare",
};
const api = process.env.NEXT_PUBLIC_LOCAL_GQL
  ? "http://localhost:5000/graphql"
  : process.env.NEXT_PUBLIC_API_URL + "/es-erp-api/graphql";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </head>
      <body>
        <Auth0ClientProvider
          domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN || ""}
          clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || ""}
          redirect={process.env.NEXT_PUBLIC_BASE_URL || ""}
          audience={process.env.NEXT_PUBLIC_API_URL || ""}
        >
          <ApolloClientProvider api={api}>
            <AppChrome>{children}</AppChrome>
          </ApolloClientProvider>
        </Auth0ClientProvider>
      </body>
    </html>
  );
}
