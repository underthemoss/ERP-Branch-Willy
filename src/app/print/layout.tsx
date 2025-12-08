"use client";

import { RequireAuth } from "@/providers/AuthWall";
import { ProviderComposer } from "@/providers/ProviderComposer";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProviderComposer>
      <RequireAuth>{children}</RequireAuth>
    </ProviderComposer>
  );
}
