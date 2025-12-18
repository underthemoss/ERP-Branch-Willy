"use client";

import {
  useSelectedWorkspace,
  useSelectedWorkspaceId,
  useWorkspace,
} from "@/providers/WorkspaceProvider";
import { WorkspaceAccessIcon } from "@/ui/workspace/WorkspaceAccessIcon";
import { useAuth0 } from "@auth0/auth0-react";
import {
  ArrowLeftRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  DollarSign,
  FileQuestion,
  FileText,
  FolderOpen,
  Home,
  LogOut,
  Mail,
  Package,
  Receipt,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  TrendingUp,
  Truck,
  User,
  Users,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

interface NavBarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

// Theme configuration
const theme = {
  sidebar: "bg-white",
  text: "text-gray-900",
  textMuted: "text-gray-500",
  textSecondary: "text-gray-600",
  hover: "hover:bg-gray-50",
  selected: "bg-gray-100",
  selectedText: "text-blue-600 font-medium",
  border: "border-gray-200",
  divider: "bg-gray-200",
  avatar: "bg-gray-100",
  dropdown: "bg-white",
  dropdownHover: "hover:bg-gray-100",
  submenuBg: "bg-gray-100",
};

const NavBarContent: React.FC<{
  onNavigate?: () => void;
}> = ({ onNavigate }) => {
  const currentWorkspace = useSelectedWorkspace();
  const currentWorkspaceId = useSelectedWorkspaceId();
  const { workspaces, selectWorkspace } = useWorkspace();
  const { user, logout } = useAuth0();
  const pathname = usePathname();
  const router = useRouter();

  // Check if user has PLATFORM_ADMIN role
  const roles = user?.["https://erp.estrack.com/es_erp_roles"] || [];
  const isPlatformAdmin = roles.includes("PLATFORM_ADMIN");

  const [expandedNav, setExpandedNav] = useState<Set<string>>(new Set());
  const [expandedWorkspaces, setExpandedWorkspaces] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
    setUserMenuOpen(false);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  // Navigation menu items type
  type NavItem = {
    text: string;
    href: string;
    icon: React.ReactElement;
    selected: boolean;
    testId: string;
    subitems?: NavItem[];
  };

  // Navigation menu items
  const navItems: NavItem[] = [
    {
      text: "Home",
      href: `/app/${currentWorkspace?.id}`,
      icon: <Home size={18} />,
      selected: pathname === `/app/${currentWorkspace?.id}`,
      testId: "nav-home",
    },
    {
      text: "Sales",
      href: `/app/${currentWorkspace?.id}/sales-orders`,
      icon: <TrendingUp size={18} />,
      selected:
        pathname?.startsWith(`/app/${currentWorkspace?.id}/sales-orders`) ||
        pathname?.startsWith(`/app/${currentWorkspace?.id}/invoices`) ||
        pathname?.startsWith(`/app/${currentWorkspace?.id}/sales-quotes`) ||
        pathname?.startsWith(`/app/${currentWorkspace?.id}/requests`),
      testId: "nav-sales",
      subitems: [
        {
          text: "Requests",
          href: `/app/${currentWorkspace?.id}/requests`,
          icon: <Mail size={18} />,
          selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/requests`),
          testId: "nav-requests",
        },
        {
          text: "Sales Orders",
          href: `/app/${currentWorkspace?.id}/sales-orders`,
          icon: <ArrowLeftRight size={18} />,
          selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/sales-orders`),
          testId: "nav-sales-order",
        },
        {
          text: "Invoices",
          href: `/app/${currentWorkspace?.id}/invoices`,
          icon: <Receipt size={18} />,
          selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/invoices`),
          testId: "nav-invoices",
        },
      ],
    },
    {
      text: "Purchasing",
      href: `/app/${currentWorkspace?.id}/purchase-orders`,
      icon: <ShoppingCart size={18} />,
      selected:
        pathname?.startsWith(`/app/${currentWorkspace?.id}/purchase-orders`) ||
        pathname?.startsWith(`/app/${currentWorkspace?.id}/my-requests`),
      testId: "nav-purchasing",
      subitems: [
        {
          text: "My Requests",
          href: `/app/${currentWorkspace?.id}/my-requests`,
          icon: <ClipboardList size={18} />,
          selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/my-requests`),
          testId: "nav-my-requests",
        },
        {
          text: "Purchase Orders",
          href: `/app/${currentWorkspace?.id}/purchase-orders`,
          icon: <FileText size={18} />,
          selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/purchase-orders`),
          testId: "nav-purchase-order",
        },
      ],
    },
    {
      text: "Fulfillment",
      href: `/app/${currentWorkspace?.id}/rental-fulfillments`,
      icon: <Truck size={18} />,
      selected:
        pathname?.startsWith(`/app/${currentWorkspace?.id}/rental-fulfillments`) ||
        pathname?.startsWith(`/app/${currentWorkspace?.id}/inventory`),
      testId: "nav-fulfillment",
      subitems: [
        {
          text: "Rental Fulfillments",
          href: `/app/${currentWorkspace?.id}/rental-fulfillments`,
          icon: <CalendarDays size={18} />,
          selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/rental-fulfillments`),
          testId: "nav-rental-fulfillment",
        },
        {
          text: "Inventory",
          href: `/app/${currentWorkspace?.id}/inventory`,
          icon: <Package size={18} />,
          selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/inventory`),
          testId: "nav-inventory",
        },
      ],
    },
    {
      text: "Prices",
      href: `/app/${currentWorkspace?.id}/prices`,
      icon: <DollarSign size={18} />,
      selected: pathname.startsWith(`/app/${currentWorkspace?.id}/prices`),
      testId: "nav-prices",
    },
    {
      text: "Projects",
      href: `/app/${currentWorkspace?.id}/projects`,
      icon: <FolderOpen size={18} />,
      selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/projects`),
      testId: "nav-projects",
    },
    {
      text: "Contacts",
      href: `/app/${currentWorkspace?.id}/contacts`,
      icon: <Users size={18} />,
      selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/contacts`),
      testId: "nav-contacts",
    },
    {
      text: "Resources",
      href: `/app/${currentWorkspace?.id}/resources/inventory`,
      icon: <Package size={18} />,
      selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/resources`),
      testId: "nav-resources",
      subitems: [
        {
          text: "Inventory",
          href: `/app/${currentWorkspace?.id}/resources/inventory`,
          icon: <Package size={18} />,
          selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/resources/inventory`),
          testId: "nav-resources-inventory",
        },
      ],
    },
    {
      text: "Sales Channels",
      href: `/app/${currentWorkspace?.id}/store-fronts`,
      icon: <Building2 size={18} />,
      selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/store-fronts`),
      testId: "nav-sales-channels",
      subitems: [
        {
          text: "Store Fronts",
          href: `/app/${currentWorkspace?.id}/store-fronts`,
          icon: <Building2 size={18} />,
          selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/store-fronts`),
          testId: "nav-store-fronts",
        },
      ],
    },
  ];

  // Add admin-only menu items
  if (isPlatformAdmin) {
    const salesGroup = navItems[1];
    if (salesGroup.subitems) {
      // Insert Sales Quotes at index 1 (after Requests)
      salesGroup.subitems.splice(1, 0, {
        text: "Sales Quotes",
        href: `/app/${currentWorkspace?.id}/sales-quotes`,
        icon: <FileQuestion size={18} />,
        selected: pathname?.startsWith(`/app/${currentWorkspace?.id}/sales-quotes`),
        testId: "nav-sales-quotes",
      });
    }
    navItems.splice(3, 0, {
      text: "Search",
      href: `/app/${currentWorkspace?.id}/search/assets`,
      icon: <Search size={18} />,
      selected: pathname.startsWith(`/app/${currentWorkspace?.id}/search`),
      testId: "nav-search",
      subitems: [
        {
          text: "Assets",
          href: `/app/${currentWorkspace?.id}/search/assets`,
          icon: <Package size={18} />,
          selected: pathname === `/app/${currentWorkspace?.id}/search/assets`,
          testId: "nav-search-assets",
        },
        {
          text: "Orders",
          href: `/app/${currentWorkspace?.id}/search/orders`,
          icon: <FileText size={18} />,
          selected: pathname === `/app/${currentWorkspace?.id}/search/orders`,
          testId: "nav-search-orders",
        },
        {
          text: "Rentals",
          href: `/app/${currentWorkspace?.id}/search/rentals`,
          icon: <CalendarDays size={18} />,
          selected: pathname === `/app/${currentWorkspace?.id}/search/rentals`,
          testId: "nav-search-rentals",
        },
        {
          text: "Products",
          href: `/app/${currentWorkspace?.id}/search/products`,
          icon: <Building2 size={18} />,
          selected: pathname === `/app/${currentWorkspace?.id}/search/products`,
          testId: "nav-search-products",
        },
        {
          text: "Categories",
          href: `/app/${currentWorkspace?.id}/search/categories`,
          icon: <FolderOpen size={18} />,
          selected: pathname === `/app/${currentWorkspace?.id}/search/categories`,
          testId: "nav-search-categories",
        },
        {
          text: "Prices",
          href: `/app/${currentWorkspace?.id}/search/prices`,
          icon: <DollarSign size={18} />,
          selected: pathname === `/app/${currentWorkspace?.id}/search/prices`,
          testId: "nav-search-prices",
        },
      ],
    });
  }

  // Auto-expand nav groups when their children are selected
  useEffect(() => {
    // Check which nav groups have selected children and expand them
    const workspaceBase = `/app/${currentWorkspace?.id}`;
    const groupsToExpand: string[] = [];

    // Check Sales group
    if (
      pathname?.startsWith(`${workspaceBase}/sales-orders`) ||
      pathname?.startsWith(`${workspaceBase}/invoices`) ||
      pathname?.startsWith(`${workspaceBase}/sales-quotes`) ||
      pathname?.startsWith(`${workspaceBase}/requests`)
    ) {
      groupsToExpand.push("Sales");
    }

    // Check Purchasing group
    if (
      pathname?.startsWith(`${workspaceBase}/purchase-orders`) ||
      pathname?.startsWith(`${workspaceBase}/my-requests`)
    ) {
      groupsToExpand.push("Purchasing");
    }

    // Check Fulfillment group
    if (
      pathname?.startsWith(`${workspaceBase}/rental-fulfillments`) ||
      pathname?.startsWith(`${workspaceBase}/inventory`)
    ) {
      groupsToExpand.push("Fulfillment");
    }

    // Check Search group (admin only)
    if (pathname?.startsWith(`${workspaceBase}/search`)) {
      groupsToExpand.push("Search");
    }

    // Check Resources group
    if (pathname?.startsWith(`${workspaceBase}/resources`)) {
      groupsToExpand.push("Resources");
    }

    // Check Sales Channels group
    if (pathname?.startsWith(`${workspaceBase}/store-fronts`)) {
      groupsToExpand.push("Sales Channels");
    }

    if (groupsToExpand.length > 0) {
      setExpandedNav((prev) => {
        const next = new Set(prev);
        groupsToExpand.forEach((group) => next.add(group));
        return next;
      });
    }
  }, [pathname, currentWorkspace?.id]);

  const toggleNavExpand = (text: string) => {
    setExpandedNav((prev) => {
      const next = new Set(prev);
      if (next.has(text)) {
        next.delete(text);
      } else {
        next.add(text);
      }
      return next;
    });
  };

  return (
    <aside className={`h-full w-full flex flex-col ${theme.sidebar}`}>
      {/* Header: Workspace + User */}
      <div className={`p-4 border-b ${theme.border}`}>
        <div className="flex items-center gap-2">
          {/* Workspace Avatar */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${theme.avatar} shadow-sm flex-shrink-0`}
          >
            {currentWorkspace?.logoUrl ? (
              <img
                src={currentWorkspace.logoUrl}
                alt=""
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className={`text-sm font-bold ${theme.text}`}>
                {currentWorkspace?.name?.slice(0, 1)}
              </span>
            )}
          </div>

          {/* Workspace Name & Email */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium truncate ${theme.text}`}>
                {currentWorkspace?.name}
              </span>
              <WorkspaceAccessIcon
                accessType={currentWorkspace?.accessType}
                size={14}
                color="#8B919E"
              />
            </div>
            <span className={`text-xs truncate block ${theme.textMuted}`}>{user?.email}</span>
          </div>

          {/* Workspace Expand */}
          <button
            onClick={() => setExpandedWorkspaces(!expandedWorkspaces)}
            data-testid="expand-workspaces"
            className={`p-1.5 rounded-lg transition-colors ${theme.hover} ${theme.textMuted}`}
          >
            {expandedWorkspaces ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`p-1.5 rounded-lg transition-colors ${theme.hover} ${theme.textMuted}`}
            >
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <User size={18} />
              )}
            </button>

            {/* User Dropdown */}
            {userMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-52 rounded-xl shadow-lg ${theme.dropdown} border ${theme.border} py-1 z-50`}
              >
                <div className={`px-3 py-2 ${theme.textMuted} text-sm flex items-center gap-2`}>
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <User size={18} />
                  )}
                  <span className="truncate">{user?.name || "Profile"}</span>
                </div>
                <div className={`h-px ${theme.divider} my-1`} />
                <button
                  onClick={() => {
                    handleNavigation("/");
                    setUserMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm ${theme.text} ${theme.dropdownHover} flex items-center gap-2 transition-colors`}
                >
                  <ArrowLeftRight size={18} />
                  Switch Workspace
                </button>
                <button
                  onClick={handleLogout}
                  className={`w-full px-3 py-2 text-left text-sm ${theme.text} ${theme.dropdownHover} flex items-center gap-2 transition-colors`}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expanded Workspaces List */}
        {expandedWorkspaces && workspaces && workspaces.length > 0 && (
          <div className="mt-4">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${theme.textMuted} px-2`}
            >
              Workspaces
            </span>
            <ul className="mt-2 space-y-1">
              {workspaces.map((workspace) => (
                <li key={workspace.id}>
                  <button
                    onClick={() => {
                      if (workspace.id && workspace.id !== currentWorkspaceId) {
                        selectWorkspace(workspace.id);
                        onNavigate?.();
                      }
                    }}
                    data-testid={`workspace-${workspace.id}`}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                      workspace.id === currentWorkspaceId
                        ? `${theme.selected} ${theme.selectedText}`
                        : `${theme.hover} ${theme.text}`
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${theme.avatar} shadow-sm flex-shrink-0`}
                    >
                      {workspace.logoUrl ? (
                        <img
                          src={workspace.logoUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-xs font-bold">{workspace.name?.slice(0, 1)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium truncate">{workspace.name}</span>
                        <WorkspaceAccessIcon
                          accessType={workspace.accessType}
                          size={14}
                          color={workspace.id === currentWorkspaceId ? "#1d4ed8" : "#8B919E"}
                        />
                      </div>
                      {workspace.description && (
                        <span className={`text-xs ${theme.textMuted} truncate block`}>
                          {workspace.description}
                        </span>
                      )}
                    </div>
                    {workspace.id === currentWorkspaceId && (
                      <Check size={18} className="flex-shrink-0" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navItems.map((item, index) => (
            <li key={index}>
              {item.subitems ? (
                <>
                  <div className="flex items-center">
                    <button
                      onClick={() => handleNavigation(item.href)}
                      data-testid={item.testId}
                      className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        item.selected ? theme.selectedText : `${theme.textSecondary} ${theme.hover}`
                      }`}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span>{item.text}</span>
                    </button>
                    <button
                      onClick={() => toggleNavExpand(item.text)}
                      data-testid={`expand-nav-${item.text.toLowerCase().replace(/\s+/g, "-")}`}
                      className={`p-1.5 rounded-lg transition-colors ${theme.hover} ${
                        item.selected ? theme.selectedText : theme.textMuted
                      }`}
                    >
                      {expandedNav.has(item.text) ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>
                  {expandedNav.has(item.text) && (
                    <div className={`mt-1 ml-2 ${theme.submenuBg} rounded-lg p-1`}>
                      <ul className="space-y-0.5">
                        {item.subitems.map((subitem, subindex) => (
                          <li key={subindex}>
                            <button
                              onClick={() => handleNavigation(subitem.href)}
                              data-testid={subitem.testId}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                subitem.selected
                                  ? theme.selectedText
                                  : `${theme.textMuted} hover:bg-white`
                              }`}
                            >
                              {subitem.text}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleNavigation(item.href)}
                  data-testid={item.testId}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.selected
                      ? `${theme.selected} ${theme.selectedText}`
                      : `${theme.textSecondary} ${theme.hover}`
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span>{item.text}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className={`p-2 border-t ${theme.border}`}>
        {isPlatformAdmin && (
          <button
            onClick={() => handleNavigation("/admin")}
            data-testid="nav-platform-admin"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
              pathname.startsWith("/admin")
                ? `${theme.selected} ${theme.selectedText}`
                : `${theme.textSecondary} ${theme.hover}`
            }`}
          >
            <Shield size={18} />
            <span>Platform Admin</span>
          </button>
        )}
        <button
          onClick={() => handleNavigation(`/app/${currentWorkspace?.id}/settings`)}
          data-testid="nav-settings"
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === `/app/${currentWorkspace?.id}/settings`
              ? `${theme.selected} ${theme.selectedText}`
              : `${theme.textSecondary} ${theme.hover}`
          }`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

export const NavBar: React.FC<NavBarProps> = ({ mobileOpen = false, onMobileClose }) => {
  return (
    <>
      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <div
            className={`fixed inset-y-0 left-0 w-72 z-50 md:hidden transform transition-transform duration-300 ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className={`h-full ${theme.sidebar}`}>
              <button
                onClick={onMobileClose}
                className={`absolute top-4 right-4 p-1.5 rounded-lg ${theme.hover} ${theme.textMuted}`}
              >
                <X size={20} />
              </button>
              <NavBarContent onNavigate={onMobileClose} />
            </div>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden md:flex flex-col h-screen w-72 flex-shrink-0 ${theme.sidebar}`}>
        <NavBarContent />
      </div>
    </>
  );
};
