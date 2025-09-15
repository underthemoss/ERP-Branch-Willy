import { ApolloClientProvider } from "@/providers/ApolloProvider";
import { DatadogRumProvider } from "@/providers/DatadogRumProvider";
import { ProviderComposerNoAuth } from "@/providers/ProviderComposer";
import React from "react";

interface IntakeFormLayoutProps {
  children: React.ReactNode;
}
/**
 * ProviderComposer consolidates all application providers in a single component.
 * This maintains the correct nesting order while keeping the layout clean.
 */
export default function IntakeFormLayout({ children }: IntakeFormLayoutProps) {
  return <ProviderComposerNoAuth>{children}</ProviderComposerNoAuth>;
}
