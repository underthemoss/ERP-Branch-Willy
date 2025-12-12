"use client";

import { useParams } from "next/navigation";
import { StudioLayout } from "./components/StudioLayout";

export default function StudioPage() {
  const params = useParams();
  const workspaceId = params.workspace_id as string;

  return <StudioLayout workspaceId={workspaceId} />;
}
