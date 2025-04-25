"use client";

import { MuiLicense } from "@/ui/MuiLicense";
import { createTheme, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { AppProvider } from "@toolpad/core/AppProvider";
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
      <AppProvider navigation={NAVIGATION} theme={lightTheme}>
        <CssBaseline />
        <MuiLicense>{children}</MuiLicense>
      </AppProvider>
    </LocalizationProvider>
  );
};
