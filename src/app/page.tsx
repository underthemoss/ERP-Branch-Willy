"use client";

import { useAuth } from "@/providers/Auth0ClientProvider";
import { Box } from "@mui/material";
import { redirect } from "next/navigation";

export default function Page() {
  const { user } = useAuth();

  if (user) {
    redirect("/app/");
  }

  return <Box></Box>;
}
