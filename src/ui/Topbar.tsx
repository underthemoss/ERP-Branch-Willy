"use client";

import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import { Box, Breadcrumbs, IconButton, InputBase, Paper, Typography } from "@mui/material";
import { usePathname } from "next/navigation";
import * as React from "react";
import { NextLink } from "./NextLink";
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

  // Split, filter out empty segments, then slice to ignore /app/id
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathSegments.slice(2); // skip 'app' and workspace_id

  // If no breadcrumbs, show "Home"
  if (breadcrumbs.length === 0) {
    breadcrumbs.push("home");
  }

  // Convert to human-friendly labels
  const humanize = (str: string) =>
    str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Box
      className="topbar"
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
        separator={"/"}
      >
        {breadcrumbs.map((breadcrumb, i) => {
          // Build the path up to this breadcrumb
          const href =
            "/" +
            pathSegments
              .slice(0, i + 3) // +3 to account for skipped segments
              .join("/");

          // Last breadcrumb is not a link
          if (i === breadcrumbs.length - 1) {
            return <span key={i}>{humanize(breadcrumb)}</span>;
          }
          return (
            <NextLink key={i} href={href}>
              {humanize(breadcrumb)}
            </NextLink>
          );
        })}
      </Breadcrumbs>
      <Box>
        <ToolbarActions toggleSideBar={closeSidebar} />
      </Box>
    </Box>
  );
};
