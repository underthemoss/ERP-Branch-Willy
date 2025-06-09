import Box from "@mui/material/Box";
import type {} from "@mui/material/themeCssVarsAugmentation";
import { Topbar } from "@/ui/Topbar";
import { usePathname } from "next/navigation";
import * as React from "react";
import { NavBar } from "./NavBar";
import { Sidebar } from "./sidebar/Sidebar";
import { useSidebar } from "./sidebar/useSidebar";

const DashboardMainSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getSidebarState } = useSidebar();
  const sidebarState = getSidebarState();
  const isSidebarOpen = sidebarState !== null;

  return (
    <Box
      sx={{
        display: "flex",
        minWidth: isSidebarOpen ? 0 : "900px",
        height: "100%",
      }}
    >
      {/* Center panel */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          margin: "10px",
          borderRadius: "12px",
          bgcolor: "white",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.3s ease",
        }}
      >
        <Topbar />

        {/* Content area: horizontal scroll if needed */}
        <Box
          sx={{
            flex: 1,
            overflowX: "auto",
            p: 2,
          }}
        >
          {children}
        </Box>
      </Box>
      {/* Right panel */}
      <Sidebar />
    </Box>
  );
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const p = usePathname();

  return (
    <Box
      className="dashboard-layout"
      sx={{
        backgroundColor: "#F5F5F5",
        position: "relative",
        display: "flex",
        overflow: "hidden",
        height: "100vh",
        width: "100vw",
      }}
    >
      <NavBar />
      <Box
        className="right-section"
        sx={{
          flex: 1,
          minWidth: 0, // allow shrinking
          overflowX: "auto", // allow horizontal scroll if needed
        }}
      >
        <DashboardMainSection>{children}</DashboardMainSection>
      </Box>
    </Box>
  );
};
