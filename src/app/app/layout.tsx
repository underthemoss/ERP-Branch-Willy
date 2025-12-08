"use client";

import { RequireAuth } from "@/providers/AuthWall";
import { ProviderComposer } from "@/providers/ProviderComposer";
import { WorkspaceProvider } from "@/providers/WorkspaceProvider";
import { WorkspaceContextResolver } from "./WorkspaceContextResolver";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProviderComposer>
      <RequireAuth>
        <WorkspaceProvider>
          <WorkspaceContextResolver>{children}</WorkspaceContextResolver>
        </WorkspaceProvider>
      </RequireAuth>
    </ProviderComposer>
  );
}
