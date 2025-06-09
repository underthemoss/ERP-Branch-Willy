"use client";

import { useFetchWorkspacesQuery } from "@/graphql/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { Box, LinearProgress } from "@mui/material";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { user } = useAuth0();
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
