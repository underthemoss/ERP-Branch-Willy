"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { LogIn } from "lucide-react";
import { usePathname } from "next/navigation";

/**
 * 🔐 Auth banner for quote pages
 * Shows a sign-in button for unauthenticated users that redirects back after auth
 */
export function AuthBanner() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const pathname = usePathname();

  // Don't show banner while loading or if already authenticated
  if (isLoading || isAuthenticated) {
    return null;
  }

  const handleSignIn = () => {
    loginWithRedirect({
      appState: {
        returnTo: pathname, // Return to the current quote after authentication
      },
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800 shadow-md">
      <div className="container mx-auto max-w-4xl px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Sign in for full access</h3>
              <p className="text-blue-100 text-sm">
                View your order history, track shipments, and manage your account
              </p>
            </div>
          </div>
          <button
            onClick={handleSignIn}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-blue-50 text-blue-700 font-medium rounded-lg transition-colors shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
