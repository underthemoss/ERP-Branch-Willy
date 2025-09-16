import { useFetchWorkspacesQuery } from "@/graphql/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BuildIcon from "@mui/icons-material/Build";
import BusinessIcon from "@mui/icons-material/Business";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import LogoutIcon from "@mui/icons-material/Logout";
import MailIcon from "@mui/icons-material/Mail";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PostAddIcon from "@mui/icons-material/PostAdd";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
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
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export const NavBar = () => {
  const { data } = useFetchWorkspacesQuery();
  const { user, logout } = useAuth0();
  const pathname = usePathname();

  // Check if user has PLATFORM_ADMIN role in the specific claim
  const roles = user?.["https://erp.estrack.com/es_erp_roles"] || [];
  const isPlatformAdmin = roles.includes("PLATFORM_ADMIN");
  const [expandedNav, setExpandedNav] = React.useState<string | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
    handleMenuClose();
  };

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
      testId: "nav-home",
    },
    {
      text: "Intake Forms",
      href: `/app/${currentWorkspace?.id}/intake-forms`,
      icon: <MailIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/intake-forms`,
      testId: "nav-intake-forms",
    },
    {
      text: "Sales Orders",
      href: `/app/${currentWorkspace?.id}/sales-orders`,
      icon: <SyncAltIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/sales-orders`,
      testId: "nav-sales-order",
    },
    {
      text: "Purchase Orders",
      href: `/app/${currentWorkspace?.id}/purchase-orders`,
      icon: <DescriptionOutlinedIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/purchase-orders`,
      testId: "nav-purchase-order",
    },
    {
      text: "Fulfillment",
      href: `/app/${currentWorkspace?.id}/fulfillment`,
      icon: <LocalShippingIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/fulfillment`,
      testId: "nav-fulfillment",
    },
    {
      text: "Rental Fulfillments",
      href: `/app/${currentWorkspace?.id}/rental-fulfillments`,
      icon: <EventNoteIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/rental-fulfillments`,
      testId: "nav-rental-fulfillment",
    },
    {
      text: "Tickets",
      href: `/app/${currentWorkspace?.id}/work-orders`,
      icon: <BuildIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/work-orders`,
      testId: "nav-work-orders",
    },
    {
      text: "Transactions",
      href: `/app/${currentWorkspace?.id}/transactions`,
      icon: <ReceiptLongIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/transactions`,
      testId: "nav-transactions",
    },
    {
      text: "Invoices",
      href: `/app/${currentWorkspace?.id}/invoices`,
      icon: <ReceiptLongIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/invoices`,
      testId: "nav-invoices",
    },
    {
      text: "Assignments",
      href: `/app/${currentWorkspace?.id}/assignments`,
      icon: <PostAddIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/assignments`,
      testId: "nav-assignments",
    },
    {
      text: "Assets",
      href: `/app/${currentWorkspace?.id}/assets`,
      icon: <DescriptionOutlinedIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/assets`,
      testId: "nav-assets",
    },
    {
      text: "Inventory",
      href: `/app/${currentWorkspace?.id}/inventory`,
      icon: <InventoryIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/inventory`,
      testId: "nav-inventory",
    },
    {
      text: "Prices",
      href: `/app/${currentWorkspace?.id}/prices`,
      icon: <AttachMoneyIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/prices`,
      testId: "nav-prices",
      subitems: [
        {
          text: "Price Books",
          href: `/app/${currentWorkspace?.id}/prices/price-books`,
          icon: <BusinessOutlinedIcon fontSize="small" />,
          selected: pathname === `/app/${currentWorkspace?.id}/prices/price-books`,
          testId: "nav-prices-price-books",
        },
      ],
    },
    {
      text: "Projects",
      href: `/app/${currentWorkspace?.id}/projects`,
      icon: <FolderOpenIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/projects`,
      testId: "nav-projects",
    },
    {
      text: "Contacts",
      href: `/app/${currentWorkspace?.id}/contacts`,
      icon: <ContactsOutlinedIcon fontSize="small" />,
      selected: pathname === `/app/${currentWorkspace?.id}/contacts`,
      testId: "nav-contacts",
      subitems: [
        {
          text: "Businesses",
          href: `/app/${currentWorkspace?.id}/contacts/businesses`,
          icon: <BusinessOutlinedIcon fontSize="small" />,
          selected: pathname === `/app/${currentWorkspace?.id}/contacts/businesses`,
          testId: "nav-contacts-businesses",
        },
        {
          text: "Employees",
          href: `/app/${currentWorkspace?.id}/contacts/employees`,
          icon: <PeopleOutlineIcon fontSize="small" />,
          selected: pathname === `/app/${currentWorkspace?.id}/contacts/employees`,
          testId: "nav-contacts-employees",
        },
      ],
    },
  ];

  return (
    <Box
      className="navbar"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        pt: "18px",
        pb: 2,
        px: 2,
        bgcolor: "#F5F5F5",
        height: "100vh",
        width: 288,
        position: "relative",
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
              alt=""
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

        <Box
          sx={{
            display: "flex",
            width: "100%",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconButton
            size="small"
            className="brian"
            onClick={handleMenuClick}
            aria-controls={open ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <UnfoldMoreIcon fontSize="small" />
          </IconButton>
          <Menu
            id="account-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: "visible",
                filter: "drop-shadow(0px 0px 40px rgba(0, 0, 0, 0.08))",
                mt: 1,
                borderRadius: "12px",
                minWidth: 200,
                bgcolor: "white",
                "& .MuiList-root": {
                  py: 1,
                },
                "&:before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 20,
                  width: 10,
                  height: 10,
                  bgcolor: "background.paper",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem
              disabled
              onClick={handleMenuClose}
              sx={{
                py: 1,
                px: 2,
                fontSize: "14px",
                color: "#8B919E",
                "&.Mui-disabled": {
                  opacity: 1,
                },
                display: "flex",
                alignItems: "center",
              }}
            >
              <ListItemIcon sx={{ minWidth: "32px", color: "#8B919E" }}>
                {user?.picture ? (
                  <Avatar
                    src={user.picture}
                    alt={user?.name || user?.email}
                    sx={{
                      width: 24,
                      height: 24,
                    }}
                  />
                ) : (
                  <PersonOutlineIcon fontSize="small" />
                )}
              </ListItemIcon>
              <Typography
                noWrap
                sx={{
                  fontSize: "14px",
                  color: "#8B919E",
                  maxWidth: "180px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user?.name || "Profile"}
              </Typography>
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              component={Link}
              href="/"
              onClick={handleMenuClose}
              sx={{
                py: 1,
                px: 2,
                fontSize: "14px",
                color: "#2F2B43",
                "&:hover": {
                  bgcolor: "#F5F5F5",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: "32px", color: "#2F2B43" }}>
                <SwapHorizIcon fontSize="small" />
              </ListItemIcon>
              Switch Workspace
            </MenuItem>
            <MenuItem
              onClick={handleLogout}
              sx={{
                py: 1,
                px: 2,
                fontSize: "14px",
                color: "#2F2B43",
                "&:hover": {
                  bgcolor: "#F5F5F5",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: "32px", color: "#2F2B43" }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Divider sx={{ width: "100%", my: "12px" }} />

      <Box
        className="navmenu"
        sx={{
          width: "100%",
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <List
          disablePadding
          sx={{
            overflow: "auto",
            flex: 1,
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              background: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#ccc",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "#999",
            },
          }}
        >
          {navItems.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem disablePadding>
                {item.subitems ? (
                  <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                    <ListItemButton
                      component={Link}
                      href={item.href}
                      selected={item.selected}
                      data-testid={item.testId}
                      sx={{
                        px: "12px",
                        borderRadius: "8px",
                        color: item.selected ? "text.primary" : "grey.400",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: item.selected ? "text.primary" : "grey.400",
                          minWidth: "30px",
                        }}
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
                    <IconButton
                      size="small"
                      data-testid={`expand-nav-${item.text.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedNav(expandedNav === item.text ? null : item.text);
                      }}
                      sx={{
                        ml: 0.5,
                        color: item.selected ? "text.primary" : "grey.400",
                        borderRadius: "8px",
                      }}
                    >
                      {expandedNav === item.text ? (
                        <ExpandLess fontSize="small" />
                      ) : (
                        <ExpandMore fontSize="small" />
                      )}
                    </IconButton>
                  </Box>
                ) : (
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    selected={item.selected}
                    data-testid={item.testId}
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
                )}
              </ListItem>
              {item.subitems &&
                expandedNav === item.text &&
                item.subitems.map((subitem, subindex) => (
                  <ListItem disablePadding key={subindex}>
                    <ListItemButton
                      component={Link}
                      href={subitem.href}
                      selected={subitem.selected}
                      data-testid={subitem.testId}
                      sx={{
                        pl: "48px",
                        borderRadius: "8px",
                        color: subitem.selected ? "text.primary" : "grey.400",
                      }}
                    >
                      {subitem.icon && (
                        <ListItemIcon
                          sx={{
                            color: subitem.selected ? "text.primary" : "grey.400",
                            minWidth: "30px",
                          }}
                        >
                          {subitem.icon}
                        </ListItemIcon>
                      )}
                      <ListItemText
                        disableTypography
                        sx={{
                          color: subitem.selected ? "text.primary" : "grey.400",
                          fontFamily: "Inter",
                          fontSize: "13px",
                          fontStyle: "normal",
                          fontWeight: 400,
                          lineHeight: "19px",
                          letterSpacing: "0.26px",
                        }}
                      >
                        {subitem.text}
                      </ListItemText>
                    </ListItemButton>
                  </ListItem>
                ))}
            </React.Fragment>
          ))}
        </List>
      </Box>

      <Divider sx={{ width: "100%", mt: "12px" }} />

      <Box
        sx={{
          width: "100%",
          p: 1.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: "#F5F5F5",
          flexShrink: 0,
        }}
      >
        {isPlatformAdmin && (
          <ListItemButton
            component={Link}
            href="/admin"
            selected={pathname.startsWith("/admin")}
            data-testid="nav-platform-admin"
            sx={{
              px: "12px",
              borderRadius: "8px",
              color: pathname.startsWith("/admin") ? "text.primary" : "grey.400",
              width: "100%",
              mb: 0.5,
            }}
          >
            <ListItemIcon
              sx={{
                color: pathname.startsWith("/admin") ? "text.primary" : "grey.400",
                minWidth: "30px",
              }}
            >
              <AdminPanelSettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              disableTypography
              sx={{
                color: pathname.startsWith("/admin") ? "text.primary" : "grey.400",
                fontFamily: "Inter",
                fontSize: "14px",
                fontStyle: "normal",
                fontWeight: 500,
                lineHeight: "21px",
                letterSpacing: "0.28px",
              }}
            >
              Platform Admin
            </ListItemText>
          </ListItemButton>
        )}
        <ListItemButton
          component={Link}
          href={`/app/${currentWorkspace?.id}/settings`}
          selected={pathname === `/app/${currentWorkspace?.id}/settings`}
          data-testid="nav-settings"
          sx={{
            px: "12px",
            borderRadius: "8px",
            color:
              pathname === `/app/${currentWorkspace?.id}/settings` ? "text.primary" : "grey.400",
            width: "100%",
          }}
        >
          <ListItemIcon
            sx={{
              color:
                pathname === `/app/${currentWorkspace?.id}/settings` ? "text.primary" : "grey.400",
              minWidth: "30px",
            }}
          >
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            disableTypography
            sx={{
              color:
                pathname === `/app/${currentWorkspace?.id}/settings` ? "text.primary" : "grey.400",
              fontFamily: "Inter",
              fontSize: "14px",
              fontStyle: "normal",
              fontWeight: 500,
              lineHeight: "21px",
              letterSpacing: "0.28px",
            }}
          >
            Settings
          </ListItemText>
        </ListItemButton>
      </Box>
    </Box>
  );
};
