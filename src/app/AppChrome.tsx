"use client";

import { MuiLicense } from "@/ui/MuiLicense";
import { useAuth0 } from "@auth0/auth0-react";
import { createTheme, CssBaseline, LinearProgress } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { NextAppProvider } from "@toolpad/core/nextjs";
import { DialogsProvider } from "@toolpad/core/useDialogs";
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
export const AppChrome: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth0();
  if (!user) return null;
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AppRouterCacheProvider options={{}}>
        <React.Suspense fallback={<LinearProgress />}>
          <NextAppProvider
            navigation={NAVIGATION}
            theme={lightTheme}
            branding={{
              logo: <></>,
              title: "",
            }}
            authentication={{
              signIn: () => {},
              signOut: () => {
                logout({});
              },
            }}
            session={{
              user: {
                email: user.email,
                image: user.picture,
                name: user.name,
              },
            }}
          >
            <DialogsProvider>
              <CssBaseline />
              <MuiLicense>{children}</MuiLicense>
            </DialogsProvider>
          </NextAppProvider>
        </React.Suspense>
      </AppRouterCacheProvider>
    </LocalizationProvider>
  );
};
