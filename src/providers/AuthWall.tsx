"use client";

import { exchangeTokenForCookie } from "@/lib/exchangeTokenForCookie";
import { useAuth0 } from "@auth0/auth0-react";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useConfig } from "./ConfigProvider";
import { useJwtOverride } from "./JwtOverrideContext";

export const AuthWall: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const jwtOverride = useJwtOverride();
  const { setCookieUrl } = useConfig();

  useEffect(() => {
    if (jwtOverride) {
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
          loginWithRedirect();
          return;
        }

        if (e.error === "consent_required") {
          loginWithRedirect();
          return;
        }

        // Check for specific error message about USER role
        if (e.message && e.message.includes("User must have the USER role to authenticate")) {
          redirect("/auth/no-access");
          return;
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
