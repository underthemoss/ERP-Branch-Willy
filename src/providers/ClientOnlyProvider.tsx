"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import ProviderComposer with SSR disabled to avoid localStorage issues
const ProviderComposer = dynamic(
  () => import("@/providers/ProviderComposer").then((mod) => mod.ProviderComposer),
  {
    ssr: false,
    loading: () => null,
  },
);

export function ClientOnlyProvider({ children }: { children: React.ReactNode }) {
  return <ProviderComposer>{children}</ProviderComposer>;
}
