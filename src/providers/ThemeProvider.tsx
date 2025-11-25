import { createTheme, ThemeProvider } from "@mui/material/styles";
import * as React from "react";

const theme = createTheme({
  components: {
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          "& .MuiBackdrop-root": {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          },
        },
      },
    },
  },
  palette: {
    primary: {
      main: "#0063E9", // Dark background color from the avatar
    },
    secondary: {
      main: "#161616", // Selected menu item background
    },
    text: {
      primary: "#161616", // Selected menu text
      secondary: "#2f2b43", // Company name text
      disabled: "#8b919e", // Email text
    },
    grey: {
      100: "#f5f5f5", // Neutral-100 background
      300: "rgba(163, 163, 163, 1)", // From greyscale-300
      400: "rgba(115, 115, 115, 1)", // From greyscale-400
      500: "#bdbfc5", // Starred text color
    },
    action: {
      hover: "rgba(231, 231, 232, 0.8)", // Lighter version of selected background for hover
      selected: "#e7e7e8", // Selected menu background
    },
  },
  typography: {
    fontFamily: "'Inter', Helvetica, Arial, sans-serif",
    h1: {
      fontFamily: "Inter",
      fontSize: "24px",
      fontStyle: "normal",
      fontWeight: 600,
      lineHeight: "28px",
      letterSpacing: "-0.72px",
    },
    body1: {
      fontFamily: "Inter",
      fontSize: "14px",
      fontStyle: "normal",
      fontWeight: 500,
      lineHeight: "21px",
    },
    body2: {
      fontFamily: "Inter",
      fontSize: "12px",
      fontStyle: "normal",
      fontWeight: 400,
      lineHeight: "18px",
    },
  },
});

export const ThemeProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
