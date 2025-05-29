import { useFetchWorkspacesQuery } from "@/graphql/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PostAddIcon from "@mui/icons-material/PostAdd";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export const NavBar = () => {
  const { data } = useFetchWorkspacesQuery();
  const { user } = useAuth0();
  const pathname = usePathname();
  console.log("pathname", pathname);
  const workspaces =
    data?.listWorkspaces?.items.map((d) => {
      return {
        id: d.id,
        name: d.name,
        subtext: d.companyId,
        image: "/favicon.ico",
      };
    }) || [];

  const currentWorkspace = workspaces[0];

  // Navigation menu items
  const navItems = [
    {
      text: "Home",
      href: `/app/${currentWorkspace?.id}`,
      icon: <HomeOutlinedIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}`,
    },
    {
      text: "Transactions",
      href: `/app/${currentWorkspace?.id}/transactions`,
      icon: <SyncAltIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/transactions`,
    },
    {
      text: "Assignments",
      href: `/app/${currentWorkspace?.id}/assignments`,
      icon: <PostAddIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/assignments`,
    },
    {
      text: "Inventory",
      href: `/app/${currentWorkspace?.id}/inventory`,
      icon: <DescriptionOutlinedIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/inventory`,
    },
    {
      text: "Sales Orders",
      href: `/app/${currentWorkspace?.id}/sales-orders`,
      icon: <PostAddIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/sales-orders`,
    },
    {
      text: "Projects",
      href: `/app/${currentWorkspace?.id}/projects`,
      icon: <FolderOpenIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/projects`,
    },
  ];

  return (
    <Box
      className="navbar"
      sx={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "flex-start",
        pt: "18px",
        pb: 2,
        px: 2,
        bgcolor: "#F5F5F5",
        height: "100%",
        width: 288,
      }}
    >
      <Box
        className="workspaceSwitcher"
        sx={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: "transparent",
            borderRadius: "10px",
            boxShadow: "0px 0px 40px rgba(0, 0, 0, 0.04)",
          }}
        >
          {currentWorkspace?.image ? (
            <img
              src={currentWorkspace?.image}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "10px",
              }}
            />
          ) : (
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "14px",
                letterSpacing: "-0.08px",
              }}
            >
              {currentWorkspace?.name?.slice(0, 1)}
            </Typography>
          )}
        </Avatar>

        <Box
          className="ws-name-and-email"
          sx={{
            display: "flex",
            flexDirection: "column",
            marginLeft: "6px",
            width: "172px",
            gap: "6px",
          }}
        >
          <Typography
            noWrap
            sx={{
              fontFamily: "Inter",
              fontSize: "14px",
              fontStyle: "normal",
              fontWeight: "500",
              lineHeight: "18px",
              letterSpacing: "-0.2px",
              color: "#2F2B43",
            }}
          >
            {currentWorkspace?.name}
          </Typography>

          <Typography
            noWrap
            sx={{
              color: "#8B919E",
              fontFamily: "Inter",
              fontSize: "12px",
              fontStyle: "normal",
              fontWeight: "400",
              lineHeight: "16px",
              letterSpacing: "-0.2px",
            }}
          >
            {user?.email}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", width: "100%", justifyContent: "flex-end" }}>
          <IconButton size="small" className="brian">
            <UnfoldMoreIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ width: "100%", my: "12px" }} />

      <Box className="navmenu" sx={{ width: "100%" }}>
        <List disablePadding>
          {navItems.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  href={item.href}
                  selected={item.selected}
                  sx={{
                    px: "12px",
                    borderRadius: "8px",
                    color: item.selected ? "text.primary" : "grey.400",
                  }}
                >
                  <ListItemIcon
                    sx={{ color: item.selected ? "text.primary" : "grey.400", minWidth: "30px" }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    disableTypography
                    sx={{
                      color: item.selected ? "text.primary" : "grey.400",
                      fontFamily: "Inter",
                      fontSize: "14px",
                      fontStyle: "normal",
                      fontWeight: 500,
                      lineHeight: "21px",
                      letterSpacing: "0.28px",
                    }}
                  >
                    {item.text}
                  </ListItemText>
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  );
};
