/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { ApolloClientProvider } from "@/providers/ApolloProvider";
import { Auth0ClientProvider } from "@/providers/Auth0ClientProvider";
import { DatadogRumProvider } from "@/providers/DatadogRumProvider";
import React from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ES-ERP",
  description: "Equipmentshare",
};

const api =
  process.env.NEXT_PUBLIC_GQL_URL || process.env.NEXT_PUBLIC_API_URL + "/es-erp-api/graphql";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body>
        <Auth0ClientProvider
          domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN || ""}
          clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || ""}
          audience={process.env.NEXT_PUBLIC_API_URL + "/es-erp-api" || ""}
        >
          <DatadogRumProvider>
            <ApolloClientProvider api={api}>{children}</ApolloClientProvider>
          </DatadogRumProvider>
        </Auth0ClientProvider>
      </body>
    </html>
  );
}
