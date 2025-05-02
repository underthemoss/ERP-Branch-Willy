"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { Box } from "@mui/material";
import { redirect } from "next/navigation";

export default function Page() {
  const { user } = useAuth0();

  if (user) {
    redirect("/app/");
  }

  return <Box></Box>;
}
