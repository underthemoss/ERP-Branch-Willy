import type { Metadata } from "next";
import "./globals.css";

import { CssBaseline } from "@mui/joy";
import React from "react";

export const metadata: Metadata = {
  title: "ES-ERP",
  description: "Equipmentshare",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </head>
      <body>
        <CssBaseline />
        {children}
      </body>
    </html>
  );
}
