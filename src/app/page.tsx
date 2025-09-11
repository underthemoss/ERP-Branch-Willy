"use client";

import { useWorkspace } from "@/providers/WorkspaceProvider";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { selectedWorkspace } = useWorkspace();

  useEffect(() => {
    // Once we have a selected workspace, redirect to the app
    if (selectedWorkspace) {
      redirect(`/app/${selectedWorkspace}`);
    }
  }, [selectedWorkspace]);

  // AppContextResolver handles all loading states and selection screens
  // This component will only render if context is resolved but no workspace is selected
  // which shouldn't happen in normal flow
  return <></>;
}
