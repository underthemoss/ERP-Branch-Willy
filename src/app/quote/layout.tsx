"use client";

import { ProviderComposer } from "@/providers/ProviderComposer";
import { ReactNode } from "react";

export default function QuoteLayout({ children }: { children: ReactNode }) {
  return <ProviderComposer>{children}</ProviderComposer>;
}
