"use client";

import { RequireAuth } from "@/providers/AuthWall";
import { ProviderComposer } from "@/providers/ProviderComposer";
import { ReactNode } from "react";

export default function QuoteLayout({ children }: { children: ReactNode }) {
  return (
    <ProviderComposer>
      <RequireAuth>{children}</RequireAuth>
    </ProviderComposer>
  );
}
