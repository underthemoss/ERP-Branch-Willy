"use client";

import { MuiLicense } from "@/ui/MuiLicense";
import { createTheme, CssBaseline, LinearProgress } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { NextAppProvider } from "@toolpad/core/nextjs";
import * as React from "react";
import { NAVIGATION } from "./Navigation";

const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});
export const Theme: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AppRouterCacheProvider options={{}}>
        <React.Suspense fallback={<LinearProgress />}>
          <NextAppProvider navigation={NAVIGATION} theme={lightTheme}>
            <CssBaseline />
            <MuiLicense>{children}</MuiLicense>
          </NextAppProvider>
        </React.Suspense>
      </AppRouterCacheProvider>
    </LocalizationProvider>
  );
};
