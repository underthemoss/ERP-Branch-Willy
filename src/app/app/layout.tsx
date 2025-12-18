"use client";

import { RequireAuth } from "@/providers/AuthWall";
import { ClientOnlyProvider } from "@/providers/ClientOnlyProvider";
import { WorkspaceProvider } from "@/providers/WorkspaceProvider";
import { WorkspaceContextResolver } from "./WorkspaceContextResolver";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnlyProvider>
      <RequireAuth>
        <WorkspaceProvider>
          <WorkspaceContextResolver>{children}</WorkspaceContextResolver>
        </WorkspaceProvider>
      </RequireAuth>
    </ClientOnlyProvider>
  );
}
