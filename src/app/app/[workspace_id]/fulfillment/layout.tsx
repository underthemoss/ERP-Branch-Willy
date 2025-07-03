"use client";

import { AppChrome } from "@/ui/AppChrome";
import { DashboardLayout } from "@/ui/DashboardLayout";

export default function Layout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
