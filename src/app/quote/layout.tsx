"use client";

import { ProviderComposerNoAuth } from "@/providers/ProviderComposer";
import { ReactNode } from "react";

export default function QuoteLayout({ children }: { children: ReactNode }) {
  return <ProviderComposerNoAuth>{children}</ProviderComposerNoAuth>;
}
