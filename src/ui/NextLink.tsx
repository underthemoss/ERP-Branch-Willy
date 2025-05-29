"use client";

import Link from "@mui/material/Link";
import { useRouter } from "next/navigation";

export const NextLink = (props: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) => {
  const router = useRouter();
  return (
    <Link
      onClick={() => !props.disabled && router.push(props.href)}
      sx={{
        color: "inherit",
        textDecoration: "none",
        cursor: "pointer",
        "&:hover": {
          textDecoration: "none",
        },
      }}
    >
      {props.children}
    </Link>
  );
};

export const NextLinkBack = (props: { children: React.ReactNode }) => {
  const router = useRouter();
  return <Link onClick={() => router.back()}>{props.children}</Link>;
};
