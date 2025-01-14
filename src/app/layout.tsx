import type { Metadata } from "next";
import "./globals.css";

import { Box, CssBaseline } from "@mui/joy";

import SideNav from "./SideNav";
import Breadcrumbs from "./Breadcrumbs";

export const metadata: Metadata = {
  title: "ES-ERP",
  description: "Equipmentshare",
};

export default async function RootLayout({
  children,
  searchParams,
  breadcrumbs,
}: Readonly<{
  children: React.ReactNode;
  breadcrumbs: React.ReactNode;
  searchParams: any;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </head>
      <body>
        <Box
          display="flex"
          flex={1}
          flexDirection={"column"}
          height={"100%"}
          maxHeight={"100%"}
        >
          <CssBaseline />

          <Box flex={1} display={"flex"} overflow={"hidden"}>
            <Box
              display={"flex"}
              width={240}
              sx={{
                backgroundColor: "#FBFCFE",
                borderRight: 1,
                borderColor: "#dfdfdf",
              }}
              overflow={"scroll"}
            >
              <SideNav />
            </Box>
            <Box flex={1} overflow={"scroll"}>
              <Box>{breadcrumbs}</Box>
              <Box>{children}</Box>
            </Box>
          </Box>
        </Box>
      </body>
    </html>
  );
}
