"use client";

import { PriceSearchInterface } from "@/ui/prices/PriceSearchInterface";
import { useParams } from "next/navigation";

export default function PriceSearchPage() {
  const params = useParams();
  const workspaceId = params.workspace_id as string;

  return <PriceSearchInterface workspaceId={workspaceId} />;
}
