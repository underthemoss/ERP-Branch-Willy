"use client";

import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Breadcrumbs,
  IconButton,
  InputBase,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { usePathname } from "next/navigation";
import * as React from "react";
import { NextLink } from "./NextLink";

const SHORTCUT = "⌘ /";

interface ToolbarActionsProps {
  toggleMobileNav?: () => void;
}

const ToolbarActions: React.FC<ToolbarActionsProps> = ({ toggleMobileNav }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box display="flex" gap={2} alignItems="center">
      {/* Search pill - hide on very small screens */}
      <Paper
        component="form"
        elevation={0}
        sx={{
          px: 1.5,
          py: 0.5,
          display: { xs: "none", sm: "flex" },
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
    </Box>
  );
};

interface TopbarProps {
  onMobileNavToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMobileNavToggle }) => {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
        px: { xs: "12px", sm: "28px" },
        py: { xs: "10px", sm: "15px" },
        borderBottom: "1px solid #ddd",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
        {/* Hamburger menu for mobile - positioned on the left */}
        {isMobile && onMobileNavToggle && (
          <IconButton
            size="small"
            aria-label="open navigation menu"
            onClick={onMobileNavToggle}
            sx={{
              display: { xs: "block", md: "none" },
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        )}

        {/* Breadcrumbs */}
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{
            color: "rgba(28, 28, 28, 0.40)",
            fontFamily: "Inter",
            fontSize: { xs: "12px", sm: "14px" },
            fontStyle: "normal",
            fontWeight: 400,
            lineHeight: "20px",
            flex: 1,
            minWidth: 0,
            "& .MuiBreadcrumbs-ol": {
              flexWrap: "nowrap",
            },
            "& .MuiBreadcrumbs-li": {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
          }}
          separator="/"
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
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <ToolbarActions toggleMobileNav={onMobileNavToggle} />
      </Box>
    </Box>
  );
};
