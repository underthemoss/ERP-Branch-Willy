import { useFetchWorkspacesQuery } from "@/graphql/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BuildIcon from "@mui/icons-material/Build";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import PostAddIcon from "@mui/icons-material/PostAdd";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SettingsIcon from "@mui/icons-material/Settings";
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
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export const NavBar = () => {
  const { data } = useFetchWorkspacesQuery();
  const { user } = useAuth0();
  const pathname = usePathname();
  const [expandedNav, setExpandedNav] = React.useState<string | null>(null);
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

        <Box sx={{ display: "flex", width: "100%", justifyContent: "flex-end" }}>
          <IconButton size="small" className="brian">
            <UnfoldMoreIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ width: "100%", my: "12px" }} />

      <Box className="navmenu" sx={{ width: "100%", flex: 1 }}>
        <List disablePadding>
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
      <Box
        sx={{
          width: "100%",
          borderTop: "1px solid #eee",
          p: 1.5,
          display: "flex",
          alignItems: "center",
          position: "relative",
          bottom: 0,
          left: 0,
          bgcolor: "#F5F5F5",
        }}
      >
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
