"use client";

import { useFetchWorkspacesQuery } from "@/graphql/hooks";
import { Box, LinearProgress } from "@mui/material";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { data, loading } = useFetchWorkspacesQuery();
  useEffect(() => {
    if (!loading && data?.listWorkspaces?.items.length) {
      redirect(`/app/${data?.listWorkspaces?.items[0].id}`);
    }
  }, [data, loading]);

  return (
    <>
      <LinearProgress></LinearProgress>Loading workspaces...
    </>
  );
}
