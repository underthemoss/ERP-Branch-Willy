"use client";

import Box from "@mui/material/Box";
import type {} from "@mui/material/themeCssVarsAugmentation";
import { Topbar } from "@/ui/Topbar";
import { usePathname } from "next/navigation";
import * as React from "react";
import { NavBar } from "./NavBar";
import { Sidebar } from "./sidebar/Sidebar";
import { useSidebar } from "./sidebar/useSidebar";

const DashboardMainSection: React.FC<{
  children: React.ReactNode;
  onMobileNavToggle: () => void;
}> = ({ children, onMobileNavToggle }) => {
  const { getSidebarState } = useSidebar();
  const sidebarState = getSidebarState();
  const isSidebarOpen = sidebarState !== null;

  return (
    <Box
      sx={{
        display: "flex",
        minWidth: isSidebarOpen ? 0 : { xs: 0, md: "900px" },
        height: "100%",
        marginRight: -1,
      }}
    >
      {/* Center panel */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,

          margin: { xs: "5px", md: "10px" },
          borderRadius: "12px",
          bgcolor: "white",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.3s ease",
        }}
      >
        <Topbar onMobileNavToggle={onMobileNavToggle} />

        {/* Content area: horizontal scroll if needed */}
        <Box
          sx={{
            flex: 1,
            overflowX: "auto",
            pl: { xs: 1.5, md: 2 },
            pr: { xs: 1, md: 2 },
            py: { xs: 1.5, md: 2 },
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
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const handleMobileNavToggle = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  const handleMobileNavClose = () => {
    setMobileNavOpen(false);
  };

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
      <NavBar mobileOpen={mobileNavOpen} onMobileClose={handleMobileNavClose} />
      <Box
        className="right-section"
        sx={{
          flex: 1,
          minWidth: 0, // allow shrinking
          overflowX: "auto", // allow horizontal scroll if needed
        }}
      >
        <DashboardMainSection onMobileNavToggle={handleMobileNavToggle}>
          {children}
        </DashboardMainSection>
      </Box>
    </Box>
  );
};
