"use client";

import { exchangeTokenForCookie } from "@/lib/exchangeTokenForCookie";
import { useAuth0 } from "@auth0/auth0-react";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useConfig } from "./ConfigProvider";
import { useJwtOverride } from "./JwtOverrideContext";

/**
 * RequireAuth enforces authentication for a route.
 * Wrap route content with this component to require users to be authenticated.
 *
 * - Obtains Auth0 access token (or uses JWT override from URL hash)
 * - Exchanges token for HTTP-only cookie for server-side auth
 * - Redirects to login if not authenticated
 * - Redirects to error pages for auth failures
 *
 * @example
 * ```tsx
 * // In a layout.tsx file for protected routes:
 * export default function ProtectedLayout({ children }) {
 *   return (
 *     <ProviderComposer>
 *       <RequireAuth>
 *         {children}
 *       </RequireAuth>
 *     </ProviderComposer>
 *   );
 * }
 * ```
 */
export const RequireAuth: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const jwtOverride = useJwtOverride();
  const { setCookieUrl } = useConfig();

  useEffect(() => {
    if (jwtOverride) {
      // Exchange the JWT override for an HTTP-only cookie
      // so that browser-native requests (like <img>) can authenticate
      exchangeTokenForCookie(jwtOverride, setCookieUrl);
      return;
    }

    getAccessTokenSilently({ cacheMode: "on" })
      .then((token) => {
        // After successfully obtaining the token, exchange it for an HTTP-only cookie
        exchangeTokenForCookie(token, setCookieUrl);
      })
      .catch((e) => {
        console.error("Auth0 error:", e);

        if (e.error === "login_required") {
          loginWithRedirect({
            appState: { returnTo: window.location.pathname + window.location.search },
          });
          return;
        }

        if (e.error === "consent_required") {
          loginWithRedirect({
            appState: { returnTo: window.location.pathname + window.location.search },
          });
          return;
        }

        // Check for specific error message about USER role
        if (e.message && e.message.includes("User must have the USER role to authenticate")) {
          redirect("/auth/no-access");
        }

        // Redirect to error page with error details
        const errorParams = new URLSearchParams();
        if (e.error) {
          errorParams.append("error", e.error);
        }
        if (e.error_description || e.message) {
          errorParams.append("error_description", e.error_description || e.message);
        }

        const errorUrl = `/auth/error${errorParams.toString() ? `?${errorParams.toString()}` : ""}`;
        redirect(errorUrl);
      });
  }, [jwtOverride, getAccessTokenSilently, loginWithRedirect, setCookieUrl]);

  return children;
};

/**
 * @deprecated Use RequireAuth instead. This alias exists for backwards compatibility.
 */
export const AuthWall = RequireAuth;
