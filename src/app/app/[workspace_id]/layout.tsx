"use client";

import { AppChrome } from "@/ui/AppChrome";
import { DashboardLayout } from "@/ui/DashboardLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppChrome>
      <DashboardLayout>{children}</DashboardLayout>
    </AppChrome>
  );
}
