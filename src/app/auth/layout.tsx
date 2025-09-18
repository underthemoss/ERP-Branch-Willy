"use client";

import { ProviderComposerNoAuth } from "@/providers/ProviderComposer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <ProviderComposerNoAuth>{children}</ProviderComposerNoAuth>;
}
