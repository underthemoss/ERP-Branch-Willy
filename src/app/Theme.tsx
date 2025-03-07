"use client";
import { CssBaseline } from "@mui/material";
// import { CssVarsProvider, extendTheme } from "@mui/material/styles";

// const theme = extendTheme({
//   colorSchemes: {
//     light: {
//       palette: {
//         primary: {
//           //   solidBg: "#f16622",
//           //   solidBg: "#ff6e00",
//         },
//         // primary: {
//         //   50: "#C0CCD9",
//         //   100: "#A5B8CF",
//         //   200: "#6A96CA",
//         //   300: "#4886D0",
//         //   400: "#2178DD",
//         //   500: "#096BDE",
//         //   600: "#1B62B5",
//         //   700: "#265995",
//         //   800: "#2F4968",
//         //   900: "#2F3C4C",
//         // },
//       },
//     },
//   },
// });

export const Theme: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <>
      <CssBaseline />
      {children}
    </>
  );
};
