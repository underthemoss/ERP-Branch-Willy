"use client";

import { ProviderComposer } from "@/providers/ProviderComposer";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <ProviderComposer>{children}</ProviderComposer>;
}
