"use client";

import { RequireAuth } from "@/providers/AuthWall";

interface OrdersLayoutProps {
  children: React.ReactNode;
}

export default function OrdersLayout({ children }: OrdersLayoutProps) {
  return <RequireAuth>{children}</RequireAuth>;
}
