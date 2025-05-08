"use client";

import { ThemeProviderComponent } from "@/providers/ThemeProvider";
import { MuiLicense } from "@/ui/MuiLicense";
import { useAuth0 } from "@auth0/auth0-react";
import { createTheme, CssBaseline, LinearProgress } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { NextAppProvider } from "@toolpad/core/nextjs";
import { DialogsProvider } from "@toolpad/core/useDialogs";
import * as React from "react";
import { useNavigation } from "../app/Navigation";

export const AppChrome: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth0();
  const navigation = useNavigation();
  if (!user) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AppRouterCacheProvider options={{}}>
        <ThemeProviderComponent>
          <DialogsProvider>
            <CssBaseline />
            <MuiLicense>{children}</MuiLicense>
          </DialogsProvider>
        </ThemeProviderComponent>
      </AppRouterCacheProvider>
    </LocalizationProvider>
  );
};
