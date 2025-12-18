"use client";

import { useEffect, useState } from "react";

// This component ensures we only load the app providers on the client side
// The @auth0/auth0-react package imports browser-tabs-lock which accesses
// localStorage at module import time, causing SSR to fail.
export default function ClientApp({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [ProviderComposer, setProviderComposer] = useState<React.ComponentType<{
    children: React.ReactNode;
  }> | null>(null);

  useEffect(() => {
    setMounted(true);
    // Dynamically import ProviderComposer only after mounting on client
    import("@/providers/ProviderComposer").then((mod) => {
      setProviderComposer(() => mod.ProviderComposer);
    });
  }, []);

  if (!mounted || !ProviderComposer) {
    // Return minimal loading state during SSR and initial client render
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return <ProviderComposer>{children}</ProviderComposer>;
}
