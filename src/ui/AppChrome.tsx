"use client";

import { ThemeProviderComponent } from "@/providers/ThemeProvider";
import { MuiLicense } from "@/ui/MuiLicense";
import { createTheme, CssBaseline, LinearProgress } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { NextAppProvider } from "@toolpad/core/nextjs";
import { DialogsProvider } from "@toolpad/core/useDialogs";
import { NotificationsProvider } from "@toolpad/core/useNotifications";
import * as React from "react";
import { useNavigation } from "../app/Navigation";

export const AppChrome: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AppRouterCacheProvider options={{}}>
        <ThemeProviderComponent>
          <NotificationsProvider>
            <DialogsProvider>
              <CssBaseline />
              <MuiLicense>{children}</MuiLicense>
            </DialogsProvider>
          </NotificationsProvider>
        </ThemeProviderComponent>
      </AppRouterCacheProvider>
    </LocalizationProvider>
  );
};
