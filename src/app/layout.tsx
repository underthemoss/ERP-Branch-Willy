import type { Metadata } from "next";
import "./globals.css";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import React from "react";
import { Theme } from "./Theme";

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
        <Theme>{children}</Theme>
      </body>
    </html>
  );
}
