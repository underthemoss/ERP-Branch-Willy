"use client";

import WorkflowDesigner from "@/ui/workflows/WorkflowDesigner";
import { useParams } from "next/navigation";
import React from "react";

export default function WorkflowPage() {
  const { workflow_id } = useParams();
  return <WorkflowDesigner workflowId={workflow_id?.toString() || ""} />;
}
