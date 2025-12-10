"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { ClipboardList, LogIn, LogOut, Printer, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSearchBox } from "react-instantsearch";
import { useCart } from "../context/CartContext";

// Search Bar Component
function SearchBar() {
  const { query, refine } = useSearchBox();
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={localQuery}
        onChange={(e) => {
          setLocalQuery(e.target.value);
          refine(e.target.value);
        }}
        placeholder="Search equipment..."
        className="w-full pl-4 pr-20 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
      />

      {/* Right-side buttons container */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
        {localQuery && (
          <button
            onClick={() => {
              setLocalQuery("");
              refine("");
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        <button className="p-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors cursor-pointer">
          <svg
            className="w-4 h-4 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface CatalogHeaderProps {
  projectName: string;
  companyName: string;
  logoUrl?: string;
  formId: string;
}

export default function CatalogHeader({
  projectName,
  companyName,
  logoUrl,
  formId,
}: CatalogHeaderProps) {
  const cart = useCart();
  const totalItems = cart.getTotalItems();
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0();

  const handleLogin = () => {
    loginWithRedirect({
      appState: {
        returnTo: window.location.pathname + window.location.search,
      },
    });
  };

  const handleLogout = () => {
    // Store the return URL in sessionStorage so the root page can redirect back after logout
    sessionStorage.setItem("logoutReturnTo", window.location.pathname + window.location.search);
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      {/* Top Section - Branding, Search, Cart */}
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo/Branding */}
          <div className="flex items-center gap-3 shrink-0 min-w-0 sm:min-w-[200px]">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-10 w-auto object-contain" />
            ) : (
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg">
                  {companyName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{projectName}</h1>
              <p className="text-xs text-gray-500">{companyName}</p>
            </div>
          </div>

          {/* Search Bar - Centered */}
          <div className="flex-1 max-w-2xl mx-auto">
            <SearchBar />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0 min-w-0 sm:min-w-[200px] justify-end">
            {/* My Orders Button */}
            <Link
              href={`/intake-form/${formId}/orders`}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              <span>My Orders</span>
            </Link>

            {/* Print Flyer Button */}
            <Link
              href={`/intake-form/${formId}/bulletin-post`}
              className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Flyer</span>
            </Link>

            {/* Login/Logout Button */}
            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title={user?.email || "Logout"}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden md:inline">Login</span>
                  </button>
                )}
              </>
            )}

            {/* Cart Icon Button */}
            <button
              onClick={cart.toggleDrawer}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <ShoppingCart
                className={`w-7 h-7 text-gray-700 ${cart.cartAnimation ? "animate-bounce" : ""}`}
              />
              {totalItems > 0 && (
                <span
                  className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center transition-transform ${cart.cartAnimation ? "scale-125" : "scale-100"}`}
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
