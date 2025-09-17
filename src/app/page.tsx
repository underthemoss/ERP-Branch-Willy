"use client";

import { ProviderComposer } from "@/providers/ProviderComposer";
import { useSelectedWorkspace } from "@/providers/WorkspaceProvider";
import { redirect } from "next/navigation";
import { useEffect } from "react";

function PageContent() {
  const selectedWorkspace = useSelectedWorkspace();

  useEffect(() => {
    // Once we have a selected workspace, redirect to the app
    if (selectedWorkspace) {
      redirect(`/app/${selectedWorkspace.id}`);
    }
  }, [selectedWorkspace]);

  // AppContextResolver handles all loading states and selection screens
  // This component will only render if context is resolved but no workspace is selected
  // which shouldn't happen in normal flow
  return <></>;
}

export default function Page() {
  return (
    <ProviderComposer>
      <PageContent />
    </ProviderComposer>
  );
}
