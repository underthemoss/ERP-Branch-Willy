"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function RootPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading } = useAuth0();

  // Check if this is an Auth0 callback (has code and state params)
  const isAuth0Callback = searchParams.has("code") && searchParams.has("state");

  useEffect(() => {
    // If this is an Auth0 callback, let the Auth0Provider handle it
    // The onRedirectCallback in Auth0ClientProvider will handle the navigation
    if (isAuth0Callback) {
      return;
    }

    // Wait until Auth0 is done loading to avoid race conditions
    if (!isLoading) {
      // Check if there's a post-logout return URL stored
      const logoutReturnTo = sessionStorage.getItem("logoutReturnTo");
      if (logoutReturnTo) {
        sessionStorage.removeItem("logoutReturnTo");
        router.replace(logoutReturnTo);
        return;
      }

      // Default: redirect to /app
      router.replace("/app");
    }
  }, [isAuth0Callback, isLoading, router]);

  return null;
}
