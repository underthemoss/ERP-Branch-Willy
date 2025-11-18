"use client";

import { ReactNode } from "react";
import { ProviderComposerNoAuth } from "@/providers/ProviderComposer";

export default function QuoteLayout({ children }: { children: ReactNode }) {
  return <ProviderComposerNoAuth>{children}</ProviderComposerNoAuth>;
}
