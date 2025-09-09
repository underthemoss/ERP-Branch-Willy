"use client";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // AppContextResolver handles all context checking globally
  // This layout can now focus on app-specific layout concerns if needed
  return <>{children}</>;
}
