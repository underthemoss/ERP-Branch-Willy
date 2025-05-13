"use client";

import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import { Box, Breadcrumbs, IconButton, InputBase, Paper, Typography } from "@mui/material";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useSidebar } from "./sidebar/useSidebar";

const SHORTCUT = "⌘ /";

const ToolbarActions: React.FC<{ toggleSideBar: () => void }> = ({ toggleSideBar }) => {
  return (
    <Box display="flex" gap={2} alignItems="center">
      {/* Search pill */}
      <Paper
        component="form"
        elevation={0}
        sx={{
          px: 1.5,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          width: 220,
          borderRadius: 50,
          bgcolor: (theme) => theme.palette.action.hover,
        }}
      >
        <SearchIcon sx={{ mr: 1, fontSize: 20, color: "text.disabled" }} />
        <InputBase
          placeholder="Search"
          inputProps={{ "aria-label": "search" }}
          sx={{
            flex: 1,
            fontSize: 14,
            height: "20px",
            "::placeholder": { color: "text.secondary", opacity: 1 },
          }}
        />
        <Typography variant="caption" sx={{ ml: 1, color: "text.disabled", userSelect: "none" }}>
          {SHORTCUT}
        </Typography>
      </Paper>

      {/* Action icons */}
      <IconButton size="small" aria-label="notifications">
        <NotificationsNoneOutlinedIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="layout switcher" onClick={toggleSideBar}>
        <ViewSidebarOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export const Topbar = function () {
  const { closeSidebar } = useSidebar();
  const pathname = usePathname();

  const breadcrumbs = pathname.split("/").slice(3); // ignore /app/id
  if (breadcrumbs.length === 0) {
    breadcrumbs.push("home");
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
        px: "28px",
        py: "15px",
        borderBottom: "1px solid #ddd",
        justifyContent: "space-between",
      }}
    >
      <Breadcrumbs
        aria-label="breadcrumb"
        sx={{
          color: "rgba(28, 28, 28, 0.40)",
          fontFamily: "Inter",
          fontSize: "14px",
          fontStyle: "normal",
          fontWeight: 400,
          lineHeight: "20px",
        }}
      >
        {breadcrumbs.map((breadcrumb, i) => (
          <span key={i} style={{ textTransform: "capitalize" }}>
            {breadcrumb} /
          </span>
        ))}
      </Breadcrumbs>
      <Box>
        <ToolbarActions toggleSideBar={closeSidebar} />
      </Box>
    </Box>
  );
};
