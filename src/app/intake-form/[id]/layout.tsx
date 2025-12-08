"use client";

import { ProviderComposer } from "@/providers/ProviderComposer";
import { AppChrome } from "@/ui/AppChrome";
import React from "react";

interface IntakeFormLayoutProps {
  children: React.ReactNode;
}

export default function IntakeFormLayout({ children }: IntakeFormLayoutProps) {
  return (
    <ProviderComposer>
      <AppChrome>{children}</AppChrome>
    </ProviderComposer>
  );
}
