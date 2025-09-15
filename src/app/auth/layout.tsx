"use client";

import { ProviderComposer } from "@/providers/ProviderComposer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <ProviderComposer>{children}</ProviderComposer>;
}
