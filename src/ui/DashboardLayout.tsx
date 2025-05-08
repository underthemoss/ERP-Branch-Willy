import Box from "@mui/material/Box";
import type {} from "@mui/material/themeCssVarsAugmentation";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { Topbar } from "@/ui/Topbar";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Sidebar } from "./Sidebar";

const DashboardMainSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSidebarOpen } = useSidebar();

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
      <Box
        sx={{
          bgcolor: "white",
          width: isSidebarOpen ? "500px" : "0px",
          flexShrink: 0,
          margin: "10px",
          marginLeft: 0,
          borderRadius: "12px",
          overflow: "hidden",
          transition: "width 0.3s ease",
        }}
      >
        <Box
          sx={{
            opacity: isSidebarOpen ? 1 : 0,
            transition: "opacity 0.3s ease",
            p: isSidebarOpen ? 2 : 0,
          }}
        >
          right panel
        </Box>
      </Box>
    </Box>
  );
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const p = usePathname();

  console.log("p: ", p);

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
      <SidebarProvider>
        <Sidebar />
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
      </SidebarProvider>
    </Box>
  );
};
