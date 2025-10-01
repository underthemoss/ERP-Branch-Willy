"use client";

import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Breadcrumbs,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { usePathname } from "next/navigation";
import * as React from "react";
import { NextLink } from "./NextLink";
import { SearchDialog } from "./SearchDialog";

const SHORTCUT = "⌘ /";

interface ToolbarActionsProps {
  toggleMobileNav?: () => void;
  onSearchClick: () => void;
}

const ToolbarActions: React.FC<ToolbarActionsProps> = ({ toggleMobileNav, onSearchClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box display="flex" gap={{ xs: 0.5, sm: 2 }} alignItems="center">
      {/* Mobile search icon - show only on mobile */}
      <IconButton
        size="small"
        aria-label="search"
        onClick={onSearchClick}
        sx={{
          display: { xs: "flex", sm: "none" },
          mt: { xs: 0.4, sm: 0 },
          mr: { xs: 0.5, sm: 0 },
        }}
      >
        <SearchIcon fontSize="small" />
      </IconButton>

      {/* Desktop search pill - hide on mobile */}
      <Paper
        elevation={0}
        onClick={onSearchClick}
        sx={{
          px: 1.5,
          py: 0.5,
          display: { xs: "none", sm: "flex" },
          alignItems: "center",
          width: 220,
          borderRadius: 50,
          bgcolor: (theme) => theme.palette.action.hover,
          cursor: "pointer",
          transition: "background-color 0.2s",
          "&:hover": {
            bgcolor: (theme) => theme.palette.action.selected,
          },
        }}
      >
        <SearchIcon sx={{ mr: 1, fontSize: 20, color: "text.disabled" }} />
        <Typography
          sx={{
            flex: 1,
            fontSize: 14,
            color: "text.disabled",
            userSelect: "none",
          }}
        >
          Search
        </Typography>
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
  const [searchOpen, setSearchOpen] = React.useState(false);

  // Global keyboard shortcut for search (⌘/ or Ctrl/)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
        <ToolbarActions
          toggleMobileNav={onMobileNavToggle}
          onSearchClick={() => setSearchOpen(true)}
        />
      </Box>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Box>
  );
};
