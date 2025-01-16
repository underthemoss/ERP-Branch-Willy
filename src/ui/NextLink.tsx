"use client";
import { Link } from "@mui/joy";
import { useRouter } from "next/navigation";

export const NextLink = (props: {
  href: string;
  children: React.ReactNode;
}) => {
  const router = useRouter();
  return <Link onClick={() => router.push(props.href)}>{props.children}</Link>;
};

export const NextLinkBack = (props: { children: React.ReactNode }) => {
  const router = useRouter();
  return <Link onClick={() => router.back()}>{props.children}</Link>;
};
