import { ProviderComposerNoAuth } from "@/providers/ProviderComposer";
import { AppChrome } from "@/ui/AppChrome";
import React from "react";

interface IntakeFormLayoutProps {
  children: React.ReactNode;
}
/**
 * ProviderComposer consolidates all application providers in a single component.
 * This maintains the correct nesting order while keeping the layout clean.
 */
export default function IntakeFormLayout({ children }: IntakeFormLayoutProps) {
  return (
    <ProviderComposerNoAuth>
      <AppChrome>{children}</AppChrome>
    </ProviderComposerNoAuth>
  );
}
