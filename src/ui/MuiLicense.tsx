"use client";

import { LicenseInfo } from "@mui/x-license";

// This feels wrong but the key is designed to be public
// and is expected to be exposed in the bundled JS
// See: https://mui.com/x/introduction/licensing/#license-key-security
LicenseInfo.setLicenseKey(
  "715e83fc5f3eb71ac9654e77ab59e321Tz0xMTM4MTcsRT0xNzgwMTg1NTk5MDAwLFM9cHJlbWl1bSxMTT1zdWJzY3JpcHRpb24sUFY9aW5pdGlhbCxLVj0y",
);

export const MuiLicense: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <>{children}</>;
};
