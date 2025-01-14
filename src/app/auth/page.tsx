"use client";

import { Box, Typography } from "@mui/joy";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ClientAuth() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jwt = searchParams.get("jwt");

  useEffect(() => {
    if (jwt) {
      document.cookie = `jwt=${jwt}; path=/; max-age=3600; secure; samesite=strict`;
      router.push("/");
    }
  }, [jwt]);

  if (jwt) return <></>;
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        bgcolor: "background.body",
        p: 3,
      }}
    >
      <Typography
        level="h1"
        component="h1"
        sx={{
          fontSize: "3rem",
          mb: 2,
          color: "text.primary",
        }}
      >
        Could not authenticate
      </Typography>
      <Typography
        level="body-md"
        sx={{
          mb: 4,
          textAlign: "center",
          maxWidth: 400,
        }}
      >
        ...
      </Typography>
    </Box>
  );
}
